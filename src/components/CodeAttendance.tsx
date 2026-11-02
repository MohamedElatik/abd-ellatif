import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { AttendanceRecord, AttendanceStatus } from '../types';
import { recordAttendanceByCode, listSessionAttendance } from '../utils/admin';
import { CheckCircle2, XCircle, Clock, ShieldCheck, Hash, MessageCircle, RefreshCw } from 'lucide-react';

type Row = AttendanceRecord & { studentCode?: string; recordedAt?: string };
const STATUSES: { id: AttendanceStatus; label: string; icon: ReactNode }[] = [
  { id: 'present', label: 'حاضر', icon: <CheckCircle2 /> },
  { id: 'late', label: 'متأخر', icon: <Clock /> },
  { id: 'absent', label: 'غائب', icon: <XCircle /> },
  { id: 'excused', label: 'بعذر', icon: <ShieldCheck /> },
];
const LABEL: Record<AttendanceStatus, string> = { present: 'حاضر', late: 'متأخر', absent: 'غائب', excused: 'بعذر' };
const today = () => new Date().toLocaleDateString('en-CA');
const SESSION_KEY = 'biomaster_attendance_session';

function savedSession(): { title: string; date: string } {
  try {
    const s = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
    if (s && typeof s.title === 'string' && s.date === today()) return s;
  } catch { /* storage blocked */ }
  return { title: '', date: today() };
}

/** Attendance by the 6-digit code students write on their notebooks. Used by the secretary and the teacher. */
export function CodeAttendance() {
  const [title, setTitle] = useState(() => savedSession().title);
  const [date, setDate] = useState(() => savedSession().date);
  const [status, setStatus] = useState<AttendanceStatus>('present');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState<{ ok: boolean; title: string; text: string } | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [listError, setListError] = useState('');
  const input = useRef<HTMLInputElement>(null);
  const ready = title.trim().length > 0 && Boolean(date);

  useEffect(() => { try { localStorage.setItem(SESSION_KEY, JSON.stringify({ title, date })); } catch { /* ignore */ } }, [title, date]);

  async function reload() {
    if (!ready) { setRows([]); return; }
    try { setRows(await listSessionAttendance(title, date)); setListError(''); }
    catch (e) { setListError((e as Error).message); }
  }
  useEffect(() => { const t = setTimeout(reload, 300); return () => clearTimeout(t); }, [title, date]); // eslint-disable-line react-hooks/exhaustive-deps

  async function submit(value = code, as: AttendanceStatus = status) {
    const clean = value.replace(/\D/g, '');
    if (busy || clean.length !== 6 || !ready) return;
    setBusy(true); setFlash(null);
    try {
      const r = await recordAttendanceByCode(clean, title, date, as);
      if (r.status === 'saved') {
        setFlash({ ok: true, title: r.record.studentName, text: `${LABEL[r.record.status]} — كود ${clean}` });
        setRows(prev => [r.record, ...prev.filter(x => x.id !== r.record.id)]);
      } else {
        setFlash({ ok: false, title: 'الكود غير صحيح', text: `مفيش طالب بالكود ${clean}. راجع الرقم المكتوب على المذكرة.` });
      }
      setCode('');
    } catch (e) {
      setFlash({ ok: false, title: 'لم يتم التسجيل', text: (e as Error).message });
    } finally {
      setBusy(false);
      setTimeout(() => input.current?.focus(), 0);
    }
  }

  const counts = STATUSES.map(s => ({ ...s, n: rows.filter(r => r.status === s.id).length }));

  return (
    <section className="sx-att" dir="rtl">
      <div className="sx-card sx-att-session">
        <label className="sx-field">اسم الحصة
          <input id="att-title" value={title} maxLength={200} placeholder="مثال: حصة 5 — الوراثة" onChange={e => setTitle(e.target.value)} />
        </label>
        <label className="sx-field">التاريخ
          <input id="att-date" type="date" value={date} onChange={e => setDate(e.target.value)} />
        </label>
      </div>

      <div className="sx-card sx-att-main">
        <div className="sx-seg sx-att-status" role="group" aria-label="الحالة اللي هتتسجل">
          {STATUSES.map(s => (
            <button key={s.id} type="button" aria-pressed={status === s.id} className={`st-${s.id}`} onClick={() => { setStatus(s.id); input.current?.focus(); }}>
              {s.icon}{s.label}
            </button>
          ))}
        </div>
        <form onSubmit={e => { e.preventDefault(); void submit(); }} className="sx-att-form">
          <label htmlFor="att-code" className="sx-att-label"><Hash />اكتب كود الطالب</label>
          <input id="att-code" ref={input} className="sx-att-code" inputMode="numeric" autoComplete="off" autoFocus
            placeholder="______" maxLength={6} value={code} disabled={!ready}
            onChange={e => { const v = e.target.value.replace(/\D/g, '').slice(0, 6); setCode(v); if (v.length === 6) void submit(v); }} />
          <button className="sx-btn sx-btn-primary sx-submit" disabled={busy || code.length !== 6 || !ready}>
            {busy ? 'جارٍ التسجيل…' : `تسجيل ${LABEL[status]}`}
          </button>
          {!ready && <p className="sx-note">اكتب اسم الحصة الأول عشان تبدأ التسجيل.</p>}
          {ready && <p className="sx-note">أول ما تكتب 6 أرقام بيتسجل الطالب على طول.</p>}
        </form>
        {flash && (
          <div className={`sx-att-flash ${flash.ok ? 'ok' : 'bad'}`} role="status" aria-live="polite">
            {flash.ok ? <CheckCircle2 /> : <XCircle />}
            <div><b>{flash.title}</b><span>{flash.text}</span></div>
          </div>
        )}
      </div>

      <div className="sx-card">
        <div className="sx-card-head">
          <h2>المسجّلين في الحصة دي</h2>
          <button type="button" className="sx-icon-btn" onClick={() => void reload()} aria-label="تحديث القائمة"><RefreshCw /></button>
        </div>
        <div className="sx-att-counts">
          {counts.map(c => <span key={c.id} className={`sx-status ${c.id === 'present' ? 'pass' : c.id === 'absent' ? 'fail' : 'pending'}`}>{c.label}: {c.n}</span>)}
        </div>
        {listError && <p role="alert" className="sx-alert">{listError}</p>}
        {!rows.length && !listError && <p className="sx-note" style={{ padding: '1rem 0' }}>{ready ? 'لسه محدش اتسجل في الحصة دي.' : 'اكتب اسم الحصة لعرض المسجّلين.'}</p>}
        <div className="sx-att-list">
          {rows.map(r => (
            <article key={r.id} className="sx-att-row">
              <span className="sx-att-rowcode">{r.studentCode || '—'}</span>
              <div style={{ minWidth: 0 }}>
                <b>{r.studentName}</b>
                <span className="sx-note">{r.recordedAt ? `اتسجل ${r.recordedAt.slice(11)}` : ''}</span>
              </div>
              <select aria-label={`تغيير حالة ${r.studentName}`} value={r.status} disabled={busy || !r.studentCode}
                onChange={e => r.studentCode && void submit(r.studentCode, e.target.value as AttendanceStatus)}>
                {STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
              {r.parentPhone && <a className="sx-icon-btn" href={`https://wa.me/2${r.parentPhone}`} target="_blank" rel="noreferrer" title="رسالة لولي الأمر على واتساب" aria-label={`واتساب ولي أمر ${r.studentName}`}><MessageCircle /></a>}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
