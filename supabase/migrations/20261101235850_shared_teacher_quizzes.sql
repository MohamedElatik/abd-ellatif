begin;
create function video_private.is_platform_admin() returns boolean language sql stable security definer set search_path='' as $$
select auth.uid() is not null and exists(select 1 from auth.users u join auth.sessions s on s.user_id=u.id where u.id=auth.uid() and u.raw_app_meta_data->>'role'='admin' and u.email_confirmed_at is not null and not coalesce(u.is_anonymous,false) and (u.banned_until is null or u.banned_until<=now()) and s.id::text=(auth.jwt()->>'session_id') and (s.not_after is null or s.not_after>now()));
$$;
revoke all on function video_private.is_platform_admin() from public,anon;
grant execute on function video_private.is_platform_admin() to authenticated;
create table public.platform_quizzes(
id text primary key check(id ~ '^[a-zA-Z0-9_-]{1,100}$'),
document jsonb not null check(jsonb_typeof(document)='object' and document->>'id'=id and document->>'grade'='sec3' and length(trim(document->>'title'))>0 and jsonb_typeof(document->'questions')='array' and jsonb_array_length(document->'questions') between 1 and 100),
published boolean not null default true,
created_at timestamptz not null default now()
);
alter table public.platform_quizzes enable row level security;
revoke all on public.platform_quizzes from public,anon,authenticated;
grant select,insert,update on public.platform_quizzes to authenticated;
create policy read_published_quizzes on public.platform_quizzes for select to authenticated using(published or (select video_private.is_platform_admin()));
create policy admin_create_quizzes on public.platform_quizzes for insert to authenticated with check((select video_private.is_platform_admin()));
create policy admin_update_quizzes on public.platform_quizzes for update to authenticated using((select video_private.is_platform_admin())) with check((select video_private.is_platform_admin()));
commit;
