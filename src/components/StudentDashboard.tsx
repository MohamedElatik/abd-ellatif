import { WatchDashboard } from './WatchDashboard';
import { useState } from 'react';
import type { User } from '../types';
import { useAttempts, type SavedAttempt } from '../utils/records';
import { useAvatar, saveAvatar } from '../utils/profile';
import { signOut } from '../utils/auth';
import { useMyAttendanceCode } from '../utils/admin';
import { Avatar, type Tab } from './SiteChrome';
import { Copy, Camera, ClipboardList, Target, Trophy, TrendingUp, PlayCircle, FileQuestion, LogOut, Sparkles } from 'lucide-react';

const GRADES: Record<string, string> = { sec1: 'الأول الثانوي', sec2: 'الثاني الثانوي', sec3: 'الثالث الثانوي' };

function status(a: SavedAttempt): 'pass' | 'fail' | 'pending' {
  return a.pendingReview ? 'pending' : a.isPassed ? 'pass' : 'fail';
}
const STATUS_TEXT = { pass: 'ناجح', fail: 'لم ينجح', pending: 'بانتظار التصحيح' };
const STATUS_COLOR = { pass: '#10b981', fail: '#f43f5e', pending: '#f59e0b' };

function level(avg: number, count: number) {
  if (!count) return 'ابدأ أول امتحان';
  if (avg >= 90) return 'ممتاز — مستوى المتفوقين';
  if (avg >= 75) return 'جيد جدًا — قرّبت للقمة';
  if (avg >= 60) return 'جيد — كمّل وهتوصل';
  return 'محتاج مذاكرة أكتر';
}

function formatDate(value: string) {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' });
}

function Ring({ value, size, stroke, color, track = 'var(--line)' }: { value: number; size: number; stroke: number; color: string; track?: string }) {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r, v = Math.max(0, Math.min(100, value));
  return (
    <svg viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={c * (1 - v / 100)} style={{ transition: 'stroke-dashoffset .8s ease' }} />
    </svg>
  );
}

export function StudentDashboard({ user, onNavigate }: { user: User; onNavigate: (t: Tab) => void }) {
  const { attempts, error } = useAttempts();
  const { error: avatarError } = useAvatar(user.id);
  const [busy, setBusy] = useState(false);
  const code = useMyAttendanceCode(user.id);
  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState<{ text: string; err?: boolean } | null>(null);

  async function upload(file?: File) {
    if (!file) return;
    setBusy(true); setMessage(null);
    try { await saveAvatar(user.id, file); setMessage({ text: 'تم حفظ صورتك.' }); }
    catch (e) { setMessage({ text: e instanceof Error && e.message.startsWith('اختر') ? e.message : 'تعذر حفظ الصورة. حاول مجددًا.', err: true }); }
    finally { setBusy(false); }
  }

  const count = attempts.length;
  const graded = attempts.filter(a => !a.pendingReview);
  const avg = count ? Math.round(attempts.reduce((s, a) => s + (a.percentage || 0), 0) / count) : 0;
  const passed = graded.filter(a => a.isPassed).length;
  const best = count ? Math.max(...attempts.map(a => a.percentage || 0)) : 0;
  const recent = attempts.slice(0, 8).reverse();
  const firstName = user.name.split(' ')[0] || user.name;
  const ringColor = avg >= 75 ? '#10b981' : avg >= 50 ? '#f59e0b' : count ? '#f43f5e' : 'var(--line)';

  const stats = [
    { label: 'امتحانات سلّمتها', value: String(count), tone: '#0ea5e9', icon: <ClipboardList /> },
    { label: 'متوسط درجاتك', value: `${avg}%`, tone: '#10b981', icon: <TrendingUp /> },
    { label: 'امتحانات نجحت فيها', value: String(passed), tone: '#8b5cf6', icon: <Target /> },
    { label: 'أعلى درجة', value: `${best}%`, tone: '#f59e0b', icon: <Trophy /> },
  ];

  return (
    <main className="sx-dash">
      <WatchDashboard />
      <section className="sx-hero">
        <div className="sx-wrap sx-hero-in">
          <div className="sx-big-av">
            <Avatar user={user} size={140} />
            <label className="sx-cam" title="تغيير الصورة">
              <Camera aria-hidden="true" />
              <span className="sr-only">{busy ? 'جاري حفظ الصورة…' : 'تغيير صورتك الشخصية'}</span>
              <input disabled={busy} type="file" accept="image/jpeg,image/png,image/webp" onChange={e => { void upload(e.target.files?.[0]); e.target.value = ''; }} />
            </label>
          </div>
          <div className="sx-hero-text">
            <span className="sx-hi">أهلًا بيك يا {firstName}</span>
            <h1>{user.name}</h1>
            <div className="sx-tags">
              <span className="sx-chip">{GRADES[user.grade || 'sec3']}</span>
              {user.governorate && <span className="sx-chip">{user.governorate}</span>}
              {user.email && <span className="sx-chip" dir="ltr">{user.email}</span>}
              <span className="sx-chip">{level(avg, count)}</span>
            </div>
            {busy && <p className="sx-dash-msg">جاري حفظ الصورة…</p>}
            {message && <p role="status" className={`sx-dash-msg${message.err ? ' err' : ''}`}>{message.text}</p>}
            {!message && avatarError && <p role="status" className="sx-dash-msg err">{avatarError}</p>}
          </div>
          <div className="sx-hero-actions">
            <button className="sx-btn sx-btn-gold" onClick={() => onNavigate('videos')}><PlayCircle />كمّل دروسك</button>
            <button className="sx-btn sx-btn-glass" onClick={() => onNavigate('exams')}><FileQuestion />الامتحانات</button>
            <button className="sx-btn sx-btn-glass" onClick={() => void signOut()}><LogOut />خروج</button>
          </div>
        </div>
      </section>

      <div className="sx-wrap">
        <div className="sx-stats">
          {stats.map(s => (
            <div key={s.label} className="sx-stat" style={{ ['--tone' as string]: s.tone }}>
              <span className="sx-ico">{s.icon}</span>
              <b>{s.value}</b>
              <span>{s.label}</span>
            </div>
          ))}
        </div>

        {code && (
          <section className="sx-code-card" aria-label="كود الحضور">
            <div>
              <h2>كود الحضور بتاعك</h2>
              <p>اكتب الكود ده على مذكراتك وكشكولك — السكرتير بيسجّل حضورك بيه في كل حصة.</p>
            </div>
            <div className="sx-code-digits" aria-label={`الكود ${code.split('').join(' ')}`}>{code.split('').map((d, i) => <span key={i}>{d}</span>)}</div>
            <button type="button" className="sx-btn" onClick={async () => {
              try { await navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { /* clipboard blocked */ }
            }}><Copy />{copied ? 'اتنسخ' : 'نسخ الكود'}</button>
          </section>
        )}

        {error && <p role="alert" className="sx-alert" style={{ marginTop: '1.2rem' }}>{error}</p>}

        <div className="sx-grid2">
          <section className="sx-card">
            <div className="sx-card-head"><h2>تطوّر درجاتك</h2><small>آخر {recent.length || 0} امتحانات</small></div>
            {recent.length ? <>
              <div className="sx-bars" role="img" aria-label={`نسب آخر الامتحانات: ${recent.map(a => `${a.quizTitle} ${a.percentage}%`).join('، ')}`}>
                {recent.map(a => (
                  <div key={a.id} className={`sx-bar ${status(a)}`}>
                    <em>{a.percentage}%</em>
                    <i style={{ height: `${Math.max(4, a.percentage)}%` }} />
                  </div>
                ))}
              </div>
              <div className="sx-bar-labels">{recent.map(a => <span key={a.id} title={a.quizTitle}>{a.quizTitle}</span>)}</div>
            </> : (
              <div className="sx-empty">
                <span className="sx-empty-ico"><Sparkles /></span>
                <h3>هنا هيظهر تطوّرك</h3>
                <p>أول ما تسلّم امتحان، درجاتك هتظهر هنا في رسم بياني.</p>
              </div>
            )}
          </section>

          <section className="sx-card sx-ring-wrap">
            <div className="sx-card-head" style={{ width: '100%' }}><h2>مستواك العام</h2></div>
            <div className="sx-ring">
              <Ring value={avg} size={170} stroke={16} color={ringColor} />
              <div className="sx-ring-txt"><b>{avg}%</b><span>المتوسط</span></div>
            </div>
            <span className="sx-level"><Trophy style={{ width: 16, height: 16 }} />{level(avg, count)}</span>
          </section>
        </div>

        <section className="sx-card" style={{ marginTop: '1.2rem' }}>
          <div className="sx-card-head"><h2>نتائج الامتحانات</h2><small>{count} نتيجة</small></div>
          {count ? (
            <div className="sx-results">
              {attempts.map(a => {
                const st = status(a);
                return (
                  <article key={a.id} className="sx-result">
                    <div className="sx-mini">
                      <Ring value={a.percentage} size={58} stroke={6} color={STATUS_COLOR[st]} />
                      <b>{a.percentage}%</b>
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <h3>{a.quizTitle}</h3>
                      <div className="sx-meta">
                        <span>الدرجة: <strong>{a.score} / {a.totalPoints}</strong></span>
                        <time dateTime={a.completedAt}>{formatDate(a.completedAt)}</time>
                      </div>
                    </div>
                    <span className={`sx-status ${st}`}>{STATUS_TEXT[st]}</span>
                  </article>
                );
              })}
            </div>
          ) : !error && (
            <div className="sx-empty">
              <span className="sx-empty-ico"><FileQuestion /></span>
              <h3>لسه ما سلّمتش امتحانات</h3>
              <p>ادخل بنك الامتحانات وجرّب أول امتحان، ونتيجتك هتظهر هنا فورًا.</p>
              <button className="sx-btn sx-btn-primary" onClick={() => onNavigate('exams')}>ابدأ أول امتحان</button>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
