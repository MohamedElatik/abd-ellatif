begin;
grant select(id,published,created_at) on public.platform_quizzes to authenticated;
create table public.platform_courses(id text primary key, document jsonb not null, price numeric(10,2) not null check(price>=0), published boolean not null default true, check(document->>'id'=id and document->>'grade'='sec3' and length(trim(document->>'title'))>0));
create table public.platform_lectures(id text primary key, course_id text not null references public.platform_courses(id), document jsonb not null, published boolean not null default true, check(document->>'id'=id and document->>'courseId'=course_id and document->>'grade'='sec3'));
alter table public.platform_courses enable row level security;
alter table public.platform_lectures enable row level security;
revoke all on public.platform_courses,public.platform_lectures from public,anon,authenticated;
grant select on public.platform_courses,public.platform_lectures to anon,authenticated;
create policy courses_read on public.platform_courses for select using(published);
create policy lectures_read on public.platform_lectures for select using(published and exists(select 1 from public.platform_courses c where c.id=course_id and c.published));
create function video_private.save_platform_course(course jsonb) returns void language plpgsql security definer set search_path='' as $$
declare cost numeric;
begin
if not video_private.is_platform_admin() then raise insufficient_privilege; end if;
cost:=case when (course->>'isFree')::boolean then 0 else (course->>'price')::numeric end;
if cost is null or cost<0 or cost>99999999 or course->>'grade'<>'sec3' or nullif(trim(course->>'title'),'') is null then raise exception 'Invalid course'; end if;
course:=jsonb_set(jsonb_set(course,'{price}',to_jsonb(cost)),'{isFree}',to_jsonb(cost=0));
insert into public.platform_courses(id,document,price) values(course->>'id',course,cost) on conflict(id) do update set document=excluded.document,price=excluded.price;
end $$;
create function public.save_platform_course(course jsonb) returns void language sql security invoker set search_path='' as $$select video_private.save_platform_course(course);$$;
create function video_private.save_platform_lecture(lecture jsonb,vdocipher_id text) returns void language plpgsql security definer set search_path='' as $$
begin
if not video_private.is_platform_admin() then raise insufficient_privilege; end if;
if vdocipher_id !~ '^[a-zA-Z0-9]{20,64}$' or vdocipher_id is null or nullif(trim(lecture->>'title'),'') is null then raise exception 'Invalid video'; end if;
lecture:=jsonb_set(jsonb_set(lecture,'{videoUrl}','""'),'{playbackProvider}','"vdocipher"');
insert into public.platform_lectures(id,course_id,document) values(lecture->>'id',lecture->>'courseId',lecture) on conflict(id) do update set course_id=excluded.course_id,document=excluded.document;
insert into public.video_lessons(lecture_id,course_id,video_id,published) values(lecture->>'id',lecture->>'courseId',vdocipher_id,true) on conflict(lecture_id) do update set course_id=excluded.course_id,video_id=excluded.video_id,published=true;
end $$;
create function public.save_platform_lecture(lecture jsonb,vdocipher_id text) returns void language sql security invoker set search_path='' as $$select video_private.save_platform_lecture(lecture,vdocipher_id);$$;
revoke all on function video_private.save_platform_course(jsonb),public.save_platform_course(jsonb),video_private.save_platform_lecture(jsonb,text),public.save_platform_lecture(jsonb,text) from public,anon;
grant execute on function video_private.save_platform_course(jsonb),public.save_platform_course(jsonb),video_private.save_platform_lecture(jsonb,text),public.save_platform_lecture(jsonb,text) to authenticated;
create table public.platform_profiles(user_id uuid primary key references auth.users(id),avatar text not null check(length(avatar)<750000 and avatar ~ '^data:image/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$'));
alter table public.platform_profiles enable row level security;
revoke all on public.platform_profiles from public,anon,authenticated;
grant select,insert,update on public.platform_profiles to authenticated;
create policy profiles_read on public.platform_profiles for select to authenticated using((user_id=auth.uid() and video_private.has_active_session()) or video_private.is_platform_admin());
create policy profiles_insert on public.platform_profiles for insert to authenticated with check(user_id=auth.uid() and video_private.has_active_session());
create policy profiles_update on public.platform_profiles for update to authenticated using(user_id=auth.uid() and video_private.has_active_session()) with check(user_id=auth.uid() and video_private.has_active_session());
create index platform_attempts_student_idx on public.platform_attempts(student_id,created_at desc);
create index platform_attempts_quiz_idx on public.platform_attempts(quiz_id);
create index platform_lectures_course_idx on public.platform_lectures(course_id);
commit;
