import test from 'node:test';
import assert from 'node:assert/strict';
import { consumeRecoveryLink, requestRecovery, resetPassword } from '../src/utils/recovery';
test('recovery token is removed from URL and normal login tokens are not used for recovery', () => {
  let clean = '';
  Object.assign(globalThis, { window: { location: { hash:'#type=recovery&access_token=private&refresh_token=secret',pathname:'/',search:'' }, history:{ replaceState: (_a: unknown,_b: string,url: string) => { clean=url; } } } });
  assert.equal(consumeRecoveryLink().token,'private'); assert.equal(clean,'/');
  window.location.hash='#type=signup&access_token=private'; assert.equal(consumeRecoveryLink().token,null);
});
test('recovery email uses production redirect and no password', async () => {
  globalThis.fetch=async(url,init)=>{ assert.ok(String(url).includes(encodeURIComponent('https://abd-ellatif.vercel.app/'))); assert.deepEqual(JSON.parse(init!.body as string),{email:'student@example.invalid'}); return Response.json({}); };
  await requestRecovery(' student@example.invalid ');
});
test('missing token and short passwords never reach Auth',async()=>{
  globalThis.fetch=async()=>{throw new Error('unexpected request');};
  await assert.rejects(resetPassword('', 'long-password-123')); await assert.rejects(resetPassword('token','short'));
});
test('invalid recovery token cannot change password or sign out',async()=>{
  let calls=0;globalThis.fetch=async()=>{calls++;return new Response('',{status:401});};
  await assert.rejects(resetPassword('expired','long-password-123'));assert.equal(calls,1);
});
test('successful reset retires recovery session',async()=>{
  const calls:string[]=[];globalThis.fetch=async(url,init)=>{calls.push(String(url));assert.equal((init!.headers as Record<string,string>).Authorization,'Bearer recovery');return Response.json({});};
  await resetPassword('recovery','long-password-123');assert.ok(calls[0].endsWith('/user'));assert.ok(calls[1].endsWith('/logout'));
});
