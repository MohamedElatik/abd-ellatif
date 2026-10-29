import { supabaseUrl, supabasePublishableKey } from '../../shared/supabase.mjs';

export function consumeRecoveryLink() {
  const params = new URLSearchParams(window.location.hash.slice(1));
  const recovery = params.get('type') === 'recovery';
  const token = recovery ? params.get('access_token') : null;
  const error = params.has('error');
  if (params.has('access_token') || error) {
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
  }
  return { token, error };
}

export async function requestRecovery(email: string) {
  const response = await fetch(`${supabaseUrl}/auth/v1/recover?redirect_to=${encodeURIComponent('https://abd-ellatif.vercel.app/')}`, {
    method: 'POST', headers: { apikey: supabasePublishableKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email.trim() }), signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error(response.status === 429 ? 'انتظر قليلًا قبل طلب رسالة جديدة.' : 'تعذر إرسال رسالة الاستعادة. حاول مرة أخرى.');
}

export async function resetPassword(token: string, password: string) {
  if (!token || password.length < 12) throw new Error('استخدم رابط استعادة صالحًا وكلمة مرور من 12 حرفًا على الأقل.');
  const headers = { apikey: supabasePublishableKey, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
    method: 'PUT', headers, body: JSON.stringify({ password }), signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error('تعذر تغيير كلمة المرور. قد يكون الرابط انتهى أو كلمة المرور غير مقبولة. اطلب رابطًا جديدًا أو اختر كلمة أخرى.');
  // Retire the recovery session. The user signs in normally with the new password.
  await fetch(`${supabaseUrl}/auth/v1/logout`, { method: 'POST', headers, signal: AbortSignal.timeout(8000) }).catch(() => {});
}
