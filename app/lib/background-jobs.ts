import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseAdminClient } from "./supabase-admin";
import { ensureSheetHeaders, upsertSheetRow } from "./google-sheets-api";
import { normalizeEmailVariables, renderTemplate, sendBrandedEmail } from "./email-service";

const sheetHeaders = {
  Students: ["supabase_user_id", "student_id", "full_name", "email", "phone", "city", "university", "degree", "semester", "github_url", "linkedin_url", "discord_handle", "skills", "avatar_url", "profile_completed", "account_status", "created_at", "updated_at", "last_synced_at"],
  Events: ["event_id", "title", "type", "status", "start_date", "end_date", "published", "event_enrollment_count"],
  Sessions: ["session_id", "event_id", "session_title", "trainer", "start_at", "end_at", "session_status", "enrolled_count", "attended_count", "updated_at"],
  Session_Enrollments: ["session_enrollment_id", "session_id", "event_id", "student_id", "supabase_user_id", "student_name", "student_email", "enrollment_status", "registered_at", "cancelled_at", "last_synced_at"],
  Attendance: ["attendance_id", "session_id", "student_id", "attendance_status", "checked_in_at", "marked_by", "updated_at"],
  Certificates: ["certificate_id", "certificate_code", "student_id", "event_id", "session_id", "issue_date", "verification_status"],
} as const;

type OutboxRecord = { id: string; entity_type: string; entity_id: string; entity_version: number; attempts: number; payload: Record<string, unknown> };

async function studentEmail(supabase: SupabaseClient, userId: string) {
  const { data } = await supabase.auth.admin.getUserById(userId);
  return data.user?.email_confirmed_at ? data.user.email || "" : "";
}

async function syncEntity(supabase: SupabaseClient, job: OutboxRecord) {
  const syncedAt = new Date().toISOString();
  if (job.entity_type === "profiles") {
    const { data, error } = await supabase.from("profiles").select("id, student_id, full_name, phone, city, university, degree, semester, github_url, linkedin_url, discord_handle, skills, avatar_url, profile_completed, is_active, created_at, updated_at, role").eq("id", job.entity_id).maybeSingle();
    if (error) throw error;
    if (!data || data.role !== "student") return;
    const email = await studentEmail(supabase, data.id);
    await ensureSheetHeaders("Students", [...sheetHeaders.Students]);
    const skills = Array.isArray(data.skills) ? data.skills.join(", ") : "";
    const row = await upsertSheetRow("Students", data.id, [data.id, data.student_id, data.full_name, email, data.phone, data.city, data.university, data.degree, data.semester, data.github_url, data.linkedin_url, data.discord_handle, skills, data.avatar_url, data.profile_completed, data.is_active ? "active" : "disabled", data.created_at, data.updated_at, syncedAt]);
    await supabase.from("sheet_row_mapping").upsert({ entity_type: "profiles", entity_id: data.id, sheet_name: "Students", row_number: row, last_version: job.entity_version, last_synced_at: syncedAt, last_error: null });
    return;
  }
  if (job.entity_type === "webinars") {
    const { data, error } = await supabase.from("webinars").select("id, title, status, start_time, end_time, is_published").eq("id", job.entity_id).maybeSingle();
    if (error) throw error;
    const { count } = await supabase.from("enrollments").select("id", { count: "exact", head: true }).eq("item_type", "WEBINAR").eq("webinar_id", job.entity_id);
    await ensureSheetHeaders("Events", [...sheetHeaders.Events]);
    const values = data ? [data.id, data.title, "webinar", data.status, data.start_time, data.end_time, data.is_published, count || 0] : [job.entity_id, "", "webinar", "deleted", "", "", false, 0];
    const row = await upsertSheetRow("Events", job.entity_id, values);
    await supabase.from("sheet_row_mapping").upsert({ entity_type: "webinars", entity_id: job.entity_id, sheet_name: "Events", row_number: row, last_version: job.entity_version, last_synced_at: syncedAt, last_error: null });
    return;
  }
  if (job.entity_type === "courses") {
    const { data, error } = await supabase.from("courses").select("id, title, is_published, created_at").eq("id", job.entity_id).maybeSingle();
    if (error) throw error;
    const { count } = await supabase.from("enrollments").select("id", { count: "exact", head: true }).eq("item_type", "COURSE").eq("course_id", job.entity_id);
    await ensureSheetHeaders("Events", [...sheetHeaders.Events]);
    const values = data ? [data.id, data.title, "course", data.is_published ? "published" : "draft", data.created_at, "", data.is_published, count || 0] : [job.entity_id, "", "course", "deleted", "", "", false, 0];
    const row = await upsertSheetRow("Events", job.entity_id, values);
    await supabase.from("sheet_row_mapping").upsert({ entity_type: "courses", entity_id: job.entity_id, sheet_name: "Events", row_number: row, last_version: job.entity_version, last_synced_at: syncedAt, last_error: null });
    return;
  }
  if (job.entity_type === "event_sessions") {
    const { data, error } = await supabase.from("event_sessions").select("id, webinar_id, course_id, title, trainer, starts_at, ends_at, status, updated_at, deleted_at").eq("id", job.entity_id).maybeSingle();
    if (error) throw error;
    const [{ count: enrolled }, { count: attended }] = await Promise.all([
      supabase.from("session_enrollments").select("id", { count: "exact", head: true }).eq("session_id", job.entity_id).eq("status", "enrolled"),
      supabase.from("session_attendance").select("id", { count: "exact", head: true }).eq("session_id", job.entity_id).in("status", ["present", "late"]),
    ]);
    await ensureSheetHeaders("Sessions", [...sheetHeaders.Sessions]);
    const values = data ? [data.id, data.webinar_id || data.course_id, data.title, data.trainer, data.starts_at, data.ends_at, data.deleted_at ? "deleted" : data.status, enrolled || 0, attended || 0, data.updated_at] : [job.entity_id, "", "", "", "", "", "deleted", 0, 0, syncedAt];
    const row = await upsertSheetRow("Sessions", job.entity_id, values);
    await supabase.from("sheet_row_mapping").upsert({ entity_type: "event_sessions", entity_id: job.entity_id, sheet_name: "Sessions", row_number: row, last_version: job.entity_version, last_synced_at: syncedAt, last_error: null });
    return;
  }
  if (job.entity_type === "session_enrollments") {
    const { data, error } = await supabase.from("session_enrollments").select("id, session_id, user_id, status, registered_at, cancelled_at, event_sessions(webinar_id, course_id)").eq("id", job.entity_id).maybeSingle();
    if (error) throw error;
    if (!data) return;
    const { data: profile } = await supabase.from("profiles").select("student_id, full_name").eq("id", data.user_id).single();
    const email = await studentEmail(supabase, data.user_id);
    const sessionRelation = data.event_sessions as unknown as { webinar_id?: string; course_id?: string } | null;
    await ensureSheetHeaders("Session_Enrollments", [...sheetHeaders.Session_Enrollments]);
    const row = await upsertSheetRow("Session_Enrollments", data.id, [data.id, data.session_id, sessionRelation?.webinar_id || sessionRelation?.course_id, profile?.student_id, data.user_id, profile?.full_name, email, data.status, data.registered_at, data.cancelled_at, syncedAt]);
    await supabase.from("sheet_row_mapping").upsert({ entity_type: "session_enrollments", entity_id: data.id, sheet_name: "Session_Enrollments", row_number: row, last_version: job.entity_version, last_synced_at: syncedAt, last_error: null });
    await syncEntity(supabase, { ...job, entity_type: "event_sessions", entity_id: data.session_id });
    return;
  }
  if (job.entity_type === "session_attendance") {
    const { data, error } = await supabase.from("session_attendance").select("id, session_id, user_id, status, checked_in_at, marked_by, updated_at").eq("id", job.entity_id).maybeSingle();
    if (error) throw error;
    if (!data) return;
    const { data: profile } = await supabase.from("profiles").select("student_id").eq("id", data.user_id).single();
    await ensureSheetHeaders("Attendance", [...sheetHeaders.Attendance]);
    const row = await upsertSheetRow("Attendance", data.id, [data.id, data.session_id, profile?.student_id, data.status, data.checked_in_at, data.marked_by, data.updated_at]);
    await supabase.from("sheet_row_mapping").upsert({ entity_type: "session_attendance", entity_id: data.id, sheet_name: "Attendance", row_number: row, last_version: job.entity_version, last_synced_at: syncedAt, last_error: null });
    await syncEntity(supabase, { ...job, entity_type: "event_sessions", entity_id: data.session_id });
    return;
  }
  if (job.entity_type === "certificates") {
    const { data, error } = await supabase.from("certificates").select("id, cert_code, user_id, webinar_id, course_id, session_id, issued_at, revoked_at").eq("id", job.entity_id).maybeSingle();
    if (error) throw error;
    if (!data) return;
    const { data: profile } = await supabase.from("profiles").select("student_id").eq("id", data.user_id).single();
    await ensureSheetHeaders("Certificates", [...sheetHeaders.Certificates]);
    const row = await upsertSheetRow("Certificates", data.id, [data.id, data.cert_code, profile?.student_id, data.webinar_id || data.course_id, data.session_id || "", data.issued_at, data.revoked_at ? "revoked" : "valid"]);
    await supabase.from("sheet_row_mapping").upsert({ entity_type: "certificates", entity_id: data.id, sheet_name: "Certificates", row_number: row, last_version: job.entity_version, last_synced_at: syncedAt, last_error: null });
  }
}

function retryAt(attempts: number) {
  return new Date(Date.now() + Math.min(60, 2 ** Math.max(attempts, 1)) * 60_000).toISOString();
}

export type ProgramSyncType = "webinars" | "courses" | "event_sessions";

// Admin writes can sync at once. The outbox remains the durable retry path if
// Google is temporarily unavailable or a deployment ends during the request.
export async function syncProgramNow(entityType: ProgramSyncType, entityId: string) {
  const supabase = getSupabaseAdminClient();
  const { data: pending, error: lookupError } = await supabase.from("integration_outbox")
    .select("id, entity_version, attempts, payload")
    .eq("entity_type", entityType)
    .eq("entity_id", entityId)
    .in("status", ["pending", "failed"])
    .order("created_at", { ascending: false })
    .limit(100);
  if (lookupError) throw lookupError;

  let jobs = pending || [];
  if (!jobs.length) {
    const { data: fallback, error: queueError } = await supabase.from("integration_outbox")
      .insert({ event_type: "sync", entity_type: entityType, entity_id: entityId, entity_version: Date.now() * 1000, payload: { source: "admin_write" } })
      .select("id, entity_version, attempts, payload")
      .single();
    if (queueError) throw queueError;
    jobs = [fallback];
  }

  const latest = jobs[0];
  await syncEntity(supabase, { ...latest, entity_type: entityType, entity_id: entityId });
  const { error: completionError } = await supabase.from("integration_outbox")
    .update({ status: "completed", completed_at: new Date().toISOString(), last_error: null })
    .in("id", jobs.map((job) => job.id))
    .in("status", ["pending", "failed"]);
  if (completionError) throw completionError;
  return { synced: true, queuedJobs: jobs.length };
}

export async function syncProgramAfterWrite(entityType: ProgramSyncType, entityId: string) {
  try {
    await syncProgramNow(entityType, entityId);
    return "synced" as const;
  } catch (error) {
    console.error(`Google Sheets sync queued for ${entityType}/${entityId}`, error);
    return "queued" as const;
  }
}

export async function queueMissingProgramJobs(limit = 100) {
  const supabase = getSupabaseAdminClient();
  let queued = 0;
  for (const entityType of ["webinars", "courses", "event_sessions"] as const) {
    const { data: records, error: recordsError } = await supabase.from(entityType)
      .select("id")
      .order("id")
      .limit(limit);
    if (recordsError) throw recordsError;
    const ids = (records || []).map((record) => record.id);
    if (!ids.length) continue;
    const { data: mapped, error: mappingError } = await supabase.from("sheet_row_mapping")
      .select("entity_id")
      .eq("entity_type", entityType)
      .in("entity_id", ids);
    if (mappingError) throw mappingError;
    const mappedIds = new Set((mapped || []).map((row) => row.entity_id));
    const missingIds = ids.filter((id) => !mappedIds.has(id));
    if (!missingIds.length) continue;
    const { data: existing, error: outboxError } = await supabase.from("integration_outbox")
      .select("entity_id")
      .eq("entity_type", entityType)
      .in("entity_id", missingIds)
      .in("status", ["pending", "failed", "processing"]);
    if (outboxError) throw outboxError;
    const queuedIds = new Set((existing || []).map((row) => row.entity_id));
    const toQueue = missingIds.filter((id) => !queuedIds.has(id));
    if (!toQueue.length) continue;
    const timestamp = Date.now() * 1000;
    const { error: insertError } = await supabase.from("integration_outbox").insert(toQueue.map((id, index) => ({
      event_type: "sync", entity_type: entityType, entity_id: id, entity_version: timestamp + index, payload: { source: "missing_sheet_row" },
    })));
    if (insertError) throw insertError;
    queued += toQueue.length;
  }
  return queued;
}

export async function processIntegrationJobs(limit = 20) {
  const supabase = getSupabaseAdminClient();
  const { data: jobs, error } = await supabase.rpc("claim_integration_jobs", { p_limit: limit });
  if (error) throw error;
  let completed = 0; let failed = 0;
  for (const job of (jobs || []) as OutboxRecord[]) {
    try {
      await syncEntity(supabase, job);
      await supabase.from("integration_outbox").update({ status: "completed", completed_at: new Date().toISOString(), last_error: null }).eq("id", job.id);
      completed++;
    } catch (cause) {
      const attempts = job.attempts;
      await supabase.from("integration_outbox").update({ status: attempts >= 24 ? "dead" : "failed", available_at: retryAt(attempts), last_error: cause instanceof Error ? cause.message.slice(0, 1000) : "Unknown integration error" }).eq("id", job.id);
      failed++;
    }
  }
  return { processed: jobs?.length || 0, completed, failed };
}

export async function processNotificationJobs(limit = 20) {
  const supabase = getSupabaseAdminClient();
  const { data: jobs, error } = await supabase.rpc("claim_notification_jobs", { p_limit: limit });
  if (error) throw error;
  let sent = 0; let failed = 0;
  for (const job of jobs || []) {
    try {
      let recipient = job.recipient_email || "";
      if (!recipient && job.recipient_user_id) recipient = await studentEmail(supabase, job.recipient_user_id);
      if (!recipient) throw new Error("Recipient email is unavailable");
      const { data: suppression } = await supabase.from("email_suppressions").select("email").eq("email", recipient.toLowerCase()).maybeSingle();
      if (suppression) {
        await supabase.from("notification_outbox").update({ status: "cancelled", last_error: "Recipient is suppressed" }).eq("id", job.id);
        continue;
      }
      const { data: template } = await supabase.from("email_templates").select("subject, html_body").eq("template_key", job.template_key).eq("is_active", true).order("version", { ascending: false }).limit(1).single();
      if (!template) throw new Error(`Active template '${job.template_key}' was not found`);
      const variables = normalizeEmailVariables(job.variables);
      const messageId = await sendBrandedEmail({ to: recipient, subject: renderTemplate(template.subject, variables), html: renderTemplate(template.html_body, variables, true) });
      await supabase.from("notification_outbox").update({ status: "sent", provider_message_id: messageId, sent_at: new Date().toISOString(), last_error: null }).eq("id", job.id);
      await supabase.from("email_delivery_logs").insert({ notification_id: job.id, provider_message_id: messageId, recipient_email: recipient, status: "sent" });
      sent++;
    } catch (cause) {
      const attempts = job.attempts;
      await supabase.from("notification_outbox").update({ status: attempts >= 24 ? "dead" : "failed", scheduled_for: retryAt(attempts), last_error: cause instanceof Error ? cause.message.slice(0, 1000) : "Unknown email error" }).eq("id", job.id);
      failed++;
    }
  }
  return { processed: jobs?.length || 0, sent, failed };
}
