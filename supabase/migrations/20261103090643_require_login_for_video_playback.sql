create function video_private.authorize_member_video_playback(requested_lecture text) returns jsonb language plpgsql security definer set search_path='' as $$
declare result jsonb;
begin
 if not video_private.has_active_session() then raise insufficient_privilege; end if;
 result:=video_private.authorize_public_video_playback(requested_lecture);
 return result||jsonb_build_object('user_id',auth.uid());
end $$;
create function public.authorize_member_video_playback(requested_lecture text) returns jsonb language sql security invoker set search_path='' as $$ select video_private.authorize_member_video_playback(requested_lecture) $$;
revoke all on function video_private.authorize_member_video_playback(text),public.authorize_member_video_playback(text) from public,anon;
grant execute on function video_private.authorize_member_video_playback(text),public.authorize_member_video_playback(text) to authenticated;
revoke all on function video_private.authorize_public_video_playback(text),public.authorize_public_video_playback(text) from public,anon,authenticated;

