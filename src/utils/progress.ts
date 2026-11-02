import { currentAuthUser } from './auth';
import { databaseRequest } from './quizzes';
export type Progress={lecture_id:string;position:number;duration:number;watched_seconds:number[];updated_at?:string};
export function percent(p:Progress){return Math.min(100,Math.floor(new Set(p.watched_seconds).size/Number(p.duration)*100))||0;}
const key=(user:string,lesson:string)=>`video-progress:${user}:${lesson}`;
export function localProgress(user:string,lesson:string):Progress|null{try{return JSON.parse(localStorage.getItem(key(user,lesson))||'null');}catch{return null;}}
export async function trackVideo(video:HTMLVideoElement, lesson:string, cancelled:()=>boolean=()=>false){
 const user=currentAuthUser().id;let saved=localProgress(user,lesson),seconds=new Set<number>(saved?.watched_seconds||[]),last=-1,lastSave=0,restored=false,writing=false,dirty=false;
 if(user!=='guest')try{const rows=await databaseRequest(`video_progress?lecture_id=eq.${encodeURIComponent(lesson)}&select=*`);if(rows[0]){const remote=rows[0] as Progress;for(const n of remote.watched_seconds)seconds.add(n);if(!saved||Date.parse(remote.updated_at||'')>Date.parse(saved.updated_at||''))saved=remote;}}catch{/* Local progress is still available offline. */}
 if(cancelled())return ()=>{};
 const restore=()=>{if(restored||!Number.isFinite(video.duration)||video.duration<=0)return;restored=true;if(saved?.position&&saved.position<video.duration-2)video.currentTime=Number(saved.position);last=video.currentTime;};
 const persist=async()=>{if(!restored||!Number.isFinite(video.duration)||video.duration<=0||currentAuthUser().id!==user)return;const p:Progress={lecture_id:lesson,position:Math.min(video.duration,Math.max(0,video.currentTime)),duration:video.duration,watched_seconds:[...seconds],updated_at:new Date().toISOString()};try{localStorage.setItem(key(user,lesson),JSON.stringify(p));}catch{}window.dispatchEvent(new Event('video_progress_changed'));if(user==='guest'||writing)return;writing=true;try{await databaseRequest('rpc/save_video_progress','POST',{lesson,playback_position:p.position,video_duration:p.duration,seconds_watched:p.watched_seconds});dirty=false;}catch{dirty=true;}finally{writing=false;}};
 const update=()=>{restore();const t=video.currentTime;if(!restored||!Number.isFinite(t))return;const d=t-last;if(!video.seeking&&last>=0&&d>0&&d<=Math.max(3,3*video.playbackRate)){for(let n=Math.floor(last);n<Math.floor(t);n++)seconds.add(n);dirty=true;}last=t;if(Date.now()-lastSave>10000){lastSave=Date.now();void persist();}};
 const seek=()=>{last=video.currentTime;};const flush=()=>void persist();const visible=()=>{if(document.hidden)flush();};
 video.addEventListener('loadedmetadata',restore);video.addEventListener('durationchange',restore);video.addEventListener('timeupdate',update);video.addEventListener('seeking',seek);video.addEventListener('seeked',seek);video.addEventListener('pause',flush);video.addEventListener('ended',flush);window.addEventListener('pagehide',flush);document.addEventListener('visibilitychange',visible);restore();
 const timer=setInterval(()=>{if(dirty)flush();},15000);
 return ()=>{flush();clearInterval(timer);video.removeEventListener('loadedmetadata',restore);video.removeEventListener('durationchange',restore);video.removeEventListener('timeupdate',update);video.removeEventListener('seeking',seek);video.removeEventListener('seeked',seek);video.removeEventListener('pause',flush);video.removeEventListener('ended',flush);window.removeEventListener('pagehide',flush);document.removeEventListener('visibilitychange',visible);};
}
