begin;
create function video_private.grade_platform_attempt(attempt_id uuid,marks jsonb) returns void language plpgsql security definer set search_path='' as $$
declare item public.platform_attempts; q jsonb; earned numeric; total numeric:=0; score numeric:=0; pct integer;
begin
if not video_private.is_platform_admin() then raise insufficient_privilege; end if;
select * into item from public.platform_attempts where id=attempt_id for update;
if item.id is null or jsonb_typeof(marks)<>'object' then raise exception 'Invalid attempt'; end if;
for q in select value from jsonb_array_elements(item.document->'questions') loop
total:=total+(q->>'points')::numeric;
if q->>'type'='essay' then
earned:=(marks->>(q->>'id'))::numeric;
if earned is null or earned<0 or earned>(q->>'points')::numeric then raise exception 'Invalid mark'; end if;
score:=score+earned;
elsif item.document->'answers'->>(q->>'id')=q->>'correctAnswer' then score:=score+(q->>'points')::numeric;
end if;
end loop;
pct:=case when total>0 then round(score*100/total) else 0 end;
update public.platform_attempts set document=item.document||jsonb_build_object('score',score,'percentage',pct,'pendingReview',false,'essayMarks',marks,'isPassed',pct>=coalesce((item.document->>'passingScore')::int,60)) where id=item.id;
end $$;
create function public.grade_platform_attempt(attempt_id uuid,marks jsonb) returns void language sql security invoker set search_path='' as $$ select video_private.grade_platform_attempt(attempt_id,marks); $$;
revoke all on function video_private.grade_platform_attempt(uuid,jsonb),public.grade_platform_attempt(uuid,jsonb) from public,anon;
grant execute on function video_private.grade_platform_attempt(uuid,jsonb),public.grade_platform_attempt(uuid,jsonb) to authenticated;
commit;
