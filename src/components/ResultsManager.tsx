import { useState } from 'react';
import { useAttempts, SavedAttempt } from '../utils/records';
import { databaseRequest } from '../utils/quizzes';
import { deleteAttempts, deleteStudentAttempts } from '../utils/admin';
import { ConfirmDelete } from './ConfirmDelete';

const changed = () => window.dispatchEvent(new Event('attempts_changed'));

function GradeForm({attempt:a}:{attempt:SavedAttempt}){
 const [marks,setMarks]=useState<Record<string,number>>({}),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 return <form className="space-y-3 mt-4" onSubmit={async e=>{e.preventDefault();setBusy(true);setError('');try{await databaseRequest('rpc/grade_platform_attempt','POST',{attempt_id:a.id,marks});changed();}catch(e){setError((e as Error).message);}finally{setBusy(false);}}}>{a.questions.filter(q=>q.type==='essay').map(q=><fieldset key={q.id} className="border border-slate-200 dark:border-slate-700 p-3 rounded-xl"><legend className="px-1 font-bold">{q.prompt}</legend><p>إجابة الطالب: {a.answers[q.id]||'لم يجب'}</p><p>الإجابة النموذجية: {q.correctAnswer}</p><label>الدرجة من {q.points}<input required type="number" min="0" max={q.points} step="0.5" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-lg p-2 mx-2" value={marks[q.id]??''} onChange={e=>setMarks({...marks,[q.id]:Number(e.target.value)})}/></label></fieldset>)}{error&&<p role="alert" className="sx-alert">{error}</p>}<button disabled={busy} className="bg-emerald-600 text-white font-bold px-4 py-3 rounded-xl">حفظ التصحيح وإظهار الدرجة للطالب</button></form>;
}

export function ResultsManager() {
  const { attempts, error } = useAttempts();
  const [message, setMessage] = useState<{ text: string; err?: boolean } | null>(null);
  const [filter, setFilter] = useState('');
  const shown = attempts.filter(a => !filter || `${a.studentName} ${a.quizTitle}`.includes(filter.trim()));
  const perStudent = new Map<string, number>();
  for (const a of attempts) perStudent.set(a.studentId, (perStudent.get(a.studentId) || 0) + 1);

  async function run(job: () => Promise<number>, done: (n: number) => string) {
    setMessage(null);
    try { const n = await job(); changed(); setMessage({ text: done(n) }); }
    catch (e) { setMessage({ text: (e as Error).message, err: true }); }
  }

  return (
    <section className="space-y-4" dir="rtl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-black">نتائج الطلاب</h2>
        <input className="w-full sm:w-72 px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-sm" placeholder="ابحث باسم الطالب أو الامتحان…" value={filter} onChange={e => setFilter(e.target.value)} />
      </div>
      {error && <p role="alert" className="sx-alert">{error}</p>}
      {message && <p role="status" className={message.err ? 'sx-alert' : 'sx-ok'}>{message.text}</p>}
      {!attempts.length && !error && <p>لا توجد امتحانات مسلّمة بعد.</p>}
      {shown.map(a => (
        <article key={a.id} className="rounded-2xl p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="font-black">{a.studentName || a.studentId} — {a.quizTitle}</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">{a.score}/{a.totalPoints} — {a.percentage}% — {a.completedAt} · {a.pendingReview ? 'بانتظار تصحيح المقالي' : 'تم التصحيح'}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <ConfirmDelete label="حذف النتيجة" question="تحذف النتيجة دي؟"
                onConfirm={() => run(() => deleteAttempts([a.id]), () => `اتحذفت نتيجة ${a.studentName || 'الطالب'} في ${a.quizTitle}.`)} />
              {(perStudent.get(a.studentId) || 0) > 1 && (
                <ConfirmDelete label={`كل نتائج الطالب (${perStudent.get(a.studentId)})`} question={`تحذف كل نتائج ${a.studentName || 'الطالب'}؟`}
                  onConfirm={() => run(() => deleteStudentAttempts(a.studentId), n => `اتحذفت ${n} نتيجة لـ ${a.studentName || 'الطالب'}.`)} />
              )}
            </div>
          </div>
          {a.pendingReview && <GradeForm attempt={a} />}
        </article>
      ))}
    </section>
  );
}
