# DevQuest PK Website - Cybersecurity Handoff Notes

Updated: 22 August 2026

## 1. System Overview

- Production website: `https://www.devquestpk.com`
- Hosting: Vercel, project `devquestpk/devquest-pk-official`.
- Application framework: Next.js 16 with React 19 and TypeScript.
- Authentication and database: Supabase Auth and Supabase Postgres.
- Transactional email: Resend, sending from `no-reply@devquestpk.com`.
- Form backup: optional Google Apps Script `/exec` webhook that writes to Google Sheets and Google Drive.
- Homepage video: privacy-enhanced YouTube embed; the downloaded MP4 is excluded from Vercel deployments.

The Vercel deployment is the source of truth for the live site. Local `.env` files are ignored by Git and must never be committed.

## 2. Main Data Flows

### Public website forms

`POST /api/forms` handles contact, career, and campus ambassador submissions.

1. The browser submits form data. Career and ambassador forms use multipart upload for a CV.
2. The route validates form type, career position, name, email, CV extension/type, request size, and the honeypot field.
3. Career and ambassador submissions create an application record in Supabase and a status-history row.
4. The route optionally sends the submission to Google Apps Script. The script stores fields in Sheets and CV files in a configured Drive folder.
5. Resend sends the team notification:
   - Contact: `hello@devquestpk.com`
   - Career/ambassador: `careers@devquestpk.com`
6. For tracked applications, Resend also sends a confirmation to the applicant's submitted email.

The API returns a tracking ID even when email delivery fails, and the UI warns the applicant to keep the ID.

### Application tracking

`GET /api/applications/status` accepts either:

- `token`: a private 256-bit random token from the confirmation link. Only its SHA-256 hash is stored.
- `id`: a tracking ID such as `DQ-CAR-2026-A1B2C3D4`.

The response intentionally exposes only the applicant name, position, status, public note, and status history. It does not expose email, phone, CV, or private application details.

The tracker page polls every 15 seconds while visible. Tracker responses use `Cache-Control: no-store, private` and `Referrer-Policy: no-referrer`. The page is marked `noindex, nofollow`.

### Admin application updates

`GET/PATCH /api/admin/applications` requires a Supabase access token in the `Authorization: Bearer ...` header and a profile with `role = 'admin'`.

An administrator can change an application status and applicant-visible note. Each update is written to status history. A status change sends an email to the applicant through Resend.

### Team and member portals

The browser uses the Supabase anon key and persistent Supabase sessions. Internal tables are accessed through Supabase client calls protected by Postgres RLS policies. The service-role key is used only by server routes and is never sent to the browser.

## 3. Authentication and Authorization

- Supabase email/password authentication is used for portal accounts.
- `requireAdmin()` verifies the bearer token with Supabase Auth, then checks the user's `profiles.role` in the database.
- Only `role = 'admin'` can access admin API routes.
- Team members can access only their own profile, attendance, and reports, plus tasks assigned to them.
- Admins can view and manage member profiles, applications, tasks, attendance, and reports according to the RLS policies.
- Database triggers prevent non-admin users from changing role/active state and prevent team members from changing task assignment fields.
- Team profile image uploads are limited by both client validation and Supabase Storage policies to the authenticated user's own UUID folder.

Recommended account controls to confirm in Supabase:

- Enable MFA for administrators.
- Enforce strong passwords and breached-password protection where available.
- Keep only required administrator accounts active.
- Review Auth logs and revoke sessions after suspected compromise.

## 4. Environment Variables

Public/browser-safe values:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SITE_URL=https://www.devquestpk.com`

Server-only values:

- `SUPABASE_SERVICE_ROLE_KEY`: full database/admin privilege; never expose it client-side.
- `RESEND_API_KEY`: sends application and status emails.
- `GOOGLE_SHEETS_WEBHOOK_SECRET`: authenticates the Apps Script webhook.
- `GOOGLE_SHEETS_WEBHOOK_URL`: server-side webhook destination.

Operational routing values:

- `FORM_RECIPIENT_EMAIL=hello@devquestpk.com`
- `FORM_APPLICATION_RECIPIENT_EMAIL=careers@devquestpk.com`
- `FORM_FROM_EMAIL=DevQuest PK <no-reply@devquestpk.com>`

If a secret is exposed, rotate it immediately in the provider and Vercel. Do not paste secret values into tickets, screenshots, chat, Git, or browser code.

## 5. Storage and Sensitive Data

Supabase `applications` stores applicant identity/contact information, application details, status, public notes, tracking-code hash, and CV filename. CV binary files are optionally copied to the configured Google Drive folder by Apps Script and attached to the internal Resend notification.

The `applications` and `application_status_history` tables have RLS enabled with no public table policies. Public status access is mediated by the server route using the token hash or tracking ID.

The `team-profile-images` bucket is configured as public so saved avatar URLs can render. Do not use that bucket for confidential files. Profile image URLs should be treated as public.

## 6. Current Protections

- Request-size limits: 40 KB JSON, approximately 5.25 MB multipart, and 5 MB CV limit.
- CV extension and MIME allowlist: PDF, DOC, DOCX, and the browser/octet-stream compatibility case.
- Safe filename normalization for CVs and Drive files.
- HTML escaping before inserting user values into email HTML.
- Formula-injection protection in Google Sheets (`=`, `+`, `-`, and `@` values are prefixed).
- Server-only Supabase service-role usage.
- Origin check for browser form requests plus a honeypot field.
- No-store/private cache headers for status results.
- Canonical redirect from Vercel-hosted application-status links to `www.devquestpk.com`.
- `.env*`, build output, docs, and MP4 source files are excluded from Git/Vercel deployment as appropriate.

## 7. Priority Security Gaps / Recommended Work

These are the points to discuss with the security teammate. They are not claims of an active breach.

### High priority

1. **Add rate limiting and abuse protection.** `/api/forms` and `/api/applications/status` have no application-level rate limiter. A bot could spam Resend, Google Sheets, or Supabase records, or repeatedly probe tracking IDs. Add Vercel Firewall/rate limiting or an edge-compatible limiter, with stricter limits for multipart submissions and status lookups.
2. **Add security response headers.** `next.config.ts` currently has no explicit HSTS, `X-Content-Type-Options`, `Permissions-Policy`, or restrictive `Content-Security-Policy`. Add headers carefully, allowing the required Supabase, Resend-independent browser paths, YouTube iframe, images, and WhatsApp links.
3. **Review CV handling.** CVs are untrusted uploads and are forwarded by email and optionally stored in Google Drive. Add malware scanning/content validation before internal distribution, and verify Drive folder sharing does not make CVs public.
4. **Protect admin accounts with MFA.** Authorization checks are strong, but the code does not itself enforce MFA.

### Medium priority

5. **Decide whether tracking-ID lookup should remain public.** Anyone who obtains a valid ID can view the applicant's first name, position, status, and public history. Keep IDs private, consider token-only access, or require an additional email/OTP verification.
6. **Add structured audit logging.** Record admin actor, target application/member, old value, new value, timestamp, and email-delivery result in a security/audit stream that is separate from user-visible status history.
7. **Add automated security tests.** Cover unauthorized admin requests, non-admin requests, invalid origins, oversized uploads, malformed multipart input, tracking-token failures, RLS isolation, and role-escalation attempts.
8. **Verify provider retention and sharing.** Review Resend, Supabase, Google Sheets, and Drive retention, access lists, region settings, and deletion procedures for applicant data.

## 8. Incident Response Checklist

If a secret or account is suspected compromised:

1. Rotate the affected Vercel/provider secret immediately.
2. Revoke Supabase sessions for affected accounts and disable the account if necessary.
3. Check Vercel function logs, Supabase Auth/database logs, Resend logs, Apps Script executions, Drive activity, and Google Sheet revision history.
4. Identify affected applications and preserve relevant timestamps/IDs without copying CV contents into chat or tickets.
5. Remove exposed tokens, links, or files from public channels and notify affected applicants if personal data was accessed.
6. Redeploy after rotation and run a fresh form, tracker, admin-auth, and email-delivery test.

## 9. Useful Production Checks

- Website: `https://www.devquestpk.com`
- Admin portal: `https://www.devquestpk.com/portal/admin`
- Status portal: `https://www.devquestpk.com/application-status`
- Vercel logs: inspect `/api/forms`, `/api/applications/status`, and `/api/admin/applications` after a controlled test.
- Resend: confirm `devquestpk.com` remains verified and review delivery/bounce events.
- Supabase: confirm RLS is enabled on every internal table and the service-role key is absent from client bundles.
- Google Apps Script: confirm the webhook secret is stored in Script Properties, not source code, and the Drive folder is restricted.

## 10. Short Answers for the Security Review

**Where is applicant data stored?** Supabase Postgres; optionally Google Sheets and Google Drive when the webhook is configured. Email copies also exist in Resend recipient mailboxes.

**Can the public read the database directly?** No. RLS is enabled and there are no public table policies for applications/history. Public status is served by a server route.

**Can an applicant see other applicants?** Not through the intended API response. They can see an application only with its private token or valid tracking ID.

**Where are the most important secrets?** Vercel environment variables, Supabase provider settings, Resend API keys, and Google Apps Script Script Properties.

**What is the biggest current concern?** Abuse controls and untrusted CV handling need additional hardening; the current baseline protects authorization and keeps service-role credentials server-side.
