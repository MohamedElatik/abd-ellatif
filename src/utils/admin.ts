import { useEffect, useState } from 'react';
import type { AttendanceRecord, AttendanceStatus } from '../types';
import { databaseRequest } from './quizzes';
import { readSession, AUTH_CHANGED } from './auth';
import { supabaseUrl, supabasePublishableKey } from '../../shared/supabase.mjs';

// ---------- attendance by code (teacher or secretary) ----------
export type CodeAttendanceResult = { status: 'saved'; record: AttendanceRecord & { studentCode: string; recordedAt?: string } } | { status: 'not_found' };

export function recordAttendanceByCode(code: string, sessionTitle: string, sessionDate: string, status: AttendanceStatus): Promise<CodeAttendanceResult> {
  return databaseRequest('rpc/record_attendance_by_code', 'POST',
    { student_code: code.trim(), session_title: sessionTitle.trim(), session_date: sessionDate, attendance_status: status }, 'return=representation');
}

export async function listSessionAttendance(sessionTitle: string, sessionDate: string): Promise<(AttendanceRecord & { studentCode?: string; recordedAt?: string })[]> {
  return (await databaseRequest('rpc/list_session_attendance', 'POST', { session_title: sessionTitle.trim(), session_date: sessionDate }, 'return=representation')) || [];
}

/** The signed-in student's own attendance code ('' while loading or if none). */
export function useMyAttendanceCode(userId: string) {
  const [code, setCode] = useState('');
  useEffect(() => {
    let alive = true;
    const load = () => {
      if (userId === 'guest' || !readSession()) { setCode(''); return; }
      databaseRequest(`platform_student_codes?user_id=eq.${encodeURIComponent(userId)}&select=code`)
        .then(rows => { if (alive) setCode(rows?.[0]?.code || ''); })
        .catch(() => { if (alive) setCode(''); });
    };
    load();
    window.addEventListener(AUTH_CHANGED, load);
    return () => { alive = false; window.removeEventListener(AUTH_CHANGED, load); };
  }, [userId]);
  return code;
}

// ---------- teacher-only ----------
export async function deleteStudent(id: string): Promise<'deleted' | 'not_found' | 'not_allowed'> {
  const r = await databaseRequest('rpc/delete_platform_student', 'POST', { target: id }, 'return=representation');
  return r?.status;
}
export async function deleteAttempts(ids: string[]): Promise<number> {
  return databaseRequest('rpc/delete_platform_attempts', 'POST', { attempt_ids: ids }, 'return=representation');
}
export async function deleteStudentAttempts(studentId: string): Promise<number> {
  return databaseRequest('rpc/delete_student_attempts', 'POST', { student: studentId }, 'return=representation');
}

export type Secretary = { id: string; email: string; name: string };
export async function listSecretaries(): Promise<Secretary[]> {
  return (await databaseRequest('rpc/list_platform_secretaries', 'POST', {}, 'return=representation')) || [];
}
export async function setSecretary(email: string, makeSecretary: boolean): Promise<{ status: 'saved' | 'not_found' | 'not_allowed'; name?: string }> {
  return databaseRequest('rpc/set_platform_secretary', 'POST', { account_email: email.trim(), make_secretary: makeSecretary }, 'return=representation');
}

/** Crops the picture to 16:9 (1280×720), uploads it to the public course-images bucket and returns its address. */
export async function uploadCourseImage(courseId: string, file: File): Promise<string> {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 15 * 1024 * 1024) {
    throw new Error('اختر صورة PNG أو JPG أو WebP بحجم لا يتجاوز 15 ميجابايت.');
  }
  const token = readSession()?.access_token;
  if (!token) throw new Error('سجّل دخول المعلم لرفع الصور.');
  const bitmap = await createImageBitmap(file);
  const W = 1280, H = 720, scale = Math.max(W / bitmap.width, H / bitmap.height);
  const canvas = document.createElement('canvas'); canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d')!;
  const w = bitmap.width * scale, h = bitmap.height * scale;
  ctx.drawImage(bitmap, (W - w) / 2, (H - h) / 2, w, h);
  bitmap.close();
  const blob = await new Promise<Blob>((ok, fail) => canvas.toBlob(b => (b ? ok(b) : fail(new Error())), 'image/jpeg', 0.85));
  const safeId = courseId.replace(/[^a-zA-Z0-9_-]/g, '');
  const path = `courses/${safeId}-${Date.now()}.jpg`;
  const r = await fetch(`${supabaseUrl}/storage/v1/object/course-images/${path}`, {
    method: 'POST', body: blob, signal: AbortSignal.timeout(60000),
    headers: { apikey: supabasePublishableKey, Authorization: `Bearer ${token}`, 'Content-Type': 'image/jpeg', 'Cache-Control': '31536000' },
  });
  if (!r.ok) throw new Error(r.status === 401 || r.status === 403 ? 'رفع الصور متاح لحساب المعلم فقط.' : 'تعذر رفع الصورة. حاول مرة أخرى.');
  return `${supabaseUrl}/storage/v1/object/public/course-images/${path}`;
}
