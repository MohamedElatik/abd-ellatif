begin;
create function video_private.has_active_session() returns boolean language sql stable security definer set search_path='' as $$
select auth.uid() is not null and exists(select 1 from auth.users u join auth.sessions s on s.user_id=u.id where u.id=auth.uid() and u.email_confirmed_at is not null and not coalesce(u.is_anonymous,false) and (u.banned_until is null or u.banned_until<=now()) and s.id::text=(auth.jwt()->>'session_id') and (s.not_after is null or s.not_after>now()));
$$;
revoke all on function video_private.has_active_session() from public,anon;
grant execute on function video_private.has_active_session() to authenticated;
revoke select on public.platform_quizzes from authenticated;
create function video_private.list_platform_quizzes() returns jsonb language plpgsql security definer set search_path='' as $$
declare admin boolean:=video_private.is_platform_admin(); result jsonb;
begin
if not video_private.has_active_session() then raise insufficient_privilege; end if;
select coalesce(jsonb_agg(case when admin then q.document else jsonb_set(q.document,'{questions}',(select jsonb_agg(v-'correctAnswer'-'explanation') from jsonb_array_elements(q.document->'questions') v)) end order by q.created_at desc),'[]') into result from public.platform_quizzes q where q.published;
return result;
end $$;
create function public.list_platform_quizzes() returns jsonb language sql security invoker set search_path='' as $$ select video_private.list_platform_quizzes(); $$;
revoke all on function video_private.list_platform_quizzes(),public.list_platform_quizzes() from public,anon;
grant execute on function video_private.list_platform_quizzes(),public.list_platform_quizzes() to authenticated;
create table public.platform_attendance(id text primary key, student_id uuid not null references auth.users(id), document jsonb not null, unique(student_id,id));
alter table public.platform_attendance enable row level security;
revoke all on public.platform_attendance from public,anon,authenticated;
grant select,insert,update on public.platform_attendance to authenticated;
create policy attendance_read on public.platform_attendance for select to authenticated using((student_id=auth.uid() and video_private.has_active_session()) or video_private.is_platform_admin());
create policy attendance_insert on public.platform_attendance for insert to authenticated with check(video_private.is_platform_admin() and document->>'studentId'=student_id::text);
create policy attendance_update on public.platform_attendance for update to authenticated using(video_private.is_platform_admin()) with check(video_private.is_platform_admin() and document->>'studentId'=student_id::text);
create table public.platform_attempts(id uuid primary key, student_id uuid not null references auth.users(id), quiz_id text not null references public.platform_quizzes(id), document jsonb not null, created_at timestamptz not null default now());
alter table public.platform_attempts enable row level security;
revoke all on public.platform_attempts from public,anon,authenticated;
grant select on public.platform_attempts to authenticated;
create policy attempts_read on public.platform_attempts for select to authenticated using((student_id=auth.uid() and video_private.has_active_session()) or video_private.is_platform_admin());
create function video_private.submit_platform_quiz(quiz_id text,answers jsonb,attempt_id uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare quiz jsonb; q jsonb; a text; points numeric; score numeric:=0; total numeric:=0; correct_count int:=0; incorrect_count int:=0; unanswered int:=0; pct int; pending boolean:=false; result jsonb; student auth.users; existing jsonb;
begin
if not video_private.has_active_session() then raise insufficient_privilege; end if;
if jsonb_typeof(answers)<>'object' or octet_length(answers::text)>100000 then raise exception 'Invalid answers'; end if;
select document into existing from public.platform_attempts where id=attempt_id and student_id=auth.uid();
if existing is not null then return existing; end if;
select document into quiz from public.platform_quizzes p where p.id=quiz_id and p.published;
if quiz is null then raise exception 'Quiz unavailable'; end if;
select * into student from auth.users where id=auth.uid();
for q in select value from jsonb_array_elements(quiz->'questions') loop
points:=(q->>'points')::numeric; total:=total+points;a:=answers->>(q->>'id');
if a is null or length(trim(a))=0 then unanswered:=unanswered+1;
elsif q->>'type'='essay' then pending:=true;
elsif a=q->>'correctAnswer' then score:=score+points; correct_count:=correct_count+1;
else incorrect_count:=incorrect_count+1; end if;
end loop;
pct:=case when total>0 then round(score*100/total) else 0 end;
result:=jsonb_build_object('id',attempt_id,'quizId',quiz_id,'quizTitle',quiz->>'title','studentId',auth.uid(),'studentName',student.raw_user_meta_data->>'name','studentPhone',student.raw_user_meta_data->>'phone','grade','sec3','score',score,'totalPoints',total,'percentage',pct,'isPassed',not pending and pct>=(quiz->>'passingScore')::int,'correctCount',correct_count,'incorrectCount',incorrect_count,'unansweredCount',unanswered,'pendingReview',pending,'completedAt',to_char(now(),'YYYY-MM-DD HH24:MI'),'answers',answers,'questions',quiz->'questions');
insert into public.platform_attempts(id,student_id,quiz_id,document) values(attempt_id,auth.uid(),quiz_id,result);
return result;
end $$;
create function public.submit_platform_quiz(quiz_id text,answers jsonb,attempt_id uuid) returns jsonb language sql security invoker set search_path='' as $$ select video_private.submit_platform_quiz(quiz_id,answers,attempt_id); $$;
revoke all on function video_private.submit_platform_quiz(text,jsonb,uuid),public.submit_platform_quiz(text,jsonb,uuid) from public,anon;
grant execute on function video_private.submit_platform_quiz(text,jsonb,uuid),public.submit_platform_quiz(text,jsonb,uuid) to authenticated;
commit;
