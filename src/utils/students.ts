import type { Student } from '../types';
import { readSession } from './auth';
import { supabaseUrl, supabasePublishableKey } from '../../shared/supabase.mjs';
export type RegisteredStudent = Student & { confirmed: boolean };
export async function fetchRegisteredStudents(signal?: AbortSignal): Promise<RegisteredStudent[]> {
  const token = readSession()?.access_token;
  if (!token) throw new Error('سجّل دخول المعلم لعرض سجل الطلاب.');
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/list_platform_students`, {
    method: 'POST', cache: 'no-store', signal,
    headers: { apikey: supabasePublishableKey, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: '{}',
  });
  if (!response.ok) throw new Error(response.status === 401 || response.status === 403 ? 'الجلسة غير صالحة أو لا تملك صلاحية المعلم. سجّل الدخول مجددًا.' : 'تعذر تحميل سجل الطلاب. حاول تحديث السجل.');
  const data = await response.json();
  if (!Array.isArray(data)) throw new Error('تعذر قراءة سجل الطلاب.');
  return data;
}
