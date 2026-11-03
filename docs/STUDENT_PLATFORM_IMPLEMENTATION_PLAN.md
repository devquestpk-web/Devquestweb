# DevQuest PK student platform implementation plan

Supabase Auth/PostgreSQL/Storage remain authoritative. Existing Student, Team, Admin, Application, and Services portal behavior is preserved. Google Sheets, Google Calendar/Meet, and email are optional projections/integrations and must never block the canonical Supabase transaction.

## Phase 0 — Security foundation

- Require active, exact roles on browser and server authorization paths.
- Remove fallback cryptographic secrets and require strong server-only configuration.
- Make free enrollment/order/ticket writes atomic; keep paid orders pending until a verified payment or audited admin action.
- Enforce certificate eligibility in the issuance service and prevent duplicate issuance.
- Restrict certificate records to owners/admins while preserving the public verification API.
- Claim background jobs atomically with `FOR UPDATE SKIP LOCKED`; use stable dedupe keys, retries, dead-letter state, and audit logs.
- Review all RLS/storage policies and keep service-role access server-only.

## Phase 1 — Student identity, profile synchronization, and durable reporting

- Extend `profiles` with immutable human-readable student IDs, education details, completion state, and notification preferences.
- Create transactional integration/notification outboxes and Sheet row mappings.
- Synchronize student registration/profile edits through immutable Supabase IDs and upserts.
- Use the official Sheets API with a spreadsheet owned by `devquestpk@gmail.com` and shared only with the service account.
- Escape spreadsheet formulas; never export passwords, tokens, secrets, signed URLs, or private notes.
- Add welcome notifications after verified email resolution and integration health/retry visibility.

## Phase 2 — Event/course sessions, enrollment, and attendance

- Generalize sessions so each belongs to exactly one existing webinar/event or course.
- Admin-only create/edit/publish/reschedule/cancel/delete controls.
- Store topic, trainer, time zone, resources, private meeting link, release window, capacity, and enrollment mode.
- Store exact session rosters separately from event enrollment; mandatory sessions may auto-associate eligible event/course enrollees, optional sessions require explicit enrollment.
- Add session attendance and manual correction with actor/reason audit.
- Soft-delete sessions with enrollments, attendance, notifications, or certificates; prevent destructive deletion of historical evidence.
- Sync events, sessions, exact rosters, cancellations, counts, attendance, and certificate status to Sheets.

## Phase 3 — Google Calendar and Meet automation

- Capability discovery must verify Workspace edition, administrator authorization, delegated scopes, Calendar conference creation, and Meet REST/reporting availability before enabling automation.
- Create Calendar events and Meet links server-side when permission is available; store external IDs and sync status, never OAuth credentials.
- Import available conference/session/participant activity using stable Google participant/account identifiers where provided.
- Match only verified email/account identifiers to enrolled Supabase users. Display names alone are never sufficient.
- Put unmatched participants into an admin reconciliation queue with source evidence and an audited manual match/ignore action.
- Recompute attendance and enqueue Sheets updates after confirmed matches.
- Always retain manual Meet-link entry, roster upload, and manual attendance fallback when Google reports are unavailable or insufficient.

## Phase 4 — Automated email and Communications Center

- Versioned branded templates, safe variables, recipient previews, test sends, send-now/scheduling, caps, confirmations, delivery logs, and retry/cancel controls.
- Welcome, enrollment confirmations, deadline reminders for opted-in recipients, new-session announcements, session reminders, reschedules/cancellations, certificate issuance, and support updates.
- UTC storage with `Asia/Karachi` presentation; obsolete reminders are cancelled and rebuilt after schedule changes.
- Verified Resend webhooks update delivered/bounced/complained status and suppression lists.
- Operational notices honor account state and verification; promotional mail additionally requires marketing opt-in.

## Phase 5 — Certificates

- Extend the existing certificate system; do not replace codes, QR verification, or existing certificate records.
- Admin-managed reusable/versioned templates with protected assets.
- Event-wise and session-wise eligibility rules evaluated server-side from enrollment/completion/verified attendance.
- Automatic issuance through the same eligibility service used by audited manual issuance.
- Support admin-uploaded PDFs as a distinct issuance mode with checksum, issuer, reason, and storage metadata.
- Unique constraints prevent duplicate active certificates; revocation remains visible through verification history.

## Phase 6 — Support, reconciliation, and full verification

- Complete student/admin support workflows and notifications.
- Add Sheets backfill/reconciliation, Meet participant reconciliation, job health, audit-log, and certificate exception views.
- Unit tests for templates, eligibility, matching, dedupe, and retry timing.
- API/integration tests, SQL/RLS tests, mocked Google/Resend tests, and browser regression tests across every existing portal.
- Accessibility/responsive verification, TypeScript, scoped lint, and production build gates.

No phase authorizes production migration, credentials, external account changes, scheduler activation, or deployment without explicit approval.
