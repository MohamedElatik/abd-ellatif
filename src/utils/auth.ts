import type { User, GradeLevel } from '../types';
import { supabaseUrl, supabasePublishableKey } from '../../shared/supabase.mjs';

const SESSION_KEY = 'biomaster_verified_session_v1';
export const AUTH_CHANGED = 'biomaster_auth_changed';
export const guestUser: User = { id: 'guest', name: 'زائر', phone: '', role: 'student', createdAt: '' };
interface Session { access_token: string; expires_at: number; user: User }
let memorySession: Session | null = null;
let verifiedAdminToken: string | null = null;

export function readSession(): Session | null {
  try {
    const saved = sessionStorage.getItem(SESSION_KEY);
    const session = saved ? JSON.parse(saved) : memorySession;
    if (session && typeof session.access_token === 'string' && session.expires_at > Date.now() / 1000 + 10) {
      // UI data is presentation only. Every playback request is verified server-side.
      return { ...session, user: { ...session.user, role: verifiedAdminToken === session.access_token ? 'admin' : 'student' } };
    }
  } catch { /* Private browsing may disable storage. */ }
  if (memorySession && memorySession.expires_at > Date.now() / 1000 + 10) return { ...memorySession, user: { ...memorySession.user, role: verifiedAdminToken === memorySession.access_token ? 'admin' : 'student' } };
  return null;
}

export function clearSession() {
  memorySession = null;
  verifiedAdminToken = null;
  try { sessionStorage.removeItem(SESSION_KEY); } catch { /* memory-only session */ }
  window.dispatchEvent(new Event(AUTH_CHANGED));
}

export function currentAuthUser(): User { return readSession()?.user || guestUser; }

export async function refreshIdentity() {
  const session = readSession();
  if (!session) return;
  try {
    const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: { apikey: supabasePublishableKey, Authorization: `Bearer ${session.access_token}` },
      signal: AbortSignal.timeout(10000),
    });
    if (readSession()?.access_token !== session.access_token) return;
    if (!response.ok) { clearSession(); return; }
    const user = await response.json();
    if (readSession()?.access_token !== session.access_token) return;
    if (user.id !== session.user.id || !user.email_confirmed_at) { clearSession(); return; }
    acceptSession({ access_token: session.access_token, expires_in: Math.max(0, session.expires_at - Date.now() / 1000), user });
  } catch { verifiedAdminToken = null; window.dispatchEvent(new Event(AUTH_CHANGED)); }
}

async function authRequest(path: string, body: unknown) {
  let response: Response;
  try {
    response = await fetch(`${supabaseUrl}/auth/v1/${path}`, {
      method: 'POST', headers: { apikey: supabasePublishableKey, 'Content-Type': 'application/json' },
      body: JSON.stringify(body), signal: AbortSignal.timeout(15000),
    });
  } catch { throw new Error('تعذر الاتصال بخدمة تسجيل الدخول. حاول مرة أخرى.'); }
  if (!response.ok) {
    if (response.status === 429) throw new Error('محاولات كثيرة. انتظر قليلًا ثم حاول مجددًا.');
    throw new Error('تعذر إتمام الطلب. راجع البريد وكلمة المرور وتأكيد البريد الإلكتروني.');
  }
  return response.json();
}

function acceptSession(data: any): User | null {
  if (!data.access_token || !data.user?.id || !data.user?.email_confirmed_at) return null;
  verifiedAdminToken = data.user.app_metadata?.role === 'admin' ? data.access_token : null;
  const metadata = data.user.user_metadata || {};
  const user: User = {
    id: data.user.id, email: data.user.email, name: metadata.name || 'طالب',
    phone: metadata.phone || '', parentPhone: metadata.parentPhone || '',
    grade: 'sec3',
    governorate: metadata.governorate || '', role: data.user.app_metadata?.role === 'admin' ? 'admin' : 'student', createdAt: data.user.created_at || '',
  };
  memorySession = { access_token: data.access_token, expires_at: Date.now() / 1000 + Number(data.expires_in || 3600), user };
  try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(memorySession)); } catch { /* memory-only session */ }
  window.dispatchEvent(new Event(AUTH_CHANGED));
  return user;
}

export async function signIn(email: string, password: string): Promise<User> {
  const data = await authRequest('token?grant_type=password', { email: email.trim(), password });
  const user = acceptSession(data);
  if (!user) throw new Error('أكد بريدك الإلكتروني أولًا ثم سجّل الدخول.');
  return user;
}

export async function signUp(email: string, password: string, profile: { name: string; phone: string; parentPhone: string; grade: GradeLevel; governorate: string }): Promise<User | null> {
  const data = await authRequest('signup', { email: email.trim(), password, data: { ...profile, grade: 'sec3' } });
  return acceptSession(data);
}

export async function signOut() {
  const token = readSession()?.access_token;
  clearSession();
  if (token) {
    try {
      await fetch(`${supabaseUrl}/auth/v1/logout`, {
        method: 'POST', headers: { apikey: supabasePublishableKey, Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(8000),
      });
    } catch { /* Local access is already cleared. Tokens expire at the Auth server. */ }
  }
}
