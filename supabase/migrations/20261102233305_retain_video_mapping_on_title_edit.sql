do $$ declare d text; begin
 select pg_get_functiondef('video_private.save_platform_lecture(jsonb,text)'::regprocedure) into d;
 d:=replace(d,'if vdocipher_id !~', E'if nullif(trim(vdocipher_id),\'\') is null then select video_id into vdocipher_id from public.video_lessons where lecture_id=lecture->>\'id\'; end if;\nif vdocipher_id !~');
 execute d;
end $$;
