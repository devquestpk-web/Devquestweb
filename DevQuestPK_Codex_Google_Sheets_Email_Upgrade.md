# DevQuest PK Student Portal: Google Sheets + Automated Email Upgrade

## Intended architecture and scope

This is an **extension to the existing** DevQuest PK Next.js + Supabase Auth/Postgres/Storage system. Do not rebuild the Student Portal, Admin Portal, profile system, event/course/webinar enrollment, QR tickets, or certificate verification. Read and audit the real code before applying this plan.

New requirements:
1. Every student signup and permitted profile edit is synchronized to an administrator-controlled Google Sheet.
2. Each event and session is reflected in Google Sheets, along with the accurate total and identities of enrolled students, attendance, and cancellation status.
3. DevQuest PK sends branded transactional/operational email notifications (welcome or enrollment confirmation, sessions, changes, reminders, certificates, support replies) automatically.
4. Admins can configure, preview, send, schedule, and monitor relevant notifications to appropriate students.
5. Supabase remains the canonical system of record. Google Sheets is an eventually consistent reporting mirror, **not** the authority for authentication, permissions, enrollments, or certificate eligibility.

## 1. Repository audit and design

Inspect actual schema and code: profiles + student signup trigger, courses/webinars, enrollments, tickets, student & admin APIs, student-portal.tsx, admin-portal.tsx, certificates, existing email infrastructure, any Google API integration, and migrations. Identify all student-create and profile-update paths so no updates are missed. Document discovered implementation, migrations needed, integration points, and backward-compatibility concerns. Do not change production before explicit approval.

## 2. Google Sheets integration

### Google Cloud configuration
- Use the official Google Sheets API v4. Create an API-enabled Google Cloud project and service account controlled by DevQuest PK.
- Create the spreadsheet in DevQuest PK's chosen Drive account, then share the exact spreadsheet with the service account as Editor. Grant access only to authorized admins; do not publish it on the web.
- Store `GOOGLE_SHEETS_SPREADSHEET_ID`, `GOOGLE_SERVICE_ACCOUNT_EMAIL`, and secure private-key credentials **only in server-side secret storage**. Never put service account credentials in `NEXT_PUBLIC_*`, client JS, or source control.
- Prefer short-lived credentials / secure key management where supported; never paste credentials into Codex prompts, logs, or chat. Use only the scopes needed.

### Spreadsheet tab structure

**Students**: `supabase_user_id` (stable row key), `student_id` (human-readable), `full_name`, `email`, `phone` (only if approved), `university`, `degree`, `semester`, `profile_completed`, `account_status`, `created_at`, `updated_at`, `last_synced_at`.

**Events**: `event_id`, `title`, `type`, `status`, `start_date`, `end_date`, `published`, `event_enrollment_count`.

**Sessions**: `session_id`, `event_id`, `session_title`, `trainer`, `start_at`, `end_at`, `session_status`, `enrolled_count`, `attended_count`, `updated_at`.

**Session_Enrollments**: `session_id`, `event_id`, `student_id`, `supabase_user_id`, `student_name`, `student_email`, `enrollment_status`, `registered_at`, `cancelled_at`, `last_synced_at`. One row per session/student pair.

**Attendance**: `session_id`, `student_id`, `attendance_status`, `checked_in_at`, `marked_by`, `updated_at`.

**Certificates** (optional, admin-approved export): `certificate_code`, `student_id`, `event_id`, `session_id`, `issue_date`, `verification_status` (no sensitive private file links).

Do not export passwords, session tokens, service-role keys, verification secrets, private notes, private file URLs, or unnecessary sensitive personal details. Treat the sheet as confidential student data, disclose its use in the privacy notice, and limit access. Escape untrusted strings to prevent spreadsheet formula injection.

### Data semantics
- When Supabase Auth creates a student and its profile is provisioned, create exactly one Students row; include the **permanent** student ID, not a replaceable email address, as a public reference.
- When the profile is edited, **upsert/update the same row** by immutable `supabase_user_id`. Do not append duplicates.
- Synchronize event/session creation, edits, publication, cancellations, changes to enrollment, attendance, and certificate issue/revoke when enabled.
- The Sessions tab must accurately show total session registrations; Session_Enrollments must identify exactly which students are enrolled. Event enrollment and session enrollment are distinct if optional sessions exist; define clear rules. For mandatory sessions, auto-associate eligible event enrollees; for optional sessions, require an explicit session enrollment.
- Cancellation / deletion must update or safely deactivate corresponding rows, never leave old data appearing actively enrolled.
- Admin can request manual resync/backfill; implement nightly reconciliation against Supabase and a 'last synced / error' dashboard.

### Reliability design
- Record an **integration_outbox** change event or use a durable Supabase Queue (pgmq) within the same transaction as the Supabase data change where possible. A trusted server/Edge Function worker reads pending changes and calls Google Sheets API.
- Use a stable entity ID plus change version to achieve idempotent upserts; avoid duplicate rows under retries or out-of-order events. If mapping Sheets row positions, maintain a reliable `sheet_row_mapping` table keyed by entity type + entity ID.
- Batch updates when practical and respect Google Sheets quotas; retry 429/5xx with exponential backoff. Keep retry and dead-letter/error reporting; student signup/edit must succeed in Supabase even when Sheets is unavailable.
- Use an admin-only integration health view with last sync, failed jobs, retry controls, and batch-resync progress.
- Never treat direct edits in Google Sheets as updates to Supabase unless a later explicitly specified secure two-way workflow is approved.

## 3. Automatic mailing system

### Provider and sender
- Integrate a transactional email provider such as **Resend** (or reuse a verified existing provider if already configured) using a **server-side** API key. Do not build automated bulk email using a student Gmail account.
- Configure `notifications@devquestpk.com` or another owned sender only **after** verifying ownership and DNS (SPF/DKIM, with DMARC recommended). Do not assume the address is ready to send.
- Add `EMAIL_PROVIDER_API_KEY`, `EMAIL_FROM`, `EMAIL_REPLY_TO`, and `APP_BASE_URL` in secure environment settings, never browser-exposed values.

### Notification rules (configurable)
| Trigger | Recipient | Default behavior |
| --- | --- | --- |
| Student email verified / first signup | student | one-time welcome (optional) |
| Event enrollment succeeds | relevant student | immediate enrollment confirmation |
| Enrollment deadline approaching | opted-in interested students only | optional deadline reminder |
| New session published | currently eligible event/session students | once per new session |
| Session reminder | enrolled student | 24 hours and 1 hour before (configurable) |
| Session starts / join details available | enrolled student | optional immediate alert with authenticated portal link |
| Session time/link changed | enrolled students | promptly notify of change |
| Session cancelled | enrolled students | promptly notify of cancellation |
| Certificate issued | certificate owner | email with portal download link |
| Support ticket reply or resolution | ticket owner | status/reply notification |

- **Avoid spam:** send enrollment deadline promotions only to people who opted in; honor marketing opt-outs. Essential service notices still follow applicable requirements. Respect email verification, do-not-contact rules, bounces, and complaint suppression.
- Default timestamps for students in Pakistan should display in `Asia/Karachi`, but store canonical database timestamps in UTC and allow per-student timezone if relevant later.
- Do not expose private Google Meet links to unenrolled students; link to an authenticated session page if possible.

### Admin mailing dashboard
Add `Admin > Communications` or equivalent, integrated with the existing admin UI:
- Branded templates with editable title/body and permitted variables (`{{student_name}}`, `{{student_id}}`, `{{event_title}}`, `{{session_title}}`, `{{session_date}}`, `{{join_url}}`, `{{portal_url}}`).
- Target filters: all verified students (consent-aware), an event's enrollees, one session's enrollees, a status cohort, or an individually selected student.
- Trigger toggles, 24h/1h reminder settings, send-now or schedule, preview and test-send, permissions and confirmation for bulk sends.
- Delivery history: queued, sent/accepted, delivered, bounced, failed, canceled; retry and suppression.
- Template versioning or simple audit log; rate limiting and recipient cap for safety.

### Scheduling and data model
- Suggested tables: `email_templates`, `notification_rules`, `student_notification_preferences`, `notification_outbox` or `email_queue`, `email_delivery_logs`, `integration_outbox`, `integration_sync_status` and `sheet_row_mapping`.
- Use Supabase Cron (pg_cron) or existing trusted scheduler to enqueue due reminders; use server-side worker/Edge Function for dispatch. Do not rely on a browser page staying open.
- Queue a record on transaction commit; deduplicate by a stable key like `(notification_type, student_user_id, session_id, reminder_offset, version)` so retries/reschedules don't send duplicate notices. Recompute timing on reschedule and cancel obsolete reminders.
- Process provider delivery/bounce/complaint webhooks with signature verification; no duplicate or unauthorized webhook actions.
- Keep emails free of passwords and unnecessary personal data. Escape HTML; ensure links use trusted `APP_BASE_URL`.

## 4. Security and earlier portal fixes

- Keep existing student/admin role model and Supabase RLS. Protect all admin sync/email endpoints with verified admin role and `is_active` checks; prevent public invocation of queue workers.
- Fix existing certificate issuance eligibility: verify lesson completion or session attendance on server; certificate generation may not be freely called for arbitrary published items.
- Fix pseudo-payments: do not call priced enrollment 'paid' without a verified real provider; make related order/ticket/enrollment writes atomic.
- Preserve the existing QR tickets and certificate verification API. Support manual admin-uploaded PDFs and template-generated PDFs as separate issuance modes.
- Preserve profile image editing; store only safe avatar reference in Google Sheets if absolutely needed, not private signed URLs.
- Respect applicable privacy, retention, data correction/deletion, consent, and unsubscribe requirements.

## 5. Implementation order for Codex

0. **Audit:** inspect repo, identify actual tables/apis and preexisting email or Sheets integrations; report findings.
1. **Security + migrations:** unique student ID, session data, reliable outbox, RLS, certificate and checkout fixes.
2. **Sheets:** credential configuration placeholders, private worker, tab schemas, idempotent upserts, per-session counts and enrollment roster, backfill and monitoring.
3. **Email:** verified-domain provider integration, queue, rules, scheduling, templates, per-student email preferences, provider webhooks.
4. **Admin UI:** session roster and Sheets status, message composer, templates, scheduled rules and logs.
5. **Student UI:** dashboard session announcements, email preference settings, enrollment and certificate links, profile details and support integration.
6. **Tests:** unit/integration/e2e for all flows; staging verification; production rollout only on approval.

## 6. Acceptance criteria (must test)

- A new student with verified profile appears **once** in Students, and has a stable human-readable student ID.
- Editing name/university/phone updates exactly that student's existing Sheet row; does not create a duplicate.
- A newly published session appears in Sessions; its accurate enrolled count changes when students enroll, cancel, or are auto-enrolled by the approved policy.
- Session_Enrollments shows **who** is enrolled; attendance updates separately.
- A student without enrollment cannot see private session links or other students' personal data.
- Service outage or Sheets API 429 does **not** break Supabase signup; failed sync is logged and retried, with eventual reconciliation.
- Enrollment triggers exactly one confirmation email, and reminders are not duplicated under retries or schedule edits.
- A new session announcement only reaches eligible recipients; an admin may send a test message without bulk mailing.
- Bounces and unsubscribes are respected; promotional mail requires consent.
- Manual and automatic certificates remain verifiable, with enforced server-side eligibility.
- No service-account/private API key appears in client bundle, public logs, or repository.
- Existing Team, Admin, Application and Student portal flows still work in regression tests.

## 7. Codex master prompt

> You are modifying my existing DevQuest PK Next.js + Supabase codebase. Read this entire document first and inspect the real repository. Implement Google Sheets synchronization for student signups/profile edits, events, sessions, session-specific enrollments/rosters, attendance, and optional certificate data. Supabase must remain the source of truth. Build secure, idempotent, retry-safe server-side integration using Google Sheets API; create/upsert rows by immutable IDs and give admins sync status and resync controls. Implement a branded, admin-managed transactional emailing system with a verified DevQuest PK sender, appropriate audience targeting, templates, delivery logging, enrollment confirmations, new-session notifications, schedule changes, reminders at configurable offsets, and certificate/support notifications. Use queues and scheduled jobs; honor consent and bounce suppression; never expose secrets. Preserve existing auth, certificates, tickets, webinars, all portals, and UI. Fix certificate-eligibility and simulated checkout concerns. Write safe migrations with RLS, tests, and setup documentation. Do not deploy or change production data without my approval. Start with a repository audit and phased implementation plan.

## Official references
- Google Workspace service accounts: https://developers.google.com/workspace/guides/create-credentials
- Sheets API: https://developers.google.com/workspace/sheets/api/guides/values
- Sheets API quotas: https://developers.google.com/workspace/sheets/api/limits
- Supabase database webhooks: https://supabase.com/docs/guides/database/webhooks
- Supabase queues: https://supabase.com/docs/guides/queues
- Supabase Cron: https://supabase.com/docs/guides/cron
- Supabase Edge Functions: https://supabase.com/docs/guides/functions
- Resend Email API: https://resend.com/features/email-api
