import React, { useEffect, useState, useRef } from 'react';
import { trackVideo } from '../utils/progress';
let playerApi: Promise<void> | null=null;
function loadApi(){if((window as any).VdoPlayer)return Promise.resolve();if(!playerApi)playerApi=new Promise<void>((resolve,reject)=>{const s=document.createElement('script');s.src='https://player.vdocipher.com/v2/api.js';s.onload=()=>resolve();s.onerror=()=>{playerApi=null;reject(new Error('Player API unavailable'));};document.head.appendChild(s);});return playerApi;}

interface Props { lectureId: string; title: string; onSignIn: () => void }
export function DrmPlayer({ lectureId, title, onSignIn }: Props) {
  const iframe = useRef<HTMLIFrameElement>(null);
  const [version, setVersion] = useState(0);
  const [player, setPlayer] = useState<{ lectureId: string; url: string } | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    setPlayer(null); setError('');
    async function start() {
      try {
        const response = await fetch('/api/vdocipher/otp', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lectureId }), cache: 'no-store', signal: controller.signal,
        });
        if (controller.signal.aborted) return;
        if (response.status === 403) throw new Error('الفيديو غير منشور أو لم يعد متاحًا.');
        if (response.status === 429) throw new Error('محاولات تشغيل كثيرة. انتظر دقيقة ثم حاول مجددًا.');
        if (!response.ok) throw new Error('تعذر تجهيز الفيديو الآن. حاول لاحقًا.');
        const data = await response.json();
        if (!data.otp || !data.playbackInfo) throw new Error('تعذر تجهيز الفيديو الآن.');
        const query = new URLSearchParams({ otp: data.otp, playbackInfo: data.playbackInfo });
        if (!controller.signal.aborted) setPlayer({ lectureId, url: `https://player.vdocipher.com/v2/?${query}` });
      } catch (e) {
        if (!controller.signal.aborted) setError(e instanceof Error ? e.message : 'تعذر الاتصال. حاول مجددًا.');
      }
    }
    void start();
    return () => controller.abort();
  }, [lectureId, version]);
  useEffect(()=>{if(!player||!iframe.current)return;let cancelled=false;let cleanup=()=>{};const frame=iframe.current;void loadApi().then(async()=>{if(cancelled)return;const video=(window as any).VdoPlayer.getInstance(frame).video;cleanup=await trackVideo(video,lectureId,()=>cancelled);if(cancelled)cleanup();}).catch(()=>{});return()=>{cancelled=true;cleanup();};},[player,lectureId]);
  if (player?.lectureId === lectureId) return (
    <iframe ref={iframe} key={player.url} src={player.url} title={title} allow="encrypted-media; fullscreen; picture-in-picture" allowFullScreen
      referrerPolicy="no-referrer" className="w-full h-full border-0" />
  );
  return <div className="h-full flex flex-col items-center justify-center gap-4 p-6 text-center text-white" aria-live="polite">
    <p>{error || 'جارٍ تجهيز الفيديو…'}</p>
    {error ? <button type="button" onClick={() => setVersion(v => v + 1)} className="rounded-lg bg-emerald-600 px-5 py-2">إعادة المحاولة</button> : null}
  </div>;
}
