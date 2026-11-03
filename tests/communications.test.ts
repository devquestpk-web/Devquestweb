import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { renderTemplate } from "../app/lib/email-service.ts";
import { generateQrPayload, verifyQrPayload } from "../app/lib/ticket-codes.ts";

test("template rendering escapes student-controlled HTML", () => {
  assert.equal(renderTemplate("Hello {{student_name}}", { student_name: "<script>alert(1)</script>" }, true), "Hello &lt;script&gt;alert(1)&lt;/script&gt;");
});

test("template rendering removes unknown variables", () => {
  assert.equal(renderTemplate("{{student_name}} {{private_key}}", { student_name: "Ayesha", private_key: "secret" }), "Ayesha ");
});

test("formula-like Sheet values are guarded in server implementation", async () => {
  const source = await readFile(new URL("../app/lib/google-sheets-api.ts", import.meta.url), "utf8");
  assert.match(source, /\^\[=\+\\-@\]/);
  assert.doesNotMatch(source, /NEXT_PUBLIC_GOOGLE/);
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
