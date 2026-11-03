insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('quiz-images','quiz-images',false,3145728,array['image/jpeg','image/png','image/webp']) on conflict(id) do nothing;
create policy quiz_images_read on storage.objects for select to authenticated using(bucket_id='quiz-images' and (select video_private.has_active_session()));
create policy quiz_images_insert on storage.objects for insert to authenticated with check(bucket_id='quiz-images' and (select video_private.is_platform_admin()));
create policy quiz_images_update on storage.objects for update to authenticated using(bucket_id='quiz-images' and (select video_private.is_platform_admin())) with check(bucket_id='quiz-images' and (select video_private.is_platform_admin()));
create policy quiz_images_delete on storage.objects for delete to authenticated using(bucket_id='quiz-images' and (select video_private.is_platform_admin()));

