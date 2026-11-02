import { useEffect, useState } from 'react';
import { databaseRequest } from './quizzes';
import { AUTH_CHANGED, readSession } from './auth';
import type { ExamAttempt, Question, AttendanceRecord } from '../types';
export type SavedAttempt=ExamAttempt & {pendingReview:boolean;questions:Question[];correctCount:number;incorrectCount:number;unansweredCount:number};
export function useAttempts(){
 const [attempts,setAttempts]=useState<SavedAttempt[]>([]),[error,setError]=useState('');
 useEffect(()=>{let alive=true,generation=0;const load=async()=>{const ticket=++generation;if(!readSession()){setAttempts([]);return;}try{const rows=await databaseRequest('platform_attempts?select=document&order=created_at.desc');if(alive&&ticket===generation){setAttempts(rows.map((r:{document:SavedAttempt})=>r.document));setError('');}}catch(e){if(alive&&ticket===generation){setAttempts([]);setError(e instanceof Error?e.message:'تعذر تحميل الدرجات');}}};void load();const timer=setInterval(load,15000);window.addEventListener('attempts_changed',load);window.addEventListener('focus',load);window.addEventListener(AUTH_CHANGED,load);return()=>{alive=false;clearInterval(timer);window.removeEventListener('attempts_changed',load);window.removeEventListener('focus',load);window.removeEventListener(AUTH_CHANGED,load);};},[]);
 return {attempts,error};
}
export async function saveAttendance(record:AttendanceRecord){await databaseRequest('platform_attendance?on_conflict=id','POST',{id:record.id,student_id:record.studentId,document:record},'resolution=merge-duplicates,return=minimal');}
