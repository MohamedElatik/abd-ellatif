-- Teacher controls and attendance codes:
--   * every student account gets a short 6-digit attendance code (new signups and existing accounts)
--   * a "secretary" role (set by the teacher) that can only record attendance by code
--   * the teacher can delete student accounts and remove exam results
--   * a public image bucket for course pictures that only the teacher can write to
begin;

-- ---------- roles ----------
create function video_private.is_platform_secretary() returns boolean language sql stable security definer set search_path='' as $$
select auth.uid() is not null and exists(select 1 from auth.users u join auth.sessions s on s.user_id=u.id where u.id=auth.uid() and u.raw_app_meta_data->>'role'='secretary' and u.email_confirmed_at is not null and not coalesce(u.is_anonymous,false) and (u.banned_until is null or u.banned_until<=now()) and s.id::text=(auth.jwt()->>'session_id') and (s.not_after is null or s.not_after>now()));
$$;
create function video_private.is_attendance_staff() returns boolean language sql stable security definer set search_path='' as $$
select video_private.is_platform_admin() or video_private.is_platform_secretary();
$$;
revoke all on function video_private.is_platform_secretary(),video_private.is_attendance_staff() from public,anon;
grant execute on function video_private.is_platform_secretary(),video_private.is_attendance_staff() to authenticated;

-- ---------- attendance codes ----------
create table public.platform_student_codes(
  user_id uuid primary key references auth.users(id) on delete cascade,
  code text not null unique check (code ~ '^[1-9][0-9]{5}$'),
  created_at timestamptz not null default now()
);
alter table public.platform_student_codes enable row level security;
revoke all on public.platform_student_codes from public,anon,authenticated;
grant select on public.platform_student_codes to authenticated;
create policy codes_read on public.platform_student_codes for select to authenticated
  using((user_id=auth.uid() and video_private.has_active_session()) or video_private.is_attendance_staff());

-- Assigns a random unused 6-digit code; retries on the (rare) collision.
create function video_private.ensure_student_code(target uuid) returns void language plpgsql volatile security definer set search_path='' as $$
begin
  for attempt in 1..25 loop
    begin
      insert into public.platform_student_codes(user_id,code)
      values(target,(100000+floor(random()*900000))::int::text)
      on conflict (user_id) do nothing;
      return;
    exception when unique_violation then null; -- code already taken: try another
    end;
  end loop;
  raise exception 'Could not assign an attendance code';
end $$;
revoke all on function video_private.ensure_student_code(uuid) from public,anon,authenticated;

create function video_private.assign_code_on_signup() returns trigger language plpgsql security definer set search_path='' as $$
begin
  perform video_private.ensure_student_code(new.id);
  return new;
end $$;
revoke all on function video_private.assign_code_on_signup() from public,anon,authenticated;
create trigger platform_assign_student_code after insert on auth.users
  for each row when (not coalesce(new.is_anonymous,false))
  execute function video_private.assign_code_on_signup();

-- Existing accounts get a code too.
do $$ declare u uuid; begin
  for u in select id from auth.users where not coalesce(is_anonymous,false) loop
    perform video_private.ensure_student_code(u);
  end loop;
end $$;

-- Student directory now shows the short code and leaves out secretaries.
create or replace function video_private.list_platform_students()
returns jsonb language plpgsql security definer set search_path = '' as $$
begin
if not video_private.is_platform_admin() then raise insufficient_privilege using message='Admin access required'; end if;
return coalesce((select jsonb_agg(row_data order by registered_at desc) from (
select u.created_at as registered_at, jsonb_build_object(
'id',u.id,'name',coalesce(nullif(u.raw_user_meta_data->>'name',''),'طالب'),
'email',u.email,'phone',coalesce(u.raw_user_meta_data->>'phone',''),
'parentPhone',coalesce(u.raw_user_meta_data->>'parentPhone',''),
'governorate',coalesce(u.raw_user_meta_data->>'governorate',''),
'grade','sec3','role','student','studentCode',coalesce(c.code,''),
'createdAt',to_char(u.created_at,'YYYY-MM-DD'),'confirmed',u.email_confirmed_at is not null,
'enrolledCourses',coalesce((select jsonb_agg(e.course_id) from public.video_enrollments e where e.user_id=u.id and e.active and e.expires_at>now()),'[]'::jsonb),
'completedLectures','[]'::jsonb,'examAttempts','[]'::jsonb
) as row_data from auth.users u left join public.platform_student_codes c on c.user_id=u.id
where coalesce(u.raw_app_meta_data->>'role','student') not in ('admin','teacher','secretary')
and not coalesce(u.is_anonymous,false) and coalesce(u.raw_user_meta_data->>'grade','sec3')='sec3'
order by u.created_at desc limit 1000
) rows),'[]'::jsonb);
end $$;

-- ---------- attendance by code (teacher or secretary) ----------
create function video_private.record_attendance_by_code(student_code text,session_title text,session_date date,attendance_status text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare student auth.users; found_code text; title text:=trim(coalesce(session_title,'')); rec_id text; doc jsonb;
begin
  if not video_private.is_attendance_staff() then raise insufficient_privilege; end if;
  if attendance_status is null or attendance_status not in ('present','absent','late','excused') then raise exception 'Invalid status'; end if;
  if length(title) not between 1 and 200 then raise exception 'Invalid session title'; end if;
  if session_date is null or session_date not between current_date-366 and current_date+31 then raise exception 'Invalid session date'; end if;
  select u.* into student from public.platform_student_codes c join auth.users u on u.id=c.user_id
   where c.code=trim(coalesce(student_code,''))
     and coalesce(u.raw_app_meta_data->>'role','student') not in ('admin','teacher','secretary');
  if student.id is null then return jsonb_build_object('status','not_found'); end if;
  select code into found_code from public.platform_student_codes where user_id=student.id;
  rec_id:=student.id::text||'|'||to_char(session_date,'YYYY-MM-DD')||'|'||title;
  doc:=jsonb_build_object('id',rec_id,'studentId',student.id,
    'studentName',coalesce(nullif(student.raw_user_meta_data->>'name',''),'طالب'),
    'studentPhone',coalesce(student.raw_user_meta_data->>'phone',''),
    'parentPhone',coalesce(nullif(student.raw_user_meta_data->>'parentPhone',''),student.raw_user_meta_data->>'phone',''),
    'grade','sec3','sessionTitle',title,'date',to_char(session_date,'YYYY-MM-DD'),'status',attendance_status,
    'studentCode',found_code,'recordedBy',auth.uid(),'recordedAt',to_char(now(),'YYYY-MM-DD HH24:MI'));
  insert into public.platform_attendance(id,student_id,document) values(rec_id,student.id,doc)
    on conflict (id) do update set document=excluded.document;
  return jsonb_build_object('status','saved','record',doc);
end $$;
create function public.record_attendance_by_code(student_code text,session_title text,session_date date,attendance_status text)
returns jsonb language sql security invoker set search_path='' as $$ select video_private.record_attendance_by_code(student_code,session_title,session_date,attendance_status); $$;

create function video_private.list_session_attendance(session_title text,session_date date) returns jsonb
language plpgsql security definer set search_path='' as $$
begin
  if not video_private.is_attendance_staff() then raise insufficient_privilege; end if;
  return coalesce((select jsonb_agg(a.document order by a.document->>'recordedAt' desc nulls last)
    from public.platform_attendance a
    where a.document->>'sessionTitle'=trim(coalesce(session_title,'')) and a.document->>'date'=to_char(session_date,'YYYY-MM-DD')),'[]'::jsonb);
end $$;
create function public.list_session_attendance(session_title text,session_date date) returns jsonb
language sql security invoker set search_path='' as $$ select video_private.list_session_attendance(session_title,session_date); $$;

-- ---------- secretary accounts (teacher only) ----------
create function video_private.set_platform_secretary(account_email text,make_secretary boolean) returns jsonb
language plpgsql security definer set search_path='' as $$
declare target auth.users;
begin
  if not video_private.is_platform_admin() then raise insufficient_privilege; end if;
  if make_secretary is null then raise exception 'Invalid secretary role'; end if;
  select * into target from auth.users where lower(email)=lower(trim(coalesce(account_email,''))) and not coalesce(is_anonymous,false) for update;
  if target.id is null then return jsonb_build_object('status','not_found'); end if;
  if target.id=auth.uid() or coalesce(target.raw_app_meta_data->>'role','') in ('admin','teacher') then return jsonb_build_object('status','not_allowed'); end if;
  update auth.users set raw_app_meta_data = case when make_secretary
      then coalesce(raw_app_meta_data,'{}'::jsonb)||'{"role":"secretary"}'::jsonb
      else coalesce(raw_app_meta_data,'{}'::jsonb)-'role' end
    where id=target.id and (make_secretary or raw_app_meta_data->>'role'='secretary');
  return jsonb_build_object('status','saved','id',target.id,'email',target.email,
    'name',coalesce(nullif(target.raw_user_meta_data->>'name',''),target.email),'secretary',make_secretary);
end $$;
create function public.set_platform_secretary(account_email text,make_secretary boolean) returns jsonb
language sql security invoker set search_path='' as $$ select video_private.set_platform_secretary(account_email,make_secretary); $$;

create function video_private.list_platform_secretaries() returns jsonb language plpgsql security definer set search_path='' as $$
begin
  if not video_private.is_platform_admin() then raise insufficient_privilege; end if;
  return coalesce((select jsonb_agg(jsonb_build_object('id',u.id,'email',u.email,'name',coalesce(nullif(u.raw_user_meta_data->>'name',''),u.email)) order by u.email)
    from auth.users u where u.raw_app_meta_data->>'role'='secretary'),'[]'::jsonb);
end $$;
create function public.list_platform_secretaries() returns jsonb language sql security invoker set search_path='' as $$ select video_private.list_platform_secretaries(); $$;

-- ---------- deleting (teacher only) ----------
create function video_private.delete_platform_attempts(attempt_ids uuid[]) returns integer
language plpgsql security definer set search_path='' as $$
declare removed integer;
begin
  if not video_private.is_platform_admin() then raise insufficient_privilege; end if;
  if attempt_ids is null or cardinality(attempt_ids) not between 1 and 1000 then raise exception 'Invalid attempts'; end if;
  delete from public.platform_attempts where id=any(attempt_ids);
  get diagnostics removed=row_count;
  return removed;
end $$;
create function public.delete_platform_attempts(attempt_ids uuid[]) returns integer
language sql security invoker set search_path='' as $$ select video_private.delete_platform_attempts(attempt_ids); $$;

create function video_private.delete_student_attempts(student uuid) returns integer
language plpgsql security definer set search_path='' as $$
declare removed integer;
begin
  if not video_private.is_platform_admin() then raise insufficient_privilege; end if;
  delete from public.platform_attempts where student_id=student;
  get diagnostics removed=row_count;
  return removed;
end $$;
create function public.delete_student_attempts(student uuid) returns integer
language sql security invoker set search_path='' as $$ select video_private.delete_student_attempts(student); $$;

-- Deletes a student account and everything that belongs to it. Staff accounts and yourself are refused.
create function video_private.delete_platform_student(target uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare victim auth.users;
begin
  if not video_private.is_platform_admin() then raise insufficient_privilege; end if;
  select * into victim from auth.users where id=target for update;
  if victim.id is null then return jsonb_build_object('status','not_found'); end if;
  if victim.id=auth.uid() or coalesce(victim.raw_app_meta_data->>'role','student') in ('admin','teacher','secretary') then
    return jsonb_build_object('status','not_allowed');
  end if;
  delete from public.platform_attendance where student_id=target;
  delete from public.platform_attempts where student_id=target;
  delete from public.platform_profiles where user_id=target;
  delete from auth.users where id=target; -- cascades: code, sessions, enrollments, playback limits
  return jsonb_build_object('status','deleted','id',target);
end $$;
create function public.delete_platform_student(target uuid) returns jsonb
language sql security invoker set search_path='' as $$ select video_private.delete_platform_student(target); $$;

revoke all on function
  video_private.record_attendance_by_code(text,text,date,text), public.record_attendance_by_code(text,text,date,text),
  video_private.list_session_attendance(text,date), public.list_session_attendance(text,date),
  video_private.set_platform_secretary(text,boolean), public.set_platform_secretary(text,boolean),
  video_private.list_platform_secretaries(), public.list_platform_secretaries(),
  video_private.delete_platform_attempts(uuid[]), public.delete_platform_attempts(uuid[]),
  video_private.delete_student_attempts(uuid), public.delete_student_attempts(uuid),
  video_private.delete_platform_student(uuid), public.delete_platform_student(uuid)
from public,anon;
grant execute on function
  video_private.record_attendance_by_code(text,text,date,text), public.record_attendance_by_code(text,text,date,text),
  video_private.list_session_attendance(text,date), public.list_session_attendance(text,date),
  video_private.set_platform_secretary(text,boolean), public.set_platform_secretary(text,boolean),
  video_private.list_platform_secretaries(), public.list_platform_secretaries(),
  video_private.delete_platform_attempts(uuid[]), public.delete_platform_attempts(uuid[]),
  video_private.delete_student_attempts(uuid), public.delete_student_attempts(uuid),
  video_private.delete_platform_student(uuid), public.delete_platform_student(uuid)
to authenticated;

-- ---------- course images ----------
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('course-images','course-images',true,3145728,array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public=true,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
create policy course_images_select on storage.objects for select to authenticated
  using(bucket_id='course-images' and (select video_private.is_platform_admin()));
create policy course_images_insert on storage.objects for insert to authenticated
  with check(bucket_id='course-images' and (select video_private.is_platform_admin()));
create policy course_images_update on storage.objects for update to authenticated
  using(bucket_id='course-images' and (select video_private.is_platform_admin()))
  with check(bucket_id='course-images' and (select video_private.is_platform_admin()));
create policy course_images_delete on storage.objects for delete to authenticated
  using(bucket_id='course-images' and (select video_private.is_platform_admin()));

commit;
