-- Isolated fixtures, all changes rolled back. Run as project database owner.
begin;
do $$
declare
  student uuid := gen_random_uuid();
  other_student uuid := gen_random_uuid();
  session uuid := gen_random_uuid();
  lesson text := 'test_' || replace(gen_random_uuid()::text, '-', '');
  result jsonb;
begin
  if has_function_privilege('anon', 'public.authorize_video_playback(text)', 'EXECUTE') then raise exception 'anon can invoke authorization'; end if;
  if has_table_privilege('authenticated', 'public.video_enrollments', 'INSERT,UPDATE,DELETE') then raise exception 'students can alter enrollments'; end if;
  if has_table_privilege('authenticated', 'public.video_lessons', 'SELECT,INSERT,UPDATE,DELETE') then raise exception 'students can access private video mappings'; end if;
  insert into auth.users(id,email,email_confirmed_at) values(student,student::text || '@example.invalid',now()),(other_student,other_student::text || '@example.invalid',now());
  insert into auth.sessions(id,user_id,created_at,updated_at) values(session,student,now(),now());
  perform set_config('request.jwt.claims', jsonb_build_object('sub',student,'role','authenticated','session_id',session)::text, true);
  insert into public.video_students(user_id) values(student),(other_student);
  insert into public.video_lessons(lecture_id,course_id,video_id,published) values(lesson,'test-course','test-video',true);
  result := public.authorize_video_playback(lesson);
  if result->>'status' <> 'denied' then raise exception 'unenrolled student allowed'; end if;
  insert into public.video_enrollments(user_id,course_id,expires_at) values(other_student,'test-course',now()+interval '1 day');
  if public.authorize_video_playback(lesson)->>'status' <> 'denied' then raise exception 'another student entitlement accepted'; end if;
  insert into public.video_enrollments(user_id,course_id,expires_at) values(student,'test-course',now()-interval '1 day');
  if public.authorize_video_playback(lesson)->>'status' <> 'denied' then raise exception 'expired enrollment accepted'; end if;
  update public.video_enrollments set expires_at=now()+interval '1 day',active=false where user_id=student;
  if public.authorize_video_playback(lesson)->>'status' <> 'denied' then raise exception 'revoked enrollment accepted'; end if;
  update public.video_enrollments set active=true where user_id=student;
  update public.video_students set disabled=true where user_id=student;
  if public.authorize_video_playback(lesson)->>'status' <> 'denied' then raise exception 'disabled student accepted'; end if;
  update public.video_students set disabled=false where user_id=student;
  update public.video_lessons set published=false where lecture_id=lesson;
  if public.authorize_video_playback(lesson)->>'status' <> 'denied' then raise exception 'unpublished video accepted'; end if;
  update public.video_lessons set published=true where lecture_id=lesson;
  perform set_config('request.jwt.claims', jsonb_build_object('sub',student,'role','authenticated','session_id',gen_random_uuid())::text, true);
  if public.authorize_video_playback(lesson)->>'status' <> 'denied' then raise exception 'revoked session accepted'; end if;
  perform set_config('request.jwt.claims', jsonb_build_object('sub',student,'role','authenticated','session_id',session)::text, true);
  result := public.authorize_video_playback(lesson);
  if result->>'status' <> 'allowed' or result->>'user_id' <> student::text or result->>'video_id' <> 'test-video' then raise exception 'valid enrollment not accepted'; end if;
  for n in 2..20 loop
    if public.authorize_video_playback(lesson)->>'status' <> 'allowed' then raise exception 'rate limited too early'; end if;
  end loop;
  if public.authorize_video_playback(lesson)->>'status' <> 'rate_limited' then raise exception 'rate limit missing'; end if;
  update public.video_playback_limits set window_start=now()-interval '2 minutes' where user_id=student;
  if public.authorize_video_playback(lesson)->>'status' <> 'allowed' then raise exception 'rate window failed to reset'; end if;
  perform set_config('request.jwt.claims', '{}', true);
  if public.authorize_video_playback(lesson)->>'status' <> 'denied' then raise exception 'unauthenticated caller accepted'; end if;
end $$;
select 'all authorization checks passed; fixtures rolled back' as result;
rollback;
