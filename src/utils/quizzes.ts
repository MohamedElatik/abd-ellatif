import { useEffect, useState } from 'react';
import type { Quiz } from '../types';
import { readSession, ensureSession, AUTH_CHANGED } from './auth';
import { supabaseUrl, supabasePublishableKey } from '../../shared/supabase.mjs';
export function quizHeaders() {
  const token=readSession()?.access_token;
  if(!token) throw new Error('سجّل الدخول أولًا.');
  return { apikey:supabasePublishableKey, Authorization:`Bearer ${token}`, 'Content-Type':'application/json' };
}
export async function databaseRequest(path: string, method='GET', body?: unknown, prefer='return=minimal') {
  await ensureSession();
  const r=await fetch(`${supabaseUrl}/rest/v1/${path}`,{method,headers:{...quizHeaders(),Prefer:prefer},cache:'no-store',body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(15000)});
  if(!r.ok) throw new Error(r.status===401||r.status===403?'سجّل الدخول بالحساب المخوّل لهذا الإجراء.':'تعذر الحفظ أو التحميل من قاعدة البيانات. حاول مجددًا.');
  const content=await r.text();
  return content ? JSON.parse(content) : null;
}
export function validateQuiz(quiz: Quiz) {
  if(!Number.isFinite(quiz.timeLimitMinutes)||quiz.timeLimitMinutes<1||!Number.isFinite(quiz.passingScore)||quiz.passingScore<0||quiz.passingScore>100) throw new Error('راجع مدة الامتحان ونسبة النجاح.');
  if(!quiz.title.trim()||quiz.grade!=='sec3'||quiz.questions.length<1||quiz.questions.length>100) throw new Error('اكتب عنوان الامتحان وأضف من سؤال إلى 100 سؤال.');
  for(const q of quiz.questions) {
    if(!q.prompt.trim()||!Number.isFinite(q.points)||q.points<=0||!q.correctAnswer?.trim()) throw new Error('أكمل نص كل سؤال وإجابته الصحيحة ودرجته.');
    if(q.type==='mcq' && (!q.options||q.options.length<2||q.options.some(o=>!o.trim())||new Set(q.options.map(o=>o.trim())).size!==q.options.length||!q.options.includes(q.correctAnswer))) throw new Error('اكتب اختيارات مختلفة وحدد الإجابة الصحيحة لكل سؤال.');
  }
}
export function legacyQuizDrafts():Quiz[]{try{const data=JSON.parse(localStorage.getItem('biomaster_quizzes')||'[]');return Array.isArray(data)?data.filter(q=>q.grade==='sec3'&&/^quiz_\d+$/.test(q.id)&&Array.isArray(q.questions)):[];}catch{return [];}}
export async function publishQuiz(quiz: Quiz) {
  validateQuiz(quiz);
  await databaseRequest('platform_quizzes','POST',{id:quiz.id,document:quiz,published:true});
  window.dispatchEvent(new Event('biomaster_quizzes_changed'));
}
export async function archiveQuiz(id: string) {
  await databaseRequest(`platform_quizzes?id=eq.${encodeURIComponent(id)}`,'PATCH',{published:false});
  window.dispatchEvent(new Event('biomaster_quizzes_changed'));
}
export function useQuizzes() {
  const [quizzes,setQuizzes]=useState<Quiz[]>([]),[error,setError]=useState('');
  useEffect(()=>{
    let alive=true, generation=0;
    const load=async()=>{ const ticket=++generation;
      if(!readSession()) {setQuizzes([]);setError('سجّل الدخول لعرض الامتحانات.');return;}
      try {const rows=await databaseRequest('rpc/list_platform_quizzes','POST',{});if(alive&&ticket===generation){setQuizzes(rows);setError('');}}
      catch(e){if(alive&&ticket===generation){setQuizzes([]);setError(e instanceof Error?e.message:'تعذر تحميل الامتحانات.');}}
    };
    void load();const timer=setInterval(load,30000);
    window.addEventListener(AUTH_CHANGED,load);window.addEventListener('biomaster_quizzes_changed',load);window.addEventListener('focus',load);
    return()=>{alive=false;clearInterval(timer);window.removeEventListener(AUTH_CHANGED,load);window.removeEventListener('biomaster_quizzes_changed',load);window.removeEventListener('focus',load);};
  },[]);
  return {quizzes,error};
}

