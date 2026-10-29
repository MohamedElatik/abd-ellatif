begin;

-- Ownership, activation and enrollment are managed by the project owner in
-- Supabase. Browser users cannot insert or update any authorization records.
create table public.video_students (
  user_id uuid primary key references auth.users(id) on delete cascade,
  disabled boolean not null default false
);
create table public.video_enrollments (
  user_id uuid not null references public.video_students(user_id) on delete cascade,
  course_id text not null,
  active boolean not null default true,
  expires_at timestamptz not null,
  primary key (user_id, course_id)
);
create table public.video_lessons (
  lecture_id text primary key check (lecture_id ~ '^[a-zA-Z0-9_-]{1,100}$'),
  course_id text not null,
  video_id text not null check (video_id ~ '^[a-zA-Z0-9_-]{1,100}$'),
  published boolean not null default false
);
create table public.video_playback_limits (
  user_id uuid primary key references auth.users(id) on delete cascade,
  window_start timestamptz not null,
  requests integer not null check (requests > 0)
);
alter table public.video_students enable row level security;
alter table public.video_enrollments enable row level security;
alter table public.video_lessons enable row level security;
alter table public.video_playback_limits enable row level security;
revoke all on public.video_students, public.video_enrollments, public.video_lessons, public.video_playback_limits from anon, authenticated;
grant select on public.video_students, public.video_enrollments to authenticated;
create policy read_own_student on public.video_students for select to authenticated using ((select auth.uid()) = user_id);
create policy read_own_enrollments on public.video_enrollments for select to authenticated using ((select auth.uid()) = user_id);

create function public.authorize_video_playback(requested_lecture text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  student_id uuid := auth.uid();
  selected_video text;
  request_count integer;
  now_at timestamptz := clock_timestamp();
begin
  if student_id is null then return jsonb_build_object('status', 'denied'); end if;
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
revoke all on function public.authorize_video_playback(text) from public, anon;
grant execute on function public.authorize_video_playback(text) to authenticated;

commit;
