import { useEffect, useState } from 'react';
import { listSecretaries, setSecretary, type Secretary } from '../utils/admin';
import { ConfirmDelete } from './ConfirmDelete';
import { UserPlus } from 'lucide-react';

/** Teacher-only: turn an existing account into a secretary (attendance only) or back into a normal account. */
export function SecretaryManager() {
  const [list, setList] = useState<Secretary[]>([]);
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string; err?: boolean } | null>(null);

  const load = () => listSecretaries().then(setList).catch(e => setMessage({ text: (e as Error).message, err: true }));
  useEffect(() => { void load(); }, []);

  async function promote(e: React.FormEvent) {
    e.preventDefault(); if (busy) return;
    setBusy(true); setMessage(null);
    try {
      const r = await setSecretary(email, true);
      if (r.status === 'saved') { setMessage({ text: `بقى ${r.name || email} سكرتير. يسجّل خروج ودخول عشان تظهرله صفحة الغياب.` }); setEmail(''); void load(); }
      else if (r.status === 'not_found') setMessage({ text: 'مفيش حساب بالبريد ده. لازم السكرتير يعمل حساب عادي من "تسجيل الدخول" ويأكد بريده الأول.', err: true });
      else setMessage({ text: 'مينفعش تحوّل حساب المعلم أو حسابك لسكرتير.', err: true });
    } catch (err) { setMessage({ text: (err as Error).message, err: true }); }
    finally { setBusy(false); }
  }

  return (
    <section className="space-y-4" dir="rtl">
      <div>
        <h2 className="text-2xl font-black">حسابات السكرتارية</h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">السكرتير بيشوف صفحة تسجيل الغياب بالكود بس — مبيقدرش يشوف الدرجات ولا يعدّل الكورسات ولا يحذف حاجة.</p>
      </div>
      <form onSubmit={promote} className="rounded-2xl p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-wrap gap-3 items-end">
        <label className="sx-field" style={{ flex: '1 1 260px' }}>بريد حساب السكرتير
          <input type="email" required dir="ltr" value={email} onChange={e => setEmail(e.target.value)} placeholder="secretary@example.com" />
        </label>
        <button className="sx-btn sx-btn-primary" disabled={busy}><UserPlus />{busy ? 'جارٍ الحفظ…' : 'اجعله سكرتير'}</button>
      </form>
      {message && <p role="status" className={message.err ? 'sx-alert' : 'sx-ok'}>{message.text}</p>}
      <div className="space-y-2">
        {!list.length && <p className="text-sm text-slate-500">مفيش سكرتير لسه.</p>}
        {list.map(s => (
          <article key={s.id} className="rounded-2xl p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div><b>{s.name}</b><div className="text-xs text-slate-500" dir="ltr">{s.email}</div></div>
            <ConfirmDelete label="إلغاء صلاحية السكرتير" question={`تشيل صلاحية ${s.name}؟`} onConfirm={async () => {
              try { await setSecretary(s.email, false); setMessage({ text: `اتشالت صلاحية السكرتير من ${s.name}.` }); void load(); }
              catch (err) { setMessage({ text: (err as Error).message, err: true }); }
            }} />
          </article>
        ))}
      </div>
    </section>
  );
}
