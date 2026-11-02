import React, { useState } from 'react';
import type { User, GradeLevel } from '../types';
import { signIn, signUp, signOut, guestUser } from '../utils/auth';
import { X } from 'lucide-react';
import { LOGO } from './SiteChrome';

interface Props { currentUser: User; onClose: () => void; onUserChanged: (user: User) => void }
export function AuthModal({ currentUser, onClose, onUserChanged }: Props) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [grade, setGrade] = useState<GradeLevel>('sec3');
  const [governorate, setGovernorate] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  async function submit(event: React.FormEvent) {
    event.preventDefault(); if (busy) return;
    setBusy(true); setError(''); setMessage('');
    try {
      const user = mode === 'login' ? await signIn(email, password) : await signUp(email, password, { name: name.trim(), phone: phone.trim(), parentPhone: parentPhone.trim(), grade, governorate: governorate.trim() });
      setPassword('');
      if (user) { onUserChanged(user); onClose(); }
      else setMessage('راجع بريدك لتأكيد الحساب، ثم ارجع وسجّل الدخول. تفعيل الكورس يتم من المدرس بعد تأكيد اشتراكك.');
    } catch (e) { setError(e instanceof Error ? e.message : 'تعذر تسجيل الدخول. حاول مرة أخرى.'); }
    finally { setBusy(false); }
  }
  const tabTo = (m: 'login' | 'register') => { setMode(m); setError(''); setMessage(''); };
  return <div className="sx-overlay" role="dialog" aria-modal="true" aria-labelledby="auth-title" onMouseDown={e => { if (e.target === e.currentTarget && !busy) onClose(); }}>
    <div className="sx-modal">
      <button type="button" className="sx-modal-close" onClick={onClose} aria-label="إغلاق"><X /></button>
      <div className="sx-modal-head">
        <img src={LOGO} alt="منصة عبد اللطيف الجمل" />
        <h2 id="auth-title">{mode === 'login' ? 'أهلًا بيك تاني' : 'انضم للمنصة'}</h2>
        <p>{mode === 'login' ? 'سجّل دخولك كطالب أو كمعلم' : 'أنشئ حساب طالب جديد في دقيقة'}</p>
      </div>
      {currentUser.id !== 'guest' && <div className="sx-current">
        <span>الحساب الحالي: <strong>{currentUser.name}</strong></span>
        <button type="button" className="sx-linkbtn" disabled={busy} onClick={async () => {
          setBusy(true); await signOut(); onUserChanged(guestUser); setBusy(false); setMessage('تم تسجيل الخروج.');
        }}>تسجيل الخروج</button>
      </div>}
      <div className="sx-seg" role="group" aria-label="نوع العملية">
        <button type="button" disabled={busy} aria-pressed={mode === 'login'} onClick={() => tabTo('login')}>تسجيل الدخول</button>
        <button type="button" disabled={busy} aria-pressed={mode === 'register'} onClick={() => tabTo('register')}>حساب جديد</button>
      </div>
      <form onSubmit={submit} className="sx-form">
        <label className="sx-field">البريد الإلكتروني
          <input type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} dir="ltr" placeholder="name@example.com" />
        </label>
        <label className="sx-field">كلمة المرور
          <input type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} required minLength={mode === 'register' ? 6 : 1} value={password} onChange={e => setPassword(e.target.value)} />
        </label>
        {mode === 'register' && <>
          <label className="sx-field">اسم الطالب<input required maxLength={100} value={name} onChange={e => setName(e.target.value)} autoComplete="name" /></label>
          <div className="sx-row2">
            <label className="sx-field">هاتف الطالب<input type="tel" required minLength={10} maxLength={20} value={phone} onChange={e => setPhone(e.target.value)} autoComplete="tel" dir="ltr" /></label>
            <label className="sx-field">هاتف ولي الأمر<input type="tel" required minLength={10} maxLength={20} value={parentPhone} onChange={e => setParentPhone(e.target.value)} dir="ltr" /></label>
          </div>
          <div className="sx-row2">
            <label className="sx-field">الصف الدراسي<select value={grade} onChange={e => setGrade(e.target.value as GradeLevel)}><option value="sec3">الثالث الثانوي</option></select></label>
            <label className="sx-field">المحافظة<input maxLength={100} value={governorate} onChange={e => setGovernorate(e.target.value)} /></label>
          </div>
          <p className="sx-note">استخدم كلمة مرور من 6 أحرف على الأقل. إنشاء الحساب لا يفعّل اشتراك الكورس تلقائيًا.</p>
        </>}
        {error && <p role="alert" className="sx-alert">{error}</p>}
        {message && <p role="status" className="sx-ok">{message}</p>}
        <button type="submit" disabled={busy} className="sx-btn sx-btn-primary sx-submit">{busy ? 'جارٍ إتمام الطلب…' : mode === 'login' ? 'تسجيل الدخول' : 'إنشاء الحساب'}</button>
      </form>
    </div>
  </div>;
}
