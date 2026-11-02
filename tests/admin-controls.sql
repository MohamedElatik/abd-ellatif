-- Attendance codes, secretary role, deleting students/results, course image bucket.
-- Isolated fixtures, all changes rolled back. Run as project database owner.
begin;
do $$
declare
  adm uuid:=gen_random_uuid(); adm_s uuid:=gen_random_uuid();
  sec uuid:=gen_random_uuid(); sec_s uuid:=gen_random_uuid();
  stu uuid:=gen_random_uuid(); stu_s uuid:=gen_random_uuid();
  other uuid:=gen_random_uuid();
  att1 uuid:=gen_random_uuid(); att2 uuid:=gen_random_uuid(); att3 uuid:=gen_random_uuid();
  stu_code text; sec_code text; result jsonb; n integer;
begin
  if has_function_privilege('anon','public.record_attendance_by_code(text,text,date,text)','EXECUTE')
     or has_function_privilege('anon','public.delete_platform_student(uuid)','EXECUTE')
     or has_function_privilege('anon','public.delete_platform_attempts(uuid[])','EXECUTE')
     or has_function_privilege('anon','public.set_platform_secretary(text,boolean)','EXECUTE')
     or has_function_privilege('authenticated','video_private.ensure_student_code(uuid)','EXECUTE')
     or has_table_privilege('authenticated','public.platform_student_codes','INSERT,UPDATE,DELETE')
     or has_table_privilege('anon','public.platform_student_codes','SELECT')
  then raise exception 'excess grants'; end if;

  insert into auth.users(id,email,email_confirmed_at,raw_app_meta_data,raw_user_meta_data) values
    (adm,'teacher@example.invalid',now(),'{"role":"admin"}','{"name":"المدرس"}'),
    (sec,'secretary@example.invalid',now(),'{}','{"name":"السكرتير"}'),
    (stu,'student@example.invalid',now(),'{}','{"name":"أحمد علي","phone":"01000000000","parentPhone":"01111111111"}'),
    (other,'other@example.invalid',now(),'{}','{"name":"طالب آخر"}');
  insert into auth.sessions(id,user_id) values(adm_s,adm),(sec_s,sec),(stu_s,stu);

  -- every signup gets a unique 6-digit code
  select code into stu_code from public.platform_student_codes where user_id=stu;
  select code into sec_code from public.platform_student_codes where user_id=sec;
  if stu_code !~ '^[1-9][0-9]{5}$' or sec_code is null then raise exception 'codes not assigned: % %',stu_code,sec_code; end if;
  if (select count(distinct code) from public.platform_student_codes where user_id in (adm,sec,stu,other))<>4 then raise exception 'codes not unique'; end if;

  -- a student cannot use attendance or teacher tools
  perform set_config('request.jwt.claims',jsonb_build_object('sub',stu,'role','authenticated','session_id',stu_s)::text,true);
  begin perform public.record_attendance_by_code(stu_code,'حصة 1',current_date,'present'); raise exception 'student recorded attendance'; exception when insufficient_privilege then null; end;
  begin perform public.list_session_attendance('حصة 1',current_date); raise exception 'student listed attendance'; exception when insufficient_privilege then null; end;
  begin perform public.delete_platform_student(other); raise exception 'student deleted user'; exception when insufficient_privilege then null; end;
  begin perform public.set_platform_secretary('student@example.invalid',true); raise exception 'student promoted self'; exception when insufficient_privilege then null; end;

  -- the teacher makes an account a secretary; the teacher and own account are refused
  perform set_config('request.jwt.claims',jsonb_build_object('sub',adm,'role','authenticated','session_id',adm_s)::text,true);
  result:=public.set_platform_secretary('SECRETARY@example.invalid',true);
  if result->>'status'<>'saved' then raise exception 'secretary not set'; end if;
  if public.set_platform_secretary('teacher@example.invalid',true)->>'status'<>'not_allowed' then raise exception 'teacher demoted'; end if;
  if public.set_platform_secretary('nobody@example.invalid',true)->>'status'<>'not_found' then raise exception 'missing account'; end if;
  if jsonb_array_length(public.list_platform_secretaries())<>1 then raise exception 'secretary list'; end if;
  if exists(select 1 from jsonb_array_elements(public.list_platform_students()) x where x->>'id' in (adm::text,sec::text)) then raise exception 'staff in student list'; end if;
  if not exists(select 1 from jsonb_array_elements(public.list_platform_students()) x where x->>'id'=stu::text and x->>'studentCode'=stu_code) then raise exception 'student code not listed'; end if;

  -- the secretary records attendance by code, and only that
  perform set_config('request.jwt.claims',jsonb_build_object('sub',sec,'role','authenticated','session_id',sec_s)::text,true);
  result:=public.record_attendance_by_code(' '||stu_code||' ','حصة 1',current_date,'present');
  if result->>'status'<>'saved' or result->'record'->>'studentName'<>'أحمد علي' or result->'record'->>'parentPhone'<>'01111111111' then raise exception 'attendance not saved: %',result; end if;
  if result->'record'->>'id'<>stu::text||'|'||to_char(current_date,'YYYY-MM-DD')||'|حصة 1' then raise exception 'record id format'; end if;
  result:=public.record_attendance_by_code(stu_code,'حصة 1',current_date,'late');
  if (select count(*) from public.platform_attendance where student_id=stu)<>1 or result->'record'->>'status'<>'late' then raise exception 'attendance not updated in place'; end if;
  if public.record_attendance_by_code('999999','حصة 1',current_date,'present')->>'status'<>'not_found' and not exists(select 1 from public.platform_student_codes where code='999999') then raise exception 'unknown code accepted'; end if;
  if public.record_attendance_by_code(sec_code,'حصة 1',current_date,'present')->>'status'<>'not_found' then raise exception 'staff code accepted'; end if;
  begin perform public.record_attendance_by_code(stu_code,'حصة 1',current_date,'gone'); raise exception 'bad status'; exception when others then if sqlerrm not like 'Invalid status%' then raise; end if; end;
  begin perform public.record_attendance_by_code(stu_code,'  ',current_date,'present'); raise exception 'blank title'; exception when others then if sqlerrm not like 'Invalid session title%' then raise; end if; end;
  if jsonb_array_length(public.list_session_attendance('حصة 1',current_date))<>1 then raise exception 'session list'; end if;
  begin perform public.list_platform_students(); raise exception 'secretary listed students'; exception when insufficient_privilege then null; end;
  begin perform public.delete_platform_student(stu); raise exception 'secretary deleted student'; exception when insufficient_privilege then null; end;
  begin perform public.delete_platform_attempts(array[att1]); raise exception 'secretary deleted results'; exception when insufficient_privilege then null; end;
  begin perform public.set_platform_secretary('other@example.invalid',true); raise exception 'secretary promoted'; exception when insufficient_privilege then null; end;
  perform set_config('request.jwt.claims',jsonb_build_object('sub',sec,'role','authenticated','session_id',gen_random_uuid())::text,true);
  begin perform public.record_attendance_by_code(stu_code,'حصة 1',current_date,'present'); raise exception 'revoked secretary session'; exception when insufficient_privilege then null; end;

  -- deleting results
  insert into public.platform_quizzes(id,document) values('test_quiz_del','{"id":"test_quiz_del","title":"T","grade":"sec3","questions":[{"id":"q1"}]}');
  insert into public.platform_attempts(id,student_id,quiz_id,document) values(att1,stu,'test_quiz_del','{}'),(att2,stu,'test_quiz_del','{}'),(att3,other,'test_quiz_del','{}');
  perform set_config('request.jwt.claims',jsonb_build_object('sub',adm,'role','authenticated','session_id',adm_s)::text,true);
  -- (call first, check after: one statement would read the rows as they were before the delete)
  n:=public.delete_platform_attempts(array[att1]);
  if n<>1 or exists(select 1 from public.platform_attempts where id=att1) then raise exception 'result not deleted'; end if;
  n:=public.delete_student_attempts(stu);
  if n<>1 or exists(select 1 from public.platform_attempts where student_id=stu) then raise exception 'student results not deleted'; end if;
  if not exists(select 1 from public.platform_attempts where id=att3) then raise exception 'other results deleted'; end if;

  -- deleting a student removes the account and everything attached; staff and self are refused
  insert into public.platform_profiles(user_id,avatar) values(stu,'data:image/png;base64,AAAA');
  insert into public.platform_attempts(id,student_id,quiz_id,document) values(att1,stu,'test_quiz_del','{}');
  if public.delete_platform_student(adm)->>'status'<>'not_allowed' then raise exception 'self delete'; end if;
  if public.delete_platform_student(sec)->>'status'<>'not_allowed' then raise exception 'secretary deleted'; end if;
  if public.delete_platform_student(gen_random_uuid())->>'status'<>'not_found' then raise exception 'missing student'; end if;
  result:=public.delete_platform_student(stu);
  if result->>'status'<>'deleted' then raise exception 'student not deleted'; end if;
  if exists(select 1 from auth.users where id=stu) or exists(select 1 from auth.sessions where user_id=stu)
     or exists(select 1 from public.platform_student_codes where user_id=stu) or exists(select 1 from public.platform_attendance where student_id=stu)
     or exists(select 1 from public.platform_attempts where student_id=stu) or exists(select 1 from public.platform_profiles where user_id=stu)
  then raise exception 'student data left behind'; end if;

  -- demoting the secretary removes their access immediately
  result:=public.set_platform_secretary('secretary@example.invalid',false);
  if result->>'status'<>'saved' then raise exception 'demote'; end if;
  perform set_config('request.jwt.claims',jsonb_build_object('sub',sec,'role','authenticated','session_id',sec_s)::text,true);
  begin perform public.list_session_attendance('حصة 1',current_date); raise exception 'demoted secretary kept access'; exception when insufficient_privilege then null; end;
end $$;
rollback;

-- Row-level security as the real "authenticated" role: own code only; course images teacher-only.
begin;
select set_config('test.adm',gen_random_uuid()::text,true),set_config('test.adm_s',gen_random_uuid()::text,true),
       set_config('test.stu',gen_random_uuid()::text,true),set_config('test.stu_s',gen_random_uuid()::text,true),
       set_config('test.other',gen_random_uuid()::text,true);
insert into auth.users(id,email,email_confirmed_at,raw_app_meta_data) values
  (current_setting('test.adm')::uuid,'a@example.invalid',now(),'{"role":"admin"}'),
  (current_setting('test.stu')::uuid,'s@example.invalid',now(),'{}'),
  (current_setting('test.other')::uuid,'o@example.invalid',now(),'{}');
insert into auth.sessions(id,user_id) values(current_setting('test.adm_s')::uuid,current_setting('test.adm')::uuid),(current_setting('test.stu_s')::uuid,current_setting('test.stu')::uuid);
select set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('test.stu'),'session_id',current_setting('test.stu_s'),'role','authenticated')::text,true);
set local role authenticated;
do $$ begin
  if (select count(*) from public.platform_student_codes)<>1 or not exists(select 1 from public.platform_student_codes where user_id=auth.uid()) then raise exception 'student sees other codes'; end if;
  begin insert into storage.objects(bucket_id,name) values('course-images','courses/x.jpg'); raise exception 'student uploaded course image';
  exception when insufficient_privilege then null; end;
end $$;
reset role;
select set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('test.adm'),'session_id',current_setting('test.adm_s'),'role','authenticated')::text,true);
set local role authenticated;
do $$ begin
  insert into storage.objects(bucket_id,name) values('course-images','courses/ok.jpg');
  begin insert into storage.objects(bucket_id,name) values('other-bucket','x.jpg'); raise exception 'teacher wrote other bucket';
  exception when insufficient_privilege or foreign_key_violation then null; end;
  if (select count(*) from public.platform_student_codes)<3 then raise exception 'teacher cannot see codes'; end if;
end $$;
reset role;
do $$ begin
  if not (select public from storage.buckets where id='course-images') then raise exception 'bucket not public'; end if;
end $$;
rollback;
