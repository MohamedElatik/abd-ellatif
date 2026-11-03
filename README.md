# BioMaster: teacher-managed public videos

Vite/React on Vercel with Supabase-backed courses, exams, student results and profiles.

## Current access model

- All published courses and videos are free to watch, including for visitors without an account.
- Verified teachers and secretaries can create/edit courses, publish/edit lessons and upload course images. Student deletion and role administration remain teacher-only. Course prices are normalized to zero in the database.
- The teacher profile page is removed. The teacher admin dashboard remains available to staff.
- The previous demonstration course and six lessons are unpublished, with their records retained for recovery. The old seed script no longer inserts examples.
- Student exams, grades, attendance and profile photos still require authentication and retain their existing row-level access controls.

## Playback

`POST /api/vdocipher/otp` accepts only a lecture ID. The database checks that the course, lecture and VdoCipher mapping are all published, and selects the provider video ID itself. Visitors cannot submit arbitrary provider IDs.

The public authorization RPC intentionally permits anonymous access to published video mappings. Its private implementation uses an empty search path. Mapping tables and rate-limit records are not directly readable or writable by visitors. Shared atomic limits allow 120 requests/minute per lesson and 300/minute total across server instances. Requests exceeding a cap return 429. Provider tokens last 300 seconds and responses are not cached.

`VDOCIPHER_API_KEY` remains server-only in Vercel. Never commit it, prefix it with `VITE_`, or include it in chat. No service-role key is required. Public Supabase configuration is in `shared/supabase.mjs`.

Teachers add a course in the admin dashboard, upload videos to their VdoCipher account, then paste each Video ID into the video form. No subscription activation is needed.

## Verification

Run `bun install --frozen-lockfile`, `bun run test`, `bun run lint`, and `bun run build`.

`tests/playback.test.mjs` covers anonymous published playback, validation, rate limiting and failure handling using mocked provider responses. `tests/public-playback.sql` checks anonymous access, archived content denial, shared limits and restricted writes with rolled-back fixtures. Earlier SQL tests document the former enrolled-only path, which is not used by the public endpoint.

Use `vercel dev` for local API testing; Vite alone only serves the frontend. Live DRM media playback requires a real published teacher video and a configured production VdoCipher key.

## Teacher controls, course images and attendance codes

Migration `supabase/migrations/20261103000000_admin_controls_and_attendance_codes.sql`
must be applied to the linked project **once** (Supabase dashboard → SQL Editor → paste the file → Run,
or `supabase db push`). Until it is applied, the new buttons below show a database error.

- **Attendance codes.** Every account gets a random 6-digit code when it signs up; existing
  accounts get one when the migration runs. Students see it on their dashboard ("كود الحضور")
  and write it on their notebooks. Codes are readable only by their owner, the teacher and secretaries.
- **Secretary role.** In the teacher panel → "حسابات السكرتارية", enter the email of an account
  that has already registered and confirmed its email. It becomes a secretary (`app_metadata.role =
  'secretary'`, set only server-side). A secretary sees only "تسجيل الغياب": type the code and the
  student is recorded for the chosen session. They cannot see grades, students' details, courses or
  delete anything. Removing the role takes effect on the next request. The secretary must sign out and
  in again to see the page.
- **Deleting a student** (teacher panel → students) removes the auth account and its results,
  attendance, photo, code and enrollments. Teacher and secretary accounts and your own account are refused.
- **Removing results** (teacher panel → results): one result, or all results of one student.
- **Course images** are uploaded to the public Storage bucket `course-images` (created by the
  migration). Only the teacher can upload; the image is cropped to 1280×720 JPEG in the browser.

Database checks for these features are in `tests/admin-controls.sql` (run as database owner;
fixtures are rolled back).


## Staff groups, saved login and watch dashboard

Attendance groups have independent IDs, a chosen roster, and a close action restricted to the creator or teacher. All attendance staff see updates on a five-second polling interval. Closing marks unrecorded members absent for reports; closed sessions reject edits. Excel downloads are genuine OOXML with text phone cells and no formula interpretation. Old attendance records remain stored unchanged.

Secretaries can create/edit courses and lessons and upload course images, while deletion of students/results and role management remain teacher-only. Existing course image uploads save immediately; new courses require Save.

Saved login stores rotating refresh tokens, never passwords, on the selected device. Renewal is serialized per tab and through browser locks where supported. Roles are rechecked against Auth, not trusted from storage.

Video progress is private per authenticated user, with a local fallback for guests/offline use. The VdoCipher v2 API records unique watched seconds (seeking is excluded), last position and duration, and restores position on load. Progress is a study aid, not proof for grading. URL query parameters preserve page, teacher section and selected lesson.

Validation: tests/features.test.ts, auth refresh tests and rolled-back tests/staff-features.sql.

