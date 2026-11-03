# Student communications and Google Sheets setup

The application code and migration are prepared locally. Do not apply the migration or configure production secrets until the changes have been reviewed and approved.

## Google Sheet ownership

1. Sign in to Google Drive as `devquestpk@gmail.com`.
2. Create the private reporting spreadsheet in that account. Do not publish it.
3. Create a least-privilege Google Cloud service account with Google Sheets API access.
4. Share only the reporting spreadsheet with the service-account email as **Editor**. `devquestpk@gmail.com` remains the owner.
5. Record the spreadsheet ID from its URL. Never place the Gmail password or Google credentials in source code.

The worker creates or populates these tabs: `Students`, `Events`, `Sessions`, `Session_Enrollments`, `Attendance`, and `Certificates`.

## Server-only environment variables

Configure these only in protected server environment storage:

```dotenv
GOOGLE_SHEETS_SPREADSHEET_ID=
GOOGLE_SERVICE_ACCOUNT_EMAIL=
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_CALENDAR_ID=
# For devquestpk@gmail.com, use server-side OAuth user authorization:
GOOGLE_WORKSPACE_CLIENT_ID=
GOOGLE_WORKSPACE_CLIENT_SECRET=
GOOGLE_WORKSPACE_REFRESH_TOKEN=
# Alternative only for a managed Google Workspace domain with admin-approved delegation:
GOOGLE_WORKSPACE_IMPERSONATED_USER=
EMAIL_FROM="DevQuest PK <notifications@devquestpk.com>"
EMAIL_REPLY_TO="support@devquestpk.com"
APP_BASE_URL="https://www.devquestpk.com"
BACKGROUND_WORKER_SECRET=
TICKET_HMAC_SECRET=
RESEND_API_KEY=
RESEND_WEBHOOK_SECRET=
```

None of these values may use a `NEXT_PUBLIC_` prefix. Verify the sender domain and its SPF/DKIM records in Resend before enabling delivery.

`devquestpk@gmail.com` is a consumer Gmail account, so it cannot grant Workspace domain-wide delegation. Calendar/Meet automation for that identity requires its own server-side OAuth authorization and refresh token. Meet reporting is enabled only when the account/API actually returns conference records. Manual links, roster reconciliation, and attendance remain available when reporting is unavailable.

## Database

Review [`supabase/communications-upgrade.sql`](../supabase/communications-upgrade.sql), [`certificates-upgrade.sql`](../supabase/certificates-upgrade.sql), [`sheets-sync-hardening.sql`](../supabase/sheets-sync-hardening.sql), [`student-profile-sheets-sync.sql`](../supabase/student-profile-sheets-sync.sql), and [`student-login-email.sql`](../supabase/student-login-email.sql), take a database backup, test them in an isolated Supabase project, and only then request approval to apply them to production. The hardening migration ensures course enrollments also enqueue a Sheets update; the student-profile migration guarantees student registration/profile changes enter that same outbox and performs an initial student backfill; the login-email migration installs the branded portal-login button.

Supabase remains authoritative. Google Sheets is an eventually consistent reporting mirror. Direct Sheet edits never update Supabase.

## Background processing

Call `POST /api/internal/process-background` from a trusted scheduler with:

```http
Authorization: Bearer <BACKGROUND_WORKER_SECRET>
```

A one-minute schedule is appropriate for due email and Sheet jobs. The endpoint processes bounded batches, records failures, and retries with exponential backoff. It must not be called from browser code or exposed without the worker secret.

## Safe rollout

1. Apply the migration in staging.
2. Configure staging Google/Resend credentials.
3. Create the Sheet tabs or allow the worker to add their headers.
4. Test one student profile update and verify exactly one row is upserted.
5. Test a free enrollment, one session announcement, reminders, attendance, a certificate, and a support reply.
6. Verify retry behavior by temporarily using an invalid spreadsheet ID.
7. Confirm no secret appears in browser bundles or logs.
8. Obtain explicit approval before production migration, scheduler configuration, or deployment.
