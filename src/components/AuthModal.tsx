import React, { useState } from 'react';
import type { User, GradeLevel } from '../types';
import { signIn, signUp, signOut, guestUser } from '../utils/auth';
import { X } from 'lucide-react';

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
  const field = 'w-full rounded-xl border border-slate-700 bg-slate-800 p-3 text-sm text-white';
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
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="auth-title">
    <div className="my-auto w-full max-w-md rounded-3xl border border-slate-700 bg-slate-900 p-6 text-white shadow-2xl">
      <div className="mb-5 flex items-center justify-between">
        <h2 id="auth-title" className="font-bold">{mode === 'login' ? 'تسجيل دخول الطالب' : 'إنشاء حساب طالب'}</h2>
        <button type="button" onClick={onClose} aria-label="إغلاق"><X className="h-5 w-5" /></button>
      </div>
      {currentUser.id !== 'guest' && <div className="mb-4 text-sm">
        <p>الحساب الحالي: {currentUser.name}</p>
        <button type="button" disabled={busy} className="mt-2 text-emerald-400" onClick={async () => {
          setBusy(true); await signOut(); onUserChanged(guestUser); setBusy(false); setMessage('تم تسجيل الخروج.');
        }}>تسجيل الخروج</button>
      </div>}
      <div className="mb-5 flex gap-4 text-sm">
        <button type="button" disabled={busy} aria-pressed={mode === 'login'} onClick={() => { setMode('login'); setError(''); setMessage(''); }} className={mode === 'login' ? 'text-emerald-400' : ''}>تسجيل الدخول</button>
        <button type="button" disabled={busy} aria-pressed={mode === 'register'} onClick={() => { setMode('register'); setError(''); setMessage(''); }} className={mode === 'register' ? 'text-emerald-400' : ''}>إنشاء حساب جديد</button>
      </div>
      <form onSubmit={submit} className="space-y-4">
        <label className="block text-sm">البريد الإلكتروني
          <input className={field} type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} dir="ltr" />
        </label>
        <label className="block text-sm">كلمة المرور
          <input className={field} type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} required minLength={mode === 'register' ? 12 : 1} value={password} onChange={e => setPassword(e.target.value)} />
        </label>
        {mode === 'register' && <>
          <label className="block text-sm">اسم الطالب<input className={field} required maxLength={100} value={name} onChange={e => setName(e.target.value)} autoComplete="name" /></label>
          <label className="block text-sm">هاتف الطالب<input className={field} type="tel" required minLength={10} maxLength={20} value={phone} onChange={e => setPhone(e.target.value)} autoComplete="tel" /></label>
          <label className="block text-sm">هاتف ولي الأمر<input className={field} type="tel" required minLength={10} maxLength={20} value={parentPhone} onChange={e => setParentPhone(e.target.value)} /></label>
          <label className="block text-sm">الصف الدراسي<select className={field} value={grade} onChange={e => setGrade(e.target.value as GradeLevel)}><option value="sec1">الأول الثانوي</option><option value="sec2">الثاني الثانوي</option><option value="sec3">الثالث الثانوي</option></select></label>
          <label className="block text-sm">المحافظة<input className={field} maxLength={100} value={governorate} onChange={e => setGovernorate(e.target.value)} /></label>
          <p className="text-xs text-slate-400">استخدم كلمة مرور من 12 حرفًا على الأقل. إنشاء الحساب لا يفعّل اشتراك الكورس تلقائيًا.</p>
        </>}
        {error && <p role="alert" className="text-sm text-rose-300">{error}</p>}
        {message && <p role="status" className="text-sm text-emerald-300">{message}</p>}
        <button type="submit" disabled={busy} className="w-full rounded-xl bg-emerald-600 p-3 font-bold disabled:opacity-50">{busy ? 'جارٍ إتمام الطلب…' : mode === 'login' ? 'تسجيل الدخول' : 'إنشاء الحساب'}</button>
      </form>
    </div>
  </div>;
}
