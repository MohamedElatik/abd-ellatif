import { useState } from 'react';
import { consumeRecoveryLink, requestRecovery, resetPassword } from '../utils/recovery';
import { clearSession } from '../utils/auth';

const callback = consumeRecoveryLink();
export function Recovery() {
  const [token, setToken] = useState(callback.token);
  const [open, setOpen] = useState(Boolean(callback.token || callback.error));
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(callback.error ? 'رابط البريد انتهى أو استُخدم بالفعل. لو نسيت كلمة المرور، اطلب رابط استعادة جديدًا.' : '');
  const [error, setError] = useState('');
  return <>
    <button className="fixed bottom-4 left-4 z-[60] rounded-xl bg-slate-800 px-4 py-2 text-sm text-white shadow-lg" onClick={() => setOpen(true)}>نسيت كلمة المرور؟</button>
    {open && <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/90 p-4" dir="rtl" role="dialog" aria-modal="true" aria-label="استعادة كلمة المرور">
      <form className="w-full max-w-md space-y-4 rounded-2xl bg-slate-900 p-6 text-white" onSubmit={async event => {
        event.preventDefault(); if (busy) return; setError(''); setBusy(true);
        try {
          if (token) {
            if (password !== confirm) throw new Error('كلمتا المرور غير متطابقتين.');
            await resetPassword(token, password); callback.token = null; setToken(null); setPassword(''); setConfirm(''); clearSession();
            setMessage('تم تغيير كلمة المرور. أغلق النافذة وسجّل الدخول بكلمة المرور الجديدة.');
          } else { await requestRecovery(email); setMessage('لو البريد مسجّل، ستصلك رسالة استعادة. افتح أحدث رسالة واختر كلمة مرور جديدة.'); }
        } catch (e) { setError(e instanceof Error ? e.message : 'تعذر الاتصال. حاول مرة أخرى.'); }
        finally { setBusy(false); }
      }}>
        <h2 className="font-bold">{token ? 'اختر كلمة مرور جديدة' : 'استعادة كلمة المرور'}</h2>
        {token ? <>
          <label className="block">كلمة المرور الجديدة<input className="mt-2 w-full rounded-lg bg-slate-800 p-3" type="password" autoComplete="new-password" minLength={12} required value={password} onChange={e => setPassword(e.target.value)} /></label>
          <label className="block">تأكيد كلمة المرور<input className="mt-2 w-full rounded-lg bg-slate-800 p-3" type="password" autoComplete="new-password" minLength={12} required value={confirm} onChange={e => setConfirm(e.target.value)} /></label>
          <p className="text-sm">استخدم 12 حرفًا على الأقل.</p>
        </> : <label className="block">البريد الإلكتروني<input className="mt-2 w-full rounded-lg bg-slate-800 p-3" dir="ltr" type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} /></label>}
        {error && <p role="alert" className="text-rose-300">{error}</p>}
        {message && <p role="status" className="text-emerald-300">{message}</p>}
        <button disabled={busy} className="w-full rounded-lg bg-emerald-600 p-3 disabled:opacity-50">{busy ? 'جارٍ التنفيذ…' : token ? 'حفظ كلمة المرور' : 'إرسال رابط الاستعادة'}</button>
        <button type="button" disabled={busy} onClick={() => setOpen(false)}>إغلاق</button>
      </form>
    </div>}
  </>;
}
