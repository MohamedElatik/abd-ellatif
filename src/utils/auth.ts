import type { User, GradeLevel } from '../types';
import { supabaseUrl, supabasePublishableKey } from '../../shared/supabase.mjs';

const SESSION_KEY = 'biomaster_verified_session_v1';
export const AUTH_CHANGED = 'biomaster_auth_changed';
export const guestUser: User = { id: 'guest', name: 'زائر', phone: '', role: 'student', createdAt: '' };
interface Session { refresh_token?: string; access_token: string; expires_at: number; user: User }
let memorySession: Session | null = null;
let persistLogin = true;
let authGeneration = 0;
let refreshWork: Promise<Session | null> | null = null;
function storedSession(): Session | null { try { const s=localStorage.getItem(SESSION_KEY)||sessionStorage.getItem(SESSION_KEY);return s?JSON.parse(s):memorySession; } catch { try { const s=sessionStorage.getItem(SESSION_KEY);return s?JSON.parse(s):memorySession; } catch { return memorySession; } } }
export async function ensureSession(): Promise<Session | null> {
 const valid=readSession();if(valid&&valid.expires_at>Date.now()/1000+60)return valid;
 if(refreshWork)return refreshWork;
 const generation=authGeneration;
 const refresh=async()=>{const saved=storedSession();if(!saved?.refresh_token)return readSession();if(saved.expires_at>Date.now()/1000+60)return readSession();
  try {const r=await fetch(supabaseUrl+'/auth/v1/token?grant_type=refresh_token',{method:'POST',headers:{apikey:supabasePublishableKey,'Content-Type':'application/json'},body:JSON.stringify({refresh_token:saved.refresh_token}),signal:AbortSignal.timeout(15000)});
   if(generation!==authGeneration)return null;
   if(!r.ok){if(r.status===400||r.status===401)clearSession();throw new Error('تعذر تجديد تسجيل الدخول.');}
   const data=await r.json();if(generation!==authGeneration)return null;try{persistLogin=!!localStorage.getItem(SESSION_KEY);}catch{persistLogin=false;}acceptSession(data);return readSession();
  }catch(e){throw e;}
 };
 refreshWork=(typeof navigator!=='undefined'&&navigator.locks?navigator.locks.request('biomaster-auth-refresh',refresh):refresh()).finally(()=>{refreshWork=null;});return refreshWork;
}
// Staff role verified by the server for one specific access token. Saved browser data can never grant it.
let verifiedStaff: { token: string; role: 'admin' | 'secretary' } | null = null;
const roleFor = (token: string): User['role'] => (verifiedStaff?.token === token ? verifiedStaff.role : 'student');

export function readSession(): Session | null {
  try {
    const session = storedSession();
    if (session && typeof session.access_token === 'string' && session.expires_at > Date.now() / 1000 + 10) {
      // UI data is presentation only. Every playback request is verified server-side.
      return { ...session, user: { ...session.user, role: roleFor(session.access_token) } };
    }
  } catch { /* Private browsing may disable storage. */ }
  if (memorySession && memorySession.expires_at > Date.now() / 1000 + 10) return { ...memorySession, user: { ...memorySession.user, role: roleFor(memorySession.access_token) } };
  return null;
}

export function clearSession() {
  authGeneration++;
  memorySession = null;
  try { localStorage.removeItem(SESSION_KEY); } catch {}
  verifiedStaff = null;
  try { sessionStorage.removeItem(SESSION_KEY); } catch { /* memory-only session */ }
  window.dispatchEvent(new Event(AUTH_CHANGED));
}

export function currentAuthUser(): User { return readSession()?.user || guestUser; }

export async function refreshIdentity() {
  let session: Session | null;
  try { session = await ensureSession(); } catch { return; }
  if (!session) return;
  try {
    const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: { apikey: supabasePublishableKey, Authorization: `Bearer ${session.access_token}` },
      signal: AbortSignal.timeout(10000),
    });
    if (readSession()?.access_token !== session.access_token) return;
    if (!response.ok) { if(response.status===401||response.status===403) clearSession(); return; }
    const user = await response.json();
    if (readSession()?.access_token !== session.access_token) return;
    if (user.id !== session.user.id || !user.email_confirmed_at) { clearSession(); return; }
    try { persistLogin=!!localStorage.getItem(SESSION_KEY); } catch { persistLogin=false; }
    acceptSession({ refresh_token: session.refresh_token, access_token: session.access_token, expires_in: Math.max(0, session.expires_at - Date.now() / 1000), user });
  } catch { verifiedStaff = null; window.dispatchEvent(new Event(AUTH_CHANGED)); }
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
  const appRole = data.user.app_metadata?.role;
  const staffRole = appRole === 'admin' || appRole === 'secretary' ? appRole : null;
  verifiedStaff = staffRole ? { token: data.access_token, role: staffRole } : null;
  const metadata = data.user.user_metadata || {};
  const user: User = {
    id: data.user.id, email: data.user.email, name: metadata.name || 'طالب',
    phone: metadata.phone || '', parentPhone: metadata.parentPhone || '',
    grade: 'sec3',
    governorate: metadata.governorate || '', role: staffRole || 'student', createdAt: data.user.created_at || '',
  };
  memorySession = { refresh_token: data.refresh_token, access_token: data.access_token, expires_at: Date.now() / 1000 + Number(data.expires_in || 3600), user };
  try { const storage=persistLogin?localStorage:sessionStorage; storage.setItem(SESSION_KEY, JSON.stringify(memorySession)); (persistLogin?sessionStorage:localStorage).removeItem(SESSION_KEY); }  catch { /* memory-only session */ }
  window.dispatchEvent(new Event(AUTH_CHANGED));
  return user;
}

export async function signIn(email: string, password: string, remember = true): Promise<User> {
  persistLogin = remember;
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
