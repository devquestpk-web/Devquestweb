import { NextResponse } from "next/server";
import { requireAdmin } from "../../../lib/supabase-admin";

type Recipient = { id: string; email: string };

async function recipients(auth: Awaited<ReturnType<typeof requireAdmin>>, audience: Record<string, unknown>) {
  if ("error" in auth) return [];
  let userIds: string[] = [];
  const kind = String(audience.kind || "individual");
  if (kind === "individual" && audience.userId) userIds = [String(audience.userId)];
  if (kind === "all_students") {
    const { data } = await auth.supabase.from("profiles").select("id").eq("role", "student").eq("is_active", true).eq("email_notifications", true).eq("marketing_emails", true);
    userIds = (data || []).map((row) => row.id);
  }
  if (kind === "event" && audience.webinarId) {
    const { data } = await auth.supabase.from("enrollments").select("user_id").eq("item_type", "WEBINAR").eq("webinar_id", String(audience.webinarId));
    userIds = (data || []).map((row) => row.user_id);
  }
  if (kind === "session" && audience.sessionId) {
    const { data } = await auth.supabase.from("session_enrollments").select("user_id").eq("session_id", String(audience.sessionId)).eq("status", "enrolled");
    userIds = (data || []).map((row) => row.user_id);
  }
  const candidates = [...new Set(userIds)].slice(0, 500);
  const { data: permittedProfiles } = candidates.length ? await auth.supabase.from("profiles").select("id").in("id", candidates).eq("role", "student").eq("is_active", true).eq("email_notifications", true) : { data: [] };
  const unique = (permittedProfiles || []).map((profile) => profile.id);
  const resolved: Recipient[] = [];
  for (const id of unique) {
    const { data } = await auth.supabase.auth.admin.getUserById(id);
    if (data.user?.email && data.user.email_confirmed_at) resolved.push({ id, email: data.user.email });
  }
  return resolved;
}

export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const [templates, notifications, deliveries, syncJobs] = await Promise.all([
    auth.supabase.from("email_templates").select("*").order("template_key").order("version", { ascending: false }),
    auth.supabase.from("notification_outbox").select("id, notification_type, template_key, recipient_email, status, scheduled_for, attempts, last_error, created_at").order("created_at", { ascending: false }).limit(100),
    auth.supabase.from("email_delivery_logs").select("*").order("occurred_at", { ascending: false }).limit(100),
    auth.supabase.from("integration_outbox").select("id, entity_type, entity_id, status, attempts, last_error, created_at, completed_at").order("created_at", { ascending: false }).limit(100),
  ]);
  return NextResponse.json({ templates: templates.data || [], notifications: notifications.data || [], deliveries: deliveries.data || [], syncJobs: syncJobs.data || [] });
}

export async function POST(request: Request) {
  const auth = await requireAdmin(request);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const body = await request.json();
  const action = String(body.action || "send");
  if (action === "template") {
    const templateKey = String(body.templateKey || "").trim().replace(/[^a-z0-9_]/g, "").slice(0, 60);
    const subject = String(body.subject || "").trim().slice(0, 200);
    const htmlBody = String(body.htmlBody || "").trim().slice(0, 20_000);
    if (!templateKey || !subject || !htmlBody) return NextResponse.json({ error: "Template key, subject, and body are required" }, { status: 400 });
    const { data: latest } = await auth.supabase.from("email_templates").select("version").eq("template_key", templateKey).order("version", { ascending: false }).limit(1).maybeSingle();
    const { error } = await auth.supabase.from("email_templates").insert({ template_key: templateKey, name: String(body.name || templateKey).slice(0, 120), subject, html_body: htmlBody, version: (latest?.version || 0) + 1, created_by: auth.user.id, updated_by: auth.user.id });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await auth.supabase.from("admin_audit_logs").insert({ actor_id: auth.user.id, action: "communication.template_created", entity_type: "email_templates", entity_id: templateKey });
    return NextResponse.json({ ok: true });
  }
  if (action === "retry") {
    const id = String(body.id || "");
    const target = body.target === "sheets" ? "integration_outbox" : "notification_outbox";
    const changes = target === "integration_outbox" ? { status: "pending", available_at: new Date().toISOString(), last_error: null } : { status: "pending", scheduled_for: new Date().toISOString(), last_error: null };
    const { error } = await auth.supabase.from(target).update(changes).eq("id", id).in("status", ["failed", "dead"]);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }
  const templateKey = String(body.templateKey || "").trim();
  const variables = body.variables && typeof body.variables === "object" ? body.variables as Record<string, unknown> : {};
  const scheduledFor = body.scheduledFor ? new Date(String(body.scheduledFor)).toISOString() : new Date().toISOString();
  let selected: Recipient[];
  if (action === "test") {
    const email = String(body.testEmail || auth.user.email || "").trim().toLowerCase();
    if (!email) return NextResponse.json({ error: "Test email is required" }, { status: 400 });
    selected = [{ id: auth.user.id, email }];
  } else selected = await recipients(auth, body.audience || {});
  if (!selected.length) return NextResponse.json({ error: "No eligible verified recipients found" }, { status: 400 });
  if (selected.length > 500) return NextResponse.json({ error: "Recipient limit exceeded" }, { status: 400 });
  const campaignId = crypto.randomUUID();
  const rows = selected.map((recipient) => ({ notification_type: action === "test" ? "admin_test" : "admin_broadcast", template_key: templateKey, recipient_user_id: recipient.id, recipient_email: recipient.email, variables, dedupe_key: `admin:${campaignId}:${recipient.id}`, scheduled_for: scheduledFor, created_by: auth.user.id }));
  const { error } = await auth.supabase.from("notification_outbox").insert(rows);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await auth.supabase.from("admin_audit_logs").insert({ actor_id: auth.user.id, action: action === "test" ? "communication.test_queued" : "communication.campaign_queued", entity_type: "notification_outbox", entity_id: campaignId, details: { recipient_count: selected.length, template_key: templateKey, scheduled_for: scheduledFor } });
  return NextResponse.json({ ok: true, queued: selected.length, campaignId }, { status: 201 });
}
