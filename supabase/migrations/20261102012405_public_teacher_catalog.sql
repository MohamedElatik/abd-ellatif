begin;
-- Remove the existing catalog from publication, retaining records for recovery.
update public.video_lessons set published=false where published;
update public.platform_lectures set published=false where published;
update public.platform_courses set published=false where published;

create table video_private.public_playback_limits(scope text primary key, window_start timestamptz not null, requests integer not null);
alter table video_private.public_playback_limits enable row level security;
revoke all on video_private.public_playback_limits from public,anon,authenticated;
create function video_private.authorize_public_video_playback(requested_lecture text) returns jsonb language plpgsql security definer set search_path='' as $$
declare selected_video text; count_requests integer; now_at timestamptz:=clock_timestamp(); scope_key text;
begin
-- Intentionally accessible without identity: only teacher-published content is public.
select v.video_id into selected_video from public.video_lessons v
join public.platform_lectures l on l.id=v.lecture_id and l.course_id=v.course_id
join public.platform_courses c on c.id=l.course_id
where v.lecture_id=requested_lecture and v.published and l.published and c.published
and l.document->>'playbackProvider'='vdocipher';
if selected_video is null then return jsonb_build_object('status','denied');end if;
-- Shared atomic caps also bound provider costs across serverless instances.
foreach scope_key in array array['global','lecture:'||requested_lecture] loop
insert into video_private.public_playback_limits as lim(scope,window_start,requests) values(scope_key,now_at,1)
on conflict(scope) do update set
window_start=case when lim.window_start<=now_at-interval '1 minute' then now_at else lim.window_start end,
requests=case when lim.window_start<=now_at-interval '1 minute' then 1 else least(lim.requests+1,301) end
returning requests into count_requests;
if count_requests>(case when scope_key='global' then 300 else 120 end) then return jsonb_build_object('status','rate_limited');end if;
end loop;
return jsonb_build_object('status','allowed','video_id',selected_video);
end $$;
create function public.authorize_public_video_playback(requested_lecture text) returns jsonb language sql security invoker set search_path='' as $$select video_private.authorize_public_video_playback(requested_lecture);$$;
revoke all on function video_private.authorize_public_video_playback(text),public.authorize_public_video_playback(text) from public;
grant usage on schema video_private to anon;
grant execute on function video_private.authorize_public_video_playback(text),public.authorize_public_video_playback(text) to anon,authenticated;

create or replace function video_private.save_platform_course(course jsonb) returns void language plpgsql security definer set search_path='' as $$
begin
if not video_private.is_platform_admin() then raise insufficient_privilege;end if;
if course->>'grade' is distinct from 'sec3' or nullif(trim(course->>'title'),'') is null then raise exception 'Invalid course';end if;
course:=jsonb_set(jsonb_set(course,'{price}','0'),'{isFree}','true');
insert into public.platform_courses(id,document,price) values(course->>'id',course,0)
on conflict(id) do update set document=excluded.document,price=0;
end $$;
commit;
