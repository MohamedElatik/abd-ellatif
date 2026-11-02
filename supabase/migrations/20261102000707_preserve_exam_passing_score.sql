create or replace function video_private.submit_platform_quiz(quiz_id text,answers jsonb,attempt_id uuid) returns jsonb language plpgsql security definer set search_path='' as $$
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
result:=jsonb_build_object('id',attempt_id,'quizId',quiz_id,'quizTitle',quiz->>'title','studentId',auth.uid(),'studentName',student.raw_user_meta_data->>'name','studentPhone',student.raw_user_meta_data->>'phone','grade','sec3','score',score,'totalPoints',total,'percentage',pct,'isPassed',not pending and pct>=(quiz->>'passingScore')::int,'correctCount',correct_count,'incorrectCount',incorrect_count,'unansweredCount',unanswered,'pendingReview',pending,'passingScore',(quiz->>'passingScore')::int,'completedAt',to_char(now(),'YYYY-MM-DD HH24:MI'),'answers',answers,'questions',quiz->'questions');
insert into public.platform_attempts(id,student_id,quiz_id,document) values(attempt_id,auth.uid(),quiz_id,result);
return result;
end $$;
