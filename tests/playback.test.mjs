import test from 'node:test';
import assert from 'node:assert/strict';
import { createPlaybackHandler } from '../server/playback.mjs';

const userId = '11111111-1111-4111-8111-111111111111';
const env = { SUPABASE_URL: 'https://test.supabase.co', SUPABASE_PUBLISHABLE_KEY: 'public-test-key', VDOCIPHER_API_KEY: 'test-server-secret' };
const auth = 'Bearer valid.token.for.test.only';
const identity = { id: userId, email_confirmed_at: '2026-01-01T00:00:00Z', is_anonymous: false };
const grant = { status: 'allowed', user_id: userId, video_id: 'server-selected-video' };
async function run({ request = {}, responses = [identity, grant, { otp: 'one-use-token', playbackInfo: 'playback-data' }], config = env } = {}) {
  const calls = [];
  const handler = createPlaybackHandler({ env: config, fetchImpl: async (url, options) => {
    calls.push({ url, ...options });
    const next = responses[calls.length - 1];
    if (next instanceof Error) throw next;
    if (next instanceof Response) return next;
    assert.notEqual(next, undefined, 'unexpected external call');
    return Response.json(next);
  } });
  const res = { headers: {}, code: 0, body: null, setHeader(k, v) { this.headers[k] = v; }, status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } };
  await handler({ method: 'POST', headers: { authorization: auth, 'content-type': 'application/json' }, body: { lectureId: 'lec_1' }, ...request }, res);
  assert.match(res.headers['Cache-Control'], /no-store/);
  assert.equal(res.headers['Vercel-CDN-Cache-Control'], 'no-store');
  assert.ok(!JSON.stringify(res.body).includes(env.VDOCIPHER_API_KEY));
  assert.equal(res.headers['Access-Control-Allow-Origin'], undefined);
  return { res, calls };
}
test('authorized identity and database grant produce a short-lived OTP for the server-selected video', async () => {
  const { res, calls } = await run();
  assert.equal(res.code, 200);
  assert.deepEqual(res.body, { otp: 'one-use-token', playbackInfo: 'playback-data' });
  assert.equal(calls[0].url, 'https://test.supabase.co/auth/v1/user');
  assert.equal(calls[1].headers.Authorization, auth);
  assert.deepEqual(JSON.parse(calls[1].body), { requested_lecture: 'lec_1' });
  assert.equal(calls[2].url, 'https://dev.vdocipher.com/api/videos/server-selected-video/otp');
  assert.equal(calls[2].headers.Authorization, 'Apisecret test-server-secret');
  assert.deepEqual(JSON.parse(calls[2].body), { ttl: 300 });
  assert.ok(calls.every(c => c.redirect === 'error' && c.signal instanceof AbortSignal));
});
for (const method of ['GET', 'OPTIONS', 'PUT']) test(`rejects ${method}`, async () => {
  const {res,calls}=await run({ request:{method} }); assert.equal(res.code,405); assert.equal(calls.length,0);
});
test('rejects missing bearer even with forged local user cookie', async () => {
  const {res,calls}=await run({request:{headers:{cookie:'role=admin; user=std_1','content-type':'application/json'}}});
  assert.equal(res.code,401); assert.equal(calls.length,0);
});
test('rejects cross-site requests', async () => {
  const {res,calls}=await run({request:{headers:{authorization:auth,'content-type':'application/json','sec-fetch-site':'cross-site'}}});
  assert.equal(res.code,403); assert.equal(calls.length,0);
});
test('requires JSON', async () => {
  const {res,calls}=await run({request:{headers:{authorization:auth,'content-type':'text/plain'}}}); assert.equal(res.code,415);assert.equal(calls.length,0);
});
for (const body of [null, [], {}, {lectureId:'../other'}, {lectureId:['lec_1']}, {lectureId:'lec_1',videoId:'attacker'}, {lectureId:'lec_1',userId:userId}, {lectureId:'lec_1',role:'teacher'}, '{broken']) test(`rejects malformed or client-selected authorization: ${JSON.stringify(body)}`, async () => {
  const {res,calls}=await run({request:{body}}); assert.equal(res.code,400);assert.equal(calls.length,0);
});
test('rejects excessive request body', async () => { const {res}=await run({request:{body:'a'.repeat(1025)}});assert.equal(res.code,413); });
test('rejects invalid or expired access token at the auth server', async () => {
  const {res,calls}=await run({responses:[new Response('',{status:401})]}); assert.equal(res.code,401);assert.equal(calls.length,1);
});
for (const user of [{...identity,email_confirmed_at:null},{...identity,is_anonymous:true},{id:'std_1',email_confirmed_at:'yes'}]) test('rejects an unconfirmed, anonymous, or invalid identity',async()=>{
  const {res,calls}=await run({responses:[user]});assert.equal(res.code,401);assert.equal(calls.length,1);
});
for (const permission of [{status:'denied'}, {...grant,user_id:'another-student'}, {...grant,video_id:'../secret'}, null]) test('denies an absent/mismatched entitlement without calling VdoCipher',async()=>{
  const {res,calls}=await run({responses:[identity,permission]});assert.equal(res.code,403);assert.equal(calls.length,2);
});
test('enforces shared database rate limits',async()=>{
  const {res,calls}=await run({responses:[identity,{status:'rate_limited'}]});assert.equal(res.code,429);assert.equal(res.headers['Retry-After'],'60');assert.equal(calls.length,2);
});
for (const responses of [[new Error('network')],[identity,new Response('internal details',{status:500})],[identity,grant,new Error('timeout')]]) test('fails closed during upstream failure',async()=>{
  const {res}=await run({responses});assert.equal(res.code,503);assert.ok(!JSON.stringify(res.body).includes('internal details'));
});
test('does not leak provider errors',async()=>{const {res}=await run({responses:[identity,grant,new Response('sensitive upstream body',{status:401})]});assert.equal(res.code,502);assert.deepEqual(res.body,{error:'VIDEO_SERVICE_UNAVAILABLE'});});
test('rejects malformed playback credentials',async()=>{const {res}=await run({responses:[identity,grant,{otp:'',playbackInfo:'bad'}]});assert.equal(res.code,502);});
test('missing secret never calls external services',async()=>{const {res,calls}=await run({config:{...env,VDOCIPHER_API_KEY:''}});assert.equal(res.code,503);assert.equal(calls.length,0);});
