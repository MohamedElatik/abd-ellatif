begin;
do $$
declare a uuid:=gen_random_uuid(); s uuid:=gen_random_uuid(); result jsonb;
begin
if has_function_privilege('anon','public.list_platform_students()','EXECUTE') then raise exception 'anonymous access'; end if;
insert into auth.users(id,email,email_confirmed_at,raw_app_meta_data) values(a,a::text||'@example.invalid',now(),'{}');
insert into auth.sessions(id,user_id) values(s,a);
perform set_config('request.jwt.claims',jsonb_build_object('sub',a,'role','authenticated','session_id',s)::text,true);
begin perform public.list_platform_students(); raise exception 'student allowed'; exception when insufficient_privilege then null; end;
update auth.users set raw_user_meta_data='{"role":"admin"}' where id=a;
begin perform public.list_platform_students(); raise exception 'metadata escalation'; exception when insufficient_privilege then null; end;
update auth.users set raw_app_meta_data='{"role":"admin"}' where id=a;
result:=public.list_platform_students();
if jsonb_typeof(result)<>'array' then raise exception 'invalid result'; end if;
if exists(select 1 from jsonb_array_elements(result) x where x->>'id'=a::text) then raise exception 'admin in students'; end if;
perform set_config('request.jwt.claims',jsonb_build_object('sub',a,'role','authenticated','session_id',gen_random_uuid())::text,true);
begin perform public.list_platform_students(); raise exception 'revoked session allowed'; exception when insufficient_privilege then null; end;
end $$;
rollback;
