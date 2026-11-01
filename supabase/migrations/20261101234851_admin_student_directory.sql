begin;
create function video_private.list_platform_students()
returns jsonb language plpgsql security definer set search_path = '' as $$
begin
if auth.uid() is null or not exists (
 select 1 from auth.users u join auth.sessions s on s.user_id=u.id
 where u.id=auth.uid() and u.raw_app_meta_data->>'role'='admin'
 and u.email_confirmed_at is not null and not coalesce(u.is_anonymous,false)
 and (u.banned_until is null or u.banned_until <= now())
 and s.id::text=auth.jwt()->>'session_id' and (s.not_after is null or s.not_after > now())
) then raise insufficient_privilege using message='Admin access required'; end if;
return coalesce((select jsonb_agg(row_data order by registered_at desc) from (
select u.created_at as registered_at, jsonb_build_object(
'id',u.id,'name',coalesce(nullif(u.raw_user_meta_data->>'name',''),'طالب'),
'email',u.email,'phone',coalesce(u.raw_user_meta_data->>'phone',''),
'parentPhone',coalesce(u.raw_user_meta_data->>'parentPhone',''),
'governorate',coalesce(u.raw_user_meta_data->>'governorate',''),
'grade','sec3','role','student','studentCode',u.id::text,
'createdAt',to_char(u.created_at,'YYYY-MM-DD'),'confirmed',u.email_confirmed_at is not null,
'enrolledCourses',coalesce((select jsonb_agg(e.course_id) from public.video_enrollments e where e.user_id=u.id and e.active and e.expires_at>now()),'[]'::jsonb),
'completedLectures','[]'::jsonb,'examAttempts','[]'::jsonb
) as row_data from auth.users u where coalesce(u.raw_app_meta_data->>'role','student') not in ('admin','teacher')
and not coalesce(u.is_anonymous,false) and coalesce(u.raw_user_meta_data->>'grade','sec3')='sec3'
order by u.created_at desc limit 1000
) rows),'[]'::jsonb);
end $$;
revoke all on function video_private.list_platform_students() from public,anon;
grant execute on function video_private.list_platform_students() to authenticated;
create function public.list_platform_students() returns jsonb language sql security invoker set search_path='' as $$ select video_private.list_platform_students(); $$;
revoke all on function public.list_platform_students() from public,anon;
grant execute on function public.list_platform_students() to authenticated;
commit;
