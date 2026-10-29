import test from 'node:test';
import assert from 'node:assert/strict';
import { signIn, signUp, signOut, readSession, currentAuthUser, clearSession } from '../src/utils/auth';

const values = new Map<string, string>();
Object.assign(globalThis, {
  window: new EventTarget(),
  sessionStorage: { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => values.set(key, value), removeItem: (key: string) => values.delete(key) },
});
const response = { access_token: 'test-access-token', refresh_token: 'must-not-be-stored', expires_in: 3600, user: { id: 'verified-user', email: 'student@example.invalid', email_confirmed_at: '2026-01-01', user_metadata: { name: 'Student', role: 'teacher', enrolledCourses: ['all'] } } };
test('password login uses Auth and does not grant a metadata role or persist password/refresh token', async () => {
  clearSession();
  let calls = 0;
  globalThis.fetch = async (url, options) => {
    calls++; assert.match(String(url), /\/auth\/v1\/token\?grant_type=password$/);
    assert.deepEqual(JSON.parse(options!.body as string), {email:'student@example.invalid',password:'test-password'});
    return Response.json(response);
  };
  const user = await signIn(' student@example.invalid ', 'test-password');
  assert.equal(calls,1); assert.equal(user.role,'student');
  assert.equal(readSession()?.access_token, 'test-access-token');
  const stored=Array.from(values.values()).join('');
  assert.ok(!stored.includes('must-not-be-stored'));assert.ok(!stored.includes('test-password'));
  assert.ok(!stored.includes('enrolledCourses'));
});
test('failed credentials do not sign in',async()=>{
  clearSession(); globalThis.fetch=async()=>new Response('',{status:400});
  await assert.rejects(signIn('student@example.invalid','wrong'));
  assert.equal(readSession(),null);
});
test('email confirmation required before accepting session',async()=>{
  clearSession(); globalThis.fetch=async()=>Response.json({...response,user:{...response.user,email_confirmed_at:null}});
  await assert.rejects(signIn('student@example.invalid','test-password'));
  assert.equal(readSession(),null);
});
test('registration awaiting email confirmation creates no signed-in session',async()=>{
  clearSession();globalThis.fetch=async()=>Response.json({user:response.user});
  assert.equal(await signUp('student@example.invalid','test-password',{name:'Student',phone:'01000000000',parentPhone:'01000000001',grade:'sec3',governorate:'Test'}),null);
  assert.equal(readSession(),null);
});
test('old local demo identity is not a login session',()=>{
  clearSession(); values.set('biomaster_current_user',JSON.stringify({id:'std_1',role:'teacher'}));
  assert.equal(currentAuthUser().id,'guest');assert.equal(readSession(),null);
});
test('expired saved token cannot authorize a new playback request',()=>{
  clearSession();values.set('biomaster_verified_session_v1',JSON.stringify({access_token:'expired',expires_at:1,user:{id:'old'}}));
  assert.equal(readSession(),null);
});
test('sign-out clears the player session even when the network fails',async()=>{
  clearSession();globalThis.fetch=async()=>Response.json(response);await signIn('student@example.invalid','test-password');
  globalThis.fetch=async()=>{throw new Error('offline');};await signOut();assert.equal(readSession(),null);assert.equal(currentAuthUser().id,'guest');
});
