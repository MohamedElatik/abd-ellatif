begin;
create schema if not exists video_private;
revoke all on schema video_private from public, anon;
grant usage on schema video_private to authenticated;
create function video_private.authorize_video_playback(requested_lecture text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  student_id uuid := auth.uid();
  selected_video text;
  request_count integer;
  now_at timestamptz := clock_timestamp();
begin
  if student_id is null then return jsonb_build_object('status', 'denied'); end if;
  if not exists (
    select 1 from auth.sessions s join auth.users u on u.id = s.user_id
    where s.user_id = student_id and s.id::text = (auth.jwt() ->> 'session_id')
      and u.email_confirmed_at is not null
      and coalesce(u.is_anonymous, false) = false
      and (u.banned_until is null or u.banned_until <= now_at)
      and (s.not_after is null or s.not_after > now_at)
  ) then return jsonb_build_object('status', 'denied'); end if;
  -- auth.uid() comes from the verified request, never from a function argument.
  select l.video_id into selected_video
  from public.video_lessons l
  join public.video_enrollments e on e.course_id = l.course_id and e.user_id = student_id
  join public.video_students s on s.user_id = e.user_id
  where l.lecture_id = requested_lecture and l.published = true
    and e.active = true and e.expires_at > now_at and s.disabled = false;
  if selected_video is null then return jsonb_build_object('status', 'denied'); end if;

  -- Atomic UPSERT: works across concurrent requests and Vercel instances.
  insert into public.video_playback_limits as lim (user_id, window_start, requests)
  values (student_id, now_at, 1)
  on conflict (user_id) do update set
    window_start = case when lim.window_start <= now_at - interval '1 minute' then now_at else lim.window_start end,
    requests = case when lim.window_start <= now_at - interval '1 minute' then 1 else least(lim.requests + 1, 21) end
  returning requests into request_count;
  if request_count > 20 then return jsonb_build_object('status', 'rate_limited'); end if;
  return jsonb_build_object('status', 'allowed', 'user_id', student_id, 'video_id', selected_video);
end;
$$;

revoke all on function video_private.authorize_video_playback(text) from public, anon;
grant execute on function video_private.authorize_video_playback(text) to authenticated;
create or replace function public.authorize_video_playback(requested_lecture text)
returns jsonb language sql security invoker set search_path = ''
as $$ select video_private.authorize_video_playback(requested_lecture); $$;
revoke all on function public.authorize_video_playback(text) from public, anon;
grant execute on function public.authorize_video_playback(text) to authenticated;
commit;
