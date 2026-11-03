import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { normalizeEmailVariables, renderTemplate } from "../app/lib/email-service.ts";
import { generateQrPayload, verifyQrPayload } from "../app/lib/ticket-codes.ts";

test("template rendering escapes student-controlled HTML", () => {
  assert.equal(renderTemplate("Hello {{student_name}}", { student_name: "<script>alert(1)</script>" }, true), "Hello &lt;script&gt;alert(1)&lt;/script&gt;");
});

test("template rendering removes unknown variables", () => {
  assert.equal(renderTemplate("{{student_name}} {{private_key}}", { student_name: "Ayesha", private_key: "secret" }), "Ayesha ");
});

test("email portal buttons use an absolute application URL", () => {
  const previous = process.env.APP_BASE_URL;
  process.env.APP_BASE_URL = "https://www.devquestpk.com";
  assert.equal(normalizeEmailVariables({ portal_url: "/portal/student" }).portal_url, "https://www.devquestpk.com/portal/student");
  if (previous) process.env.APP_BASE_URL = previous; else delete process.env.APP_BASE_URL;
});

test("formula-like Sheet values are guarded in server implementation", async () => {
  const source = await readFile(new URL("../app/lib/google-sheets-api.ts", import.meta.url), "utf8");
  assert.match(source, /\^\[=\+\\-@\]/);
  assert.doesNotMatch(source, /NEXT_PUBLIC_GOOGLE/);
  assert.match(source, /194kjBck1wr7c1u3kB9DW6jnI5xn5ag84NkeIm3IsNfw/);
  assert.match(source, /configuredSpreadsheetId/);
});

test("background worker authenticates before flushing the DevQuest master spreadsheet", async () => {
  const route = await readFile(new URL("../app/api/internal/process-background/route.ts", import.meta.url), "utf8");
  assert.match(route, /timingSafeEqual/);
  assert.match(route, /configuredSpreadsheetId/);
  assert.match(route, /processIntegrationJobs\(100\)/);
  assert.match(route, /processNotificationJobs\(100\)/);
});

test("Sheet worker projects courses and full certificate scope", async () => {
  const source = await readFile(new URL("../app/lib/background-jobs.ts", import.meta.url), "utf8");
  assert.match(source, /job\.entity_type === "courses"/);
  assert.match(source, /course_id, session_id, issued_at, revoked_at/);
  const migration = await readFile(new URL("../supabase/sheets-sync-hardening.sql", import.meta.url), "utf8");
  assert.match(migration, /entity_kind = 'WEBINAR' then 'webinars' else 'courses'/);
});

test("student registration and edits enqueue a stable profile Sheet upsert", async () => {
  const registration = await readFile(new URL("../supabase/student-profile-sheets-sync.sql", import.meta.url), "utf8");
  const worker = await readFile(new URL("../app/lib/background-jobs.ts", import.meta.url), "utf8");
  assert.match(registration, /requested_role = 'student'/);
  assert.match(registration, /phone, city, university, degree, semester, profile_completed/);
  assert.match(registration, /create trigger on_auth_user_created/);
  assert.match(registration, /on_auth_user_email_confirmed/);
  assert.match(registration, /where role = 'student'/);
  assert.match(worker, /job\.entity_type === "profiles"/);
  assert.match(worker, /upsertSheetRow\("Students", data\.id/);
  assert.match(worker, /github_url, linkedin_url, discord_handle, skills, avatar_url/);
});

test("student welcome email includes a portal login button", async () => {
  const migration = await readFile(new URL("../supabase/student-login-email.sql", import.meta.url), "utf8");
  assert.match(migration, /Log in to Student Portal/);
  assert.match(migration, /\{\{portal_url\}\}/);
  assert.match(migration, /'student_welcome'/);
});

test("migration protects worker tables and free enrollment", async () => {
  const migration = await readFile(new URL("../supabase/communications-upgrade.sql", import.meta.url), "utf8");
  assert.match(migration, /revoke all on function public\.complete_free_enrollment/);
  assert.match(migration, /alter table public\.integration_outbox enable row level security/);
  assert.match(migration, /Paid enrollment requires verified payment/);
  assert.match(migration, /unique\(session_id, user_id\)/);
  assert.match(migration, /for update skip locked/);
  assert.match(migration, /Students view own certificates/);
});

test("ticket QR signing requires a strong configured secret", () => {
  const previous = process.env.TICKET_HMAC_SECRET;
  delete process.env.TICKET_HMAC_SECRET;
  assert.throws(() => generateQrPayload("DQ-WEB-1", "item", "user", "WEBINAR"), /must be configured/);
  process.env.TICKET_HMAC_SECRET = "test-only-secret-that-is-at-least-32-characters";
  const encoded = generateQrPayload("DQ-WEB-1", "item", "user", "WEBINAR");
  assert.equal(verifyQrPayload(encoded)?.u, "user");
  if (previous) process.env.TICKET_HMAC_SECRET = previous; else delete process.env.TICKET_HMAC_SECRET;
});

test("session migration supports course/event ownership and protected history", async () => {
  const migration = await readFile(new URL("../supabase/communications-upgrade.sql", import.meta.url), "utf8");
  assert.match(migration, /event_sessions_single_parent_check/);
  assert.match(migration, /course_id uuid references public\.courses/);
  assert.match(migration, /protect_session_history/);
  assert.match(migration, /session_cancelled/);
  assert.match(migration, /exists\(select 1 from public\.session_enrollments se/);
});
