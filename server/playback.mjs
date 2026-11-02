// Server-only. Never import this module from src/.
import { supabaseUrl, supabasePublishableKey } from '../shared/supabase.mjs';
const ID = /^[a-zA-Z0-9_-]{1,100}$/;

export function createPlaybackHandler({ env = process.env, fetchImpl = fetch } = {}) {
  return async function handler(req, res) {
    res.setHeader('Cache-Control', 'private, no-store, max-age=0');
    res.setHeader('CDN-Cache-Control', 'no-store');
    res.setHeader('Vercel-CDN-Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    const fail = (status, error) => res.status(status).json({ error });
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      return fail(405, 'METHOD_NOT_ALLOWED');
    }
    // Public playback is intentional. Publication and shared rate limits are checked server-side.
    if (req.headers['sec-fetch-site'] === 'cross-site') return fail(403, 'FORBIDDEN');
    if (!/^application\/json(?:;|$)/i.test(req.headers['content-type'] || '')) {
      return fail(415, 'JSON_REQUIRED');
    }
    let body = req.body;
    if (typeof body === 'string') {
      if (Buffer.byteLength(body) > 1024) return fail(413, 'BODY_TOO_LARGE');
      try { body = JSON.parse(body); } catch { return fail(400, 'INVALID_REQUEST'); }
    }
    if (!body || Array.isArray(body) || typeof body !== 'object' ||
        Object.keys(body).length !== 1 || typeof body.lectureId !== 'string' || !ID.test(body.lectureId)) {
      return fail(400, 'INVALID_REQUEST');
    }
    const base = env.SUPABASE_URL || supabaseUrl;
    const key = env.SUPABASE_PUBLISHABLE_KEY || supabasePublishableKey;
    if (!base || !key || !env.VDOCIPHER_API_KEY) return fail(503, 'PLAYBACK_NOT_CONFIGURED');
    let url;
    try {
      url = new URL(base);
      if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || url.pathname !== '/') throw new Error();
    } catch { return fail(503, 'PLAYBACK_NOT_CONFIGURED'); }
    const headers = { apikey: key, 'Content-Type': 'application/json' };
    const request = (target, options) => fetchImpl(target, {
      ...options, redirect: 'error', signal: AbortSignal.timeout(8000),
    });
    try {
      // Only the database can select a published lesson/video; clients never supply provider IDs.
      const access = await request(`${url.origin}/rest/v1/rpc/authorize_public_video_playback`, {
        method: 'POST', headers, body: JSON.stringify({ requested_lecture: body.lectureId }),
      });
      if (!access.ok) return fail(503, 'ACCESS_CHECK_UNAVAILABLE');
      const grant = await access.json();
      if (grant?.status === 'rate_limited') {
        res.setHeader('Retry-After', '60');
        return fail(429, 'TOO_MANY_REQUESTS');
      }
      if (grant?.status !== 'allowed' || !ID.test(grant.video_id || '')) {
        return fail(403, 'VIDEO_ACCESS_DENIED');
      }
      const upstream = await request(`https://dev.vdocipher.com/api/videos/${encodeURIComponent(grant.video_id)}/otp`, {
        method: 'POST',
        headers: { Authorization: `Apisecret ${env.VDOCIPHER_API_KEY}`, 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ ttl: 300 }),
      });
      if (!upstream.ok) return fail(502, 'VIDEO_SERVICE_UNAVAILABLE');
      const playback = await upstream.json();
      if (typeof playback.otp !== 'string' || !playback.otp || playback.otp.length > 20000 ||
          typeof playback.playbackInfo !== 'string' || !playback.playbackInfo || playback.playbackInfo.length > 20000) {
        return fail(502, 'VIDEO_SERVICE_UNAVAILABLE');
      }
      return res.status(200).json({ otp: playback.otp, playbackInfo: playback.playbackInfo });
    } catch {
      // Do not log credentials, tokens, upstream bodies or personal information.
      return fail(503, 'PLAYBACK_UNAVAILABLE');
    }
  };
}
