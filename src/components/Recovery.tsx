import { useEffect, useState } from 'react';
import { consumeRecoveryLink, requestRecovery, resetPassword } from '../utils/recovery';
import { clearSession, readSession, AUTH_CHANGED } from '../utils/auth';
import { LOGO } from './SiteChrome';

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
  // The floating "forgot password" button is only useful before signing in.
  const [signedIn, setSignedIn] = useState(() => Boolean(readSession()));
  useEffect(() => {
    const sync = () => setSignedIn(Boolean(readSession()));
    window.addEventListener(AUTH_CHANGED, sync);
    return () => window.removeEventListener(AUTH_CHANGED, sync);
  }, []);
  return <>
    {!signedIn && <button className="sx-forgot" onClick={() => setOpen(true)}>نسيت كلمة المرور؟</button>}
    {open && <div className="sx-overlay" dir="rtl" role="dialog" aria-modal="true" aria-label="استعادة كلمة المرور">
      <form className="sx-modal sx-form" onSubmit={async event => {
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
        <div className="sx-modal-head"><img src={LOGO} alt="" /><h2>{token ? 'اختر كلمة مرور جديدة' : 'استعادة كلمة المرور'}</h2><p>{token ? 'اكتب كلمة المرور الجديدة مرتين' : 'هنبعتلك رابط على بريدك'}</p></div>
        {token ? <>
          <label className="sx-field">كلمة المرور الجديدة<input type="password" autoComplete="new-password" minLength={6} required value={password} onChange={e => setPassword(e.target.value)} /></label>
          <label className="sx-field">تأكيد كلمة المرور<input type="password" autoComplete="new-password" minLength={6} required value={confirm} onChange={e => setConfirm(e.target.value)} /></label>
          <p className="sx-note">استخدم 6 أحرف على الأقل.</p>
        </> : <label className="sx-field">البريد الإلكتروني<input dir="ltr" type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} /></label>}
        {error && <p role="alert" className="sx-alert">{error}</p>}
        {message && <p role="status" className="sx-ok">{message}</p>}
        <button disabled={busy} className="sx-btn sx-btn-primary sx-submit">{busy ? 'جارٍ التنفيذ…' : token ? 'حفظ كلمة المرور' : 'إرسال رابط الاستعادة'}</button>
        <button type="button" className="sx-linkbtn" disabled={busy} onClick={() => setOpen(false)}>إغلاق</button>
      </form>
    </div>}
  </>;
}
