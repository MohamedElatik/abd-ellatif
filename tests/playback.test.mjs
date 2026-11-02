import test from 'node:test';
import assert from 'node:assert/strict';
import { createPlaybackHandler } from '../server/playback.mjs';
const env={SUPABASE_URL:'https://test.supabase.co',SUPABASE_PUBLISHABLE_KEY:'public-test-key',VDOCIPHER_API_KEY:'test-server-secret'};
const grant={status:'allowed',video_id:'server-selected-video'};
async function run({request={},responses=[grant,{otp:'one-use-token',playbackInfo:'playback-data'}],config=env}={}){
 const calls=[];const handler=createPlaybackHandler({env:config,fetchImpl:async(url,options)=>{calls.push({url,...options});const next=responses[calls.length-1];if(next instanceof Error)throw next;if(next instanceof Response)return next;assert.notEqual(next,undefined);return Response.json(next);}});
 const res={headers:{},code:0,body:null,setHeader(k,v){this.headers[k]=v;},status(code){this.code=code;return this;},json(body){this.body=body;return this;}};
 await handler({method:'POST',headers:{'content-type':'application/json'},body:{lectureId:'lec_1'},...request},res);
 assert.match(res.headers['Cache-Control'],/no-store/);assert.equal(res.headers['Vercel-CDN-Cache-Control'],'no-store');assert.ok(!JSON.stringify(res.body).includes(env.VDOCIPHER_API_KEY));assert.equal(res.headers['Access-Control-Allow-Origin'],undefined);return {res,calls};
}
test('guest can play a published video without identity or enrollment',async()=>{
 const {res,calls}=await run();assert.equal(res.code,200);assert.deepEqual(res.body,{otp:'one-use-token',playbackInfo:'playback-data'});
 assert.equal(calls[0].url,'https://test.supabase.co/rest/v1/rpc/authorize_public_video_playback');assert.equal(calls[0].headers.Authorization,undefined);assert.deepEqual(JSON.parse(calls[0].body),{requested_lecture:'lec_1'});
 assert.equal(calls[1].url,'https://dev.vdocipher.com/api/videos/server-selected-video/otp');assert.equal(calls[1].headers.Authorization,'Apisecret test-server-secret');assert.deepEqual(JSON.parse(calls[1].body),{ttl:300});assert.ok(calls.every(c=>c.redirect==='error'&&c.signal instanceof AbortSignal));
});
test('expired login does not restrict intentionally public videos',async()=>{const {res}=await run({request:{headers:{'content-type':'application/json',authorization:'Bearer expired.token'}}});assert.equal(res.code,200);});
for(const method of ['GET','OPTIONS','PUT'])test('rejects '+method,async()=>{const {res,calls}=await run({request:{method}});assert.equal(res.code,405);assert.equal(calls.length,0);});
test('rejects cross-site requests',async()=>{const {res,calls}=await run({request:{headers:{'content-type':'application/json','sec-fetch-site':'cross-site'}}});assert.equal(res.code,403);assert.equal(calls.length,0);});
test('requires JSON',async()=>{const {res,calls}=await run({request:{headers:{'content-type':'text/plain'}}});assert.equal(res.code,415);assert.equal(calls.length,0);});
for(const body of [null,[],{},{lectureId:'../other'},{lectureId:['lec_1']},{lectureId:'lec_1',videoId:'attacker'},{lectureId:'lec_1',userId:'forged'},{lectureId:'lec_1',role:'teacher'},'{broken'])test('rejects malformed or provider-selected request '+JSON.stringify(body),async()=>{const {res,calls}=await run({request:{body}});assert.equal(res.code,400);assert.equal(calls.length,0);});
test('rejects excessive body',async()=>{const {res}=await run({request:{body:'a'.repeat(1025)}});assert.equal(res.code,413);});
for(const permission of [{status:'denied'},{...grant,video_id:'../secret'},null])test('unpublished or invalid video never reaches provider',async()=>{const {res,calls}=await run({responses:[permission]});assert.equal(res.code,403);assert.equal(calls.length,1);});
test('enforces shared rate limit',async()=>{const {res,calls}=await run({responses:[{status:'rate_limited'}]});assert.equal(res.code,429);assert.equal(res.headers['Retry-After'],'60');assert.equal(calls.length,1);});
for(const responses of [[new Error('network')],[new Response('private error',{status:500})],[grant,new Error('timeout')]])test('fails closed on upstream errors',async()=>{const {res}=await run({responses});assert.equal(res.code,503);assert.ok(!JSON.stringify(res.body).includes('private error'));});
test('does not leak provider errors',async()=>{const {res}=await run({responses:[grant,new Response('sensitive body',{status:401})]});assert.equal(res.code,502);assert.deepEqual(res.body,{error:'VIDEO_SERVICE_UNAVAILABLE'});});
test('rejects malformed playback credentials',async()=>{const {res}=await run({responses:[grant,{otp:'',playbackInfo:'bad'}]});assert.equal(res.code,502);});
test('missing server secret fails before external calls',async()=>{const {res,calls}=await run({config:{...env,VDOCIPHER_API_KEY:''}});assert.equal(res.code,503);assert.equal(calls.length,0);});
