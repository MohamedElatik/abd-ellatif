import type { Question } from '../types';
export function QuestionEditor({questions,onChange}:{questions:Question[];onChange:(q:Question[])=>void}) {
  const update=(i:number,patch:Partial<Question>)=>onChange(questions.map((q,n)=>n===i?{...q,...patch}:q));
  const field='w-full rounded-lg bg-slate-800 border border-slate-600 p-2 text-white';
  return <div className="space-y-4">
    <h4 className="font-bold">الأسئلة التي تكتبها ({questions.length})</h4>
    {questions.length===0&&<p>لا توجد أسئلة بعد. اضغط إضافة سؤال واملأه بنفسك.</p>}
    {questions.map((q,i)=><fieldset key={q.id} className="space-y-3 border border-slate-600 rounded-xl p-3">
      <legend>السؤال {i+1}</legend>
      <label className="block">نوع السؤال<select className={field} value={q.type} onChange={e=>update(i,{type:e.target.value as Question['type'],correctAnswer:'',options:e.target.value==='mcq'?['','','','']:undefined})}><option value="mcq">اختيار من متعدد</option><option value="essay">مقالي</option></select></label>
      <label className="block">نص السؤال<textarea required className={field} value={q.prompt} onChange={e=>update(i,{prompt:e.target.value})}/></label>
      {q.type==='mcq'?<>
        {q.options?.map((option,n)=><label key={n} className="block">الاختيار {n+1}<input required className={field} value={option} onChange={e=>{const options=[...q.options!];options[n]=e.target.value;update(i,{options,correctAnswer:q.correctAnswer&&q.correctAnswer===option?e.target.value:q.correctAnswer});}}/></label>)}
        <label className="block">الإجابة الصحيحة<select required className={field} value={q.correctAnswer||''} onChange={e=>update(i,{correctAnswer:e.target.value})}><option value="">اختر الإجابة الصحيحة</option>{q.options?.map((o,n)=><option key={n} disabled={!o.trim()} value={o}>{n+1}: {o}</option>)}</select></label>
      </>:<label className="block">الإجابة النموذجية<textarea required className={field} value={q.correctAnswer||''} onChange={e=>update(i,{correctAnswer:e.target.value})}/></label>}
      <label className="block">درجة السؤال<input required type="number" min={1} max={100} className={field} value={q.points} onChange={e=>update(i,{points:Number(e.target.value)})}/></label>
      <label className="block">تفسير الإجابة (اختياري)<textarea className={field} value={q.explanation} onChange={e=>update(i,{explanation:e.target.value})}/></label>
      <button type="button" className="text-rose-300" onClick={()=>onChange(questions.filter((_,n)=>n!==i))}>إزالة السؤال</button>
    </fieldset>)}
    <button type="button" disabled={questions.length>=100} className="rounded-lg bg-cyan-700 p-3 text-white" onClick={()=>onChange([...questions,{id:crypto.randomUUID(),type:'mcq',prompt:'',options:['','','',''],correctAnswer:'',explanation:'',points:1}])}>إضافة سؤال</button>
  </div>;
}
