// Server-only. Never import this module from src/.
import { supabaseUrl, supabasePublishableKey } from '../shared/supabase.mjs';
const ID = /^[a-zA-Z0-9_-]{1,100}$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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
    // No cookie authentication or permissive CORS. A real bearer token is required.
    if (req.headers['sec-fetch-site'] === 'cross-site') return fail(403, 'FORBIDDEN');
    const auth = req.headers.authorization;
    if (typeof auth !== 'string' || !/^Bearer [A-Za-z0-9._-]{20,8192}$/.test(auth)) {
      return fail(401, 'AUTH_REQUIRED');
    }
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
    const headers = { apikey: key, Authorization: auth, 'Content-Type': 'application/json' };
    const request = (target, options) => fetchImpl(target, {
      ...options, redirect: 'error', signal: AbortSignal.timeout(8000),
    });
    try {
      // Validate against the Auth server, never trust a decoded JWT or localStorage user.
      const identity = await request(`${url.origin}/auth/v1/user`, { headers });
      if (identity.status === 401 || identity.status === 403) return fail(401, 'AUTH_REQUIRED');
      if (!identity.ok) return fail(503, 'AUTH_UNAVAILABLE');
      const user = await identity.json();
      if (!UUID.test(user?.id || '') || !user.email_confirmed_at || user.is_anonymous === true) {
        return fail(401, 'AUTH_REQUIRED');
      }
      // This transaction checks auth.uid(), disabled status, enrollment, expiry,
      // published lesson and the shared rate limit. Client user/course/video IDs
      // are deliberately not accepted. Only the database selects the VdoCipher ID.
      const access = await request(`${url.origin}/rest/v1/rpc/authorize_video_playback`, {
        method: 'POST', headers, body: JSON.stringify({ requested_lecture: body.lectureId }),
      });
      if (access.status === 401) return fail(401, 'AUTH_REQUIRED');
      if (!access.ok) return fail(503, 'ACCESS_CHECK_UNAVAILABLE');
      const grant = await access.json();
      if (grant?.status === 'rate_limited') {
        res.setHeader('Retry-After', '60');
        return fail(429, 'TOO_MANY_REQUESTS');
      }
      if (grant?.status !== 'allowed' || grant.user_id !== user.id || !ID.test(grant.video_id || '')) {
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
