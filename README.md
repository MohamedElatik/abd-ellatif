# BioMaster: protected VdoCipher playback

Vite/React frontend with a Vercel Node function at `POST /api/vdocipher/otp`.
The first lesson (`lec_1`) uses VdoCipher. The remaining videos are the original
public sample MP4s; they are not protected paid content.

## Authentication and authorization

- Supabase project: `eayhsfgkodvxtkqlmqtx` (`abd-ellatif`).
- Students register with email/password, confirm email, then sign in.
- The application stores a short-lived access token in sessionStorage. No password
  or refresh token is stored. Expired sessions require signing in again.
- Existing browser-only/demo accounts do not grant video access. Registration
  does not create an enrollment. Legacy quizzes/attendance are still local demo
  features; this change does not migrate those to a database.
- The server verifies the bearer token with Supabase Auth, then calls the database
  authorization transaction under that same token. The transaction requires a
  live auth session, confirmed user, enabled student, published video, active
  enrollment and a future expiry. It limits issuance to 20 requests/minute/user.
- The caller provides only a lesson ID. User IDs, roles, course IDs and VdoCipher
  video IDs supplied by a client are rejected. No teacher/demo bypass exists.
- Database writes are owner-only. The exposed RPC is SECURITY INVOKER and calls a
  private helper with an explicit auth.uid() check. No service-role key is used.
- OTP TTL is 300 seconds. Responses are never cached and errors contain no secrets.

## Configuration and rollout

1. `VDOCIPHER_API_KEY` is a **server-only Vercel Production environment variable**.
   Never prefix it with `VITE_`, commit it, or paste it into chat. Preview testing
   requires a separately configured Preview key; do not assume Production values
   are present in a Preview deployment.
2. Public Supabase coordinates are in `shared/supabase.mjs`. The publishable key
   is intentionally public and has no access to modify authorization data.
3. Supabase Auth URL Configuration: set Site URL to `https://abd-ellatif.vercel.app`.
   Configure your email delivery/SMTP for real students and keep email confirmation
   enabled. The Supabase default mailer has recipient/rate restrictions.
4. The two migrations in `supabase/migrations` have been applied to the linked
   project. Do not reapply them blindly. The configured `lec_1` VdoCipher ID is
   `5d646fdc9ecee571fcd2552ec9e233d3`, taken from the owner's open embed dashboard.
5. After a student confirms their account, add their Auth user UUID to
   `video_students`; add an enrollment in `video_enrollments` with that UUID,
   `course_sec3_full`, `active=true`, and an explicit expiry date. Manage these
   records through the Supabase project dashboard. Never import browser-local
   enrollment/role flags as trusted permissions.
6. To add a protected lesson, set `playbackProvider: 'vdocipher'` and an empty
   `videoUrl` in its frontend lesson record, and create its exact mapping in
   `video_lessons`. Avoid public MP4 fallback URLs for protected videos.

## Verification

`bun install --frozen-lockfile`, then `bun run test`, `bun run lint`, `bun run build`.
The API tests use mocked external services, not a live VdoCipher key. Database
authorization checks are in `tests/access.sql`; run as database owner. They create
isolated fixtures inside a transaction and roll them back.

Use `vercel dev` to test the API locally; plain `vite` serves only the frontend.
Never publish before build checks pass. Live DRM playback must still be tested
with a confirmed, enrolled account on the production domain. Check: logged-out
request = 401; unenrolled account = 403; enrolled account = video plays; revoking
the enrollment denies a new OTP. Existing already-authorized playback is not
retroactively revoked by changing enrollment.
