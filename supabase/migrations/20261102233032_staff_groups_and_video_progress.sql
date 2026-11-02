-- Staff content editing, independent group sessions and private video progress.
create table public.attendance_sessions (
 id uuid primary key default gen_random_uuid(), title text not null check(length(title) between 1 and 200),
 session_date date not null, created_by uuid not null default auth.uid(), created_at timestamptz not null default now(),
 closed_at timestamptz, roster jsonb not null check(jsonb_typeof(roster)='array')
);
alter table public.attendance_sessions enable row level security;
revoke all on public.attendance_sessions from public,anon,authenticated;
grant select on public.attendance_sessions to authenticated;
create policy staff_sessions on public.attendance_sessions for select to authenticated using ((select video_private.is_attendance_staff()));
create table public.attendance_entries (
 session_id uuid not null references public.attendance_sessions(id) on delete cascade,
 student_id uuid not null, status text not null check(status in ('present','late','absent','excused')),
 recorded_by uuid not null, updated_at timestamptz not null default now(), primary key(session_id,student_id)
);
alter table public.attendance_entries enable row level security;
revoke all on public.attendance_entries from public,anon,authenticated;
grant select on public.attendance_entries to authenticated;
create policy staff_entries on public.attendance_entries for select to authenticated using ((select video_private.is_attendance_staff()));

create function video_private.attendance_directory() returns jsonb language plpgsql security definer set search_path='' as $$
begin
 if not video_private.is_attendance_staff() then raise insufficient_privilege; end if;
 return coalesce((select jsonb_agg(jsonb_build_object('id',u.id,'name',coalesce(u.raw_user_meta_data->>'name','طالب'),'code',c.code,
 'phone',coalesce(u.raw_user_meta_data->>'phone',''),'parentPhone',coalesce(nullif(u.raw_user_meta_data->>'parentPhone',''),u.raw_user_meta_data->>'phone','')) order by u.raw_user_meta_data->>'name')
 from auth.users u join public.platform_student_codes c on c.user_id=u.id where not coalesce(u.is_anonymous,false) and coalesce(u.raw_app_meta_data->>'role','student') not in ('teacher','admin','secretary')),'[]'::jsonb);
end $$;
create function video_private.open_attendance_group(group_title text, group_date date, students uuid[]) returns uuid language plpgsql security definer set search_path='' as $$
declare roster_data jsonb; new_id uuid;
begin
 if not video_private.is_attendance_staff() then raise insufficient_privilege; end if;
 if group_date is null or group_date not between current_date-366 and current_date+31 or nullif(trim(group_title),'') is null or length(group_title)>200 then raise exception 'Invalid session'; end if;
 if coalesce(cardinality(students),0) not between 1 and 2000 then raise exception 'Select students'; end if;
 select jsonb_agg(s) into roster_data from jsonb_array_elements(video_private.attendance_directory()) s where (s->>'id')::uuid=any(students);
 if jsonb_array_length(coalesce(roster_data,'[]'))<>(select count(distinct x) from unnest(students) x) then raise exception 'Invalid students'; end if;
 insert into public.attendance_sessions(title,session_date,roster) values(trim(group_title),group_date,roster_data) returning id into new_id;
 return new_id;
end $$;
create function video_private.mark_group_attendance(group_id uuid, student_code text, attendance_status text) returns void language plpgsql security definer set search_path='' as $$
declare s public.attendance_sessions; student uuid;
begin
 if not video_private.is_attendance_staff() then raise insufficient_privilege; end if;
 select * into s from public.attendance_sessions where id=group_id for update;
 if s.id is null or s.closed_at is not null then raise exception 'Session closed or missing'; end if;
 select (r->>'id')::uuid into student from jsonb_array_elements(s.roster) r where r->>'code'=trim(student_code);
 if student is null then raise exception 'Student not in this group'; end if;
 if attendance_status is null or attendance_status not in ('present','late','absent','excused') then raise exception 'Invalid status'; end if;
 insert into public.attendance_entries(session_id,student_id,status,recorded_by) values(group_id,student,attendance_status,auth.uid())
 on conflict(session_id,student_id) do update set status=excluded.status,recorded_by=excluded.recorded_by,updated_at=now();
end $$;
create function video_private.close_attendance_group(group_id uuid) returns void language plpgsql security definer set search_path='' as $$
declare s public.attendance_sessions;
begin
 if not video_private.is_attendance_staff() then raise insufficient_privilege; end if;
 select * into s from public.attendance_sessions where id=group_id for update;
 if s.id is null or (s.created_by<>auth.uid() and not video_private.is_platform_admin()) then raise insufficient_privilege; end if;
 update public.attendance_sessions set closed_at=coalesce(closed_at,now()) where id=group_id;
end $$;
create function video_private.attendance_group_rows(group_id uuid) returns jsonb language plpgsql security definer set search_path='' as $$
begin
 if not video_private.is_attendance_staff() then raise insufficient_privilege; end if;
 return coalesce((select jsonb_agg(r || jsonb_build_object('status',coalesce(e.status,case when s.closed_at is not null then 'absent' else 'unrecorded' end),'updatedAt',e.updated_at))
 from public.attendance_sessions s cross join lateral jsonb_array_elements(s.roster) r
 left join public.attendance_entries e on e.session_id=s.id and e.student_id=(r->>'id')::uuid where s.id=group_id),'[]'::jsonb);
end $$;

create table public.video_progress (
 user_id uuid not null references auth.users(id) on delete cascade, lecture_id text not null references public.platform_lectures(id) on delete cascade,
 position numeric not null default 0 check(position>=0), duration numeric not null check(duration>0 and duration<=86400),
 watched_seconds integer[] not null default '{}', updated_at timestamptz not null default now(), primary key(user_id,lecture_id)
);
alter table public.video_progress enable row level security;
revoke all on public.video_progress from public,anon,authenticated;
grant select on public.video_progress to authenticated;
create policy own_progress on public.video_progress for select to authenticated using(user_id=(select auth.uid()) and (select video_private.has_active_session()));
create function video_private.save_video_progress(lesson text, playback_position numeric, video_duration numeric, seconds_watched integer[]) returns void language plpgsql security definer set search_path='' as $$
begin
 if not video_private.has_active_session() then raise insufficient_privilege; end if;
 if video_duration is null or not (video_duration>0 and video_duration<=86400) or playback_position is null or not(playback_position>=0 and playback_position<=video_duration) or coalesce(cardinality(seconds_watched),0)>86400 then raise exception 'Invalid progress'; end if;
 if not exists(select 1 from public.platform_lectures l join public.platform_courses c on c.id=l.course_id where l.id=lesson and l.published and c.published) then raise insufficient_privilege; end if;
 insert into public.video_progress(user_id,lecture_id,position,duration,watched_seconds)
 values(auth.uid(),lesson,playback_position,video_duration,array(select distinct n from unnest(seconds_watched) n where n>=0 and n<video_duration))
 on conflict(user_id,lecture_id) do update set position=excluded.position,duration=excluded.duration,
 watched_seconds=array(select distinct n from unnest(public.video_progress.watched_seconds||excluded.watched_seconds) n where n>=0 and n<excluded.duration),updated_at=now();
end $$;

create function public.attendance_directory() returns jsonb language sql security invoker set search_path='' as $$select video_private.attendance_directory()$$;
create function public.open_attendance_group(group_title text,group_date date,students uuid[]) returns uuid language sql security invoker set search_path='' as $$select video_private.open_attendance_group(group_title,group_date,students)$$;
create function public.mark_group_attendance(group_id uuid,student_code text,attendance_status text) returns void language sql security invoker set search_path='' as $$select video_private.mark_group_attendance(group_id,student_code,attendance_status)$$;
create function public.close_attendance_group(group_id uuid) returns void language sql security invoker set search_path='' as $$select video_private.close_attendance_group(group_id)$$;
create function public.attendance_group_rows(group_id uuid) returns jsonb language sql security invoker set search_path='' as $$select video_private.attendance_group_rows(group_id)$$;
create function public.save_video_progress(lesson text,playback_position numeric,video_duration numeric,seconds_watched integer[]) returns void language sql security invoker set search_path='' as $$select video_private.save_video_progress(lesson,playback_position,video_duration,seconds_watched)$$;

revoke all on function public.attendance_directory(),video_private.attendance_directory(),public.open_attendance_group(text,date,uuid[]),video_private.open_attendance_group(text,date,uuid[]),public.mark_group_attendance(uuid,text,text),video_private.mark_group_attendance(uuid,text,text),public.close_attendance_group(uuid),video_private.close_attendance_group(uuid),public.attendance_group_rows(uuid),video_private.attendance_group_rows(uuid),public.save_video_progress(text,numeric,numeric,integer[]),video_private.save_video_progress(text,numeric,numeric,integer[]) from public,anon;
grant execute on function public.attendance_directory(),video_private.attendance_directory(),public.open_attendance_group(text,date,uuid[]),video_private.open_attendance_group(text,date,uuid[]),public.mark_group_attendance(uuid,text,text),video_private.mark_group_attendance(uuid,text,text),public.close_attendance_group(uuid),video_private.close_attendance_group(uuid),public.attendance_group_rows(uuid),video_private.attendance_group_rows(uuid),public.save_video_progress(text,numeric,numeric,integer[]),video_private.save_video_progress(text,numeric,numeric,integer[]) to authenticated;

-- Keep every content validation; extend only content-editing authorization.
do $$ declare d text; begin
 select pg_get_functiondef('video_private.save_platform_course(jsonb)'::regprocedure) into d;
 execute replace(d,'video_private.is_platform_admin()','video_private.is_attendance_staff()');
 select pg_get_functiondef('video_private.save_platform_lecture(jsonb,text)'::regprocedure) into d;
 execute replace(d,'video_private.is_platform_admin()','video_private.is_attendance_staff()');
end $$;
alter policy course_images_select on storage.objects using(bucket_id='course-images' and (select video_private.is_attendance_staff()));
alter policy course_images_insert on storage.objects with check(bucket_id='course-images' and (select video_private.is_attendance_staff()));
alter policy course_images_update on storage.objects using(bucket_id='course-images' and (select video_private.is_attendance_staff())) with check(bucket_id='course-images' and (select video_private.is_attendance_staff()));
-- Retain teacher-only deletion and role administration.
