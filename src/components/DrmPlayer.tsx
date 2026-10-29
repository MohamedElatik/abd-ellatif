import React, { useEffect, useState } from 'react';
import { AUTH_CHANGED, readSession, clearSession } from '../utils/auth';

interface Props { lectureId: string; title: string; onSignIn: () => void }
export function DrmPlayer({ lectureId, title, onSignIn }: Props) {
  const [version, setVersion] = useState(0);
  const [player, setPlayer] = useState<{ lectureId: string; url: string } | null>(null);
  const [error, setError] = useState('');
  const [needsLogin, setNeedsLogin] = useState(false);
  useEffect(() => {
    const changed = () => { setPlayer(null); setVersion(v => v + 1); };
    window.addEventListener(AUTH_CHANGED, changed);
    return () => window.removeEventListener(AUTH_CHANGED, changed);
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    setPlayer(null); setError(''); setNeedsLogin(false);
    const session = readSession();
    if (!session) { setNeedsLogin(true); return () => controller.abort(); }
    async function start() {
      try {
        const response = await fetch('/api/vdocipher/otp', {
          method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session!.access_token}` },
          body: JSON.stringify({ lectureId }), cache: 'no-store', signal: controller.signal,
        });
        if (controller.signal.aborted) return;
        if (response.status === 401) { clearSession(); setNeedsLogin(true); return; }
        if (response.status === 403) throw new Error('المحاضرة غير متاحة لحسابك. تواصل مع المدرس لتفعيل الاشتراك.');
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
  if (player?.lectureId === lectureId) return (
    <iframe key={player.url} src={player.url} title={title} allow="encrypted-media; fullscreen; picture-in-picture" allowFullScreen
      referrerPolicy="no-referrer" className="w-full h-full border-0" />
  );
  return <div className="h-full flex flex-col items-center justify-center gap-4 p-6 text-center text-white" aria-live="polite">
    <p>{needsLogin ? 'سجّل الدخول بحسابك لمشاهدة المحاضرة.' : error || 'جارٍ تجهيز الفيديو…'}</p>
    {needsLogin ? <button type="button" onClick={onSignIn} className="rounded-lg bg-emerald-600 px-5 py-2">تسجيل الدخول</button>
      : error ? <button type="button" onClick={() => setVersion(v => v + 1)} className="rounded-lg bg-emerald-600 px-5 py-2">إعادة المحاولة</button> : null}
  </div>;
}
