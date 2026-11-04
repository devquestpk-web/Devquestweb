import { NextResponse } from "next/server";
import { requireAdmin } from "../../../lib/supabase-admin";
import { evaluateCertificateEligibility, resolveCertificateTemplate, type CertificateScope } from "../../../lib/certificate-eligibility";
import { generateCertCode } from "../../../lib/ticket-codes";

export const runtime = "nodejs";

const hexColor = (value: unknown, fallback: string) => /^#[0-9a-f]{6}$/i.test(String(value || "")) ? String(value) : fallback;
const text = (value: unknown, length = 140) => String(value || "").trim().slice(0, length);

export async function GET(request: Request) {
  const auth = await requireAdmin(request); if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const [templatesResult, certificatesResult, courses, webinars, sessions, profiles] = await Promise.all([
    auth.supabase.from("certificate_templates").select("*, courses(title), webinars(title), event_sessions(title)").order("updated_at", { ascending: false }),
    auth.supabase.from("certificates").select("id, cert_code, user_id, item_type, course_id, webinar_id, session_id, issuance_mode, issued_at, revoked_at").order("issued_at", { ascending: false }).limit(200),
    auth.supabase.from("courses").select("id, title").order("title"),
    auth.supabase.from("webinars").select("id, title").order("title"),
    auth.supabase.from("event_sessions").select("id, title, course_id, webinar_id").is("deleted_at", null).order("starts_at", { ascending: false }),
    auth.supabase.from("profiles").select("id, full_name, student_id, email").eq("role", "student").order("full_name"),
  ]);
  if (templatesResult.error) return NextResponse.json({ error: templatesResult.error.message }, { status: 500 });
  if (certificatesResult.error) return NextResponse.json({ error: certificatesResult.error.message }, { status: 500 });
  const certificates = certificatesResult.data || [];
  return NextResponse.json({ templates: templatesResult.data || [], certificates, courses: courses.data || [], webinars: webinars.data || [], sessions: sessions.data || [], students: profiles.data || [] }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function POST(request: Request) {
  const auth = await requireAdmin(request); if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const contentType = request.headers.get("content-type") || "";
  if (contentType.includes("multipart/form-data")) return uploadManualCertificate(request, auth);
  try {
    const body = await request.json();
    if (body.action !== "template") return NextResponse.json({ error: "Unsupported certificate action" }, { status: 400 });
    const scopeType = ["DEFAULT", "COURSE", "WEBINAR", "SESSION"].includes(body.scopeType) ? body.scopeType : "DEFAULT";
    const scopeId = text(body.scopeId, 80) || null;
    if (scopeType !== "DEFAULT" && !scopeId) return NextResponse.json({ error: "A scope item is required" }, { status: 400 });
    const minimumAttendancePercent = Math.min(100, Math.max(0, Number(body.minimumAttendancePercent ?? 100)));
    const record = {
      name: text(body.name, 120), scope_type: scopeType,
      course_id: scopeType === "COURSE" ? scopeId : null, webinar_id: scopeType === "WEBINAR" ? scopeId : null, session_id: scopeType === "SESSION" ? scopeId : null,
      config: { primaryColor: hexColor(body.primaryColor, "#061e3d"), accentColor: hexColor(body.accentColor, "#469bff"), brandName: text(body.brandName, 60) || "DevQuest", issuerName: text(body.issuerName, 100) || "DevQuest Administration", issuerTitle: text(body.issuerTitle, 140) || "Issued digitally by DevQuest PK" },
      eligibility_rules: { minimumAttendancePercent, requireAllSessions: Boolean(body.requireAllSessions) }, is_active: true, created_by: auth.user.id, updated_at: new Date().toISOString(),
    };
    if (!record.name) return NextResponse.json({ error: "Template name is required" }, { status: 400 });
    if (scopeType === "DEFAULT") await auth.supabase.from("certificate_templates").update({ is_active: false, updated_at: new Date().toISOString() }).eq("scope_type", "DEFAULT").eq("is_active", true);
    const { data, error } = await auth.supabase.from("certificate_templates").insert(record).select("id").single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    await auth.supabase.from("admin_audit_logs").insert({ actor_id: auth.user.id, action: "certificate_template.created", entity_type: "certificate_templates", entity_id: data.id, details: { scope_type: scopeType, scope_id: scopeId } });
    return NextResponse.json({ ok: true, id: data.id }, { status: 201 });
  } catch { return NextResponse.json({ error: "Invalid certificate request" }, { status: 400 }); }
}

async function uploadManualCertificate(request: Request, auth: Exclude<Awaited<ReturnType<typeof requireAdmin>>, { error: string; status: number }>) {
  const form = await request.formData(); const file = form.get("file"); const userId = text(form.get("userId"), 80); const itemType = text(form.get("itemType")) as "COURSE" | "WEBINAR"; const itemId = text(form.get("itemId"), 80); const sessionId = text(form.get("sessionId"), 80) || null; const overrideReason = text(form.get("overrideReason"), 500);
  if (!(file instanceof File) || file.type !== "application/pdf" || file.size < 5 || file.size > 10 * 1024 * 1024) return NextResponse.json({ error: "A PDF up to 10 MB is required" }, { status: 400 });
  if (!userId || !itemId || !["COURSE", "WEBINAR"].includes(itemType)) return NextResponse.json({ error: "Student and certificate scope are required" }, { status: 400 });
  const bytes = new Uint8Array(await file.arrayBuffer()); if (new TextDecoder().decode(bytes.slice(0, 5)) !== "%PDF-") return NextResponse.json({ error: "The uploaded file is not a valid PDF" }, { status: 400 });
  const scope: CertificateScope = { itemType, courseId: itemType === "COURSE" ? itemId : null, webinarId: itemType === "WEBINAR" ? itemId : null, sessionId };
  const template = await resolveCertificateTemplate(auth.supabase, scope); const eligibility = await evaluateCertificateEligibility(auth.supabase, userId, scope, (template?.eligibility_rules || {}) as Record<string, unknown>);
  if (!eligibility.eligible && overrideReason.length < 10) return NextResponse.json({ error: `${eligibility.reason}. Provide an override reason of at least 10 characters.` }, { status: 403 });
  const certCode = generateCertCode(); const path = `${userId}/${certCode}.pdf`; const upload = await auth.supabase.storage.from("certificates").upload(path, bytes, { contentType: "application/pdf", upsert: false });
  if (upload.error) return NextResponse.json({ error: upload.error.message }, { status: 500 });
  const origin = new URL(request.url).origin; const pdfUrl = auth.supabase.storage.from("certificates").getPublicUrl(path).data.publicUrl;
  const { data, error } = await auth.supabase.from("certificates").insert({ cert_code: certCode, user_id: userId, item_type: itemType, course_id: scope.courseId, webinar_id: scope.webinarId, session_id: sessionId, template_id: template?.id || null, issuance_mode: "manual", eligibility_snapshot: { ...eligibility.snapshot, overrideReason: overrideReason || null }, uploaded_by: auth.user.id, pdf_url: pdfUrl, verification_url: `${origin}/verify/${certCode}` }).select("id, cert_code").single();
  if (error) { await auth.supabase.storage.from("certificates").remove([path]); return NextResponse.json({ error: error.code === "23505" ? "A certificate already exists for this student and scope" : error.message }, { status: 409 }); }
  await auth.supabase.from("admin_audit_logs").insert({ actor_id: auth.user.id, action: "certificate.manual_upload", entity_type: "certificates", entity_id: data.id, details: { user_id: userId, item_type: itemType, item_id: itemId, session_id: sessionId, override_reason: overrideReason || null } });
  return NextResponse.json({ ok: true, certificate: data }, { status: 201 });
}

export async function PATCH(request: Request) {
  const auth = await requireAdmin(request); if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const body = await request.json();
  if (body.action === "template_status") {
    const { error } = await auth.supabase.from("certificate_templates").update({ is_active: Boolean(body.isActive), updated_at: new Date().toISOString() }).eq("id", text(body.id, 80));
    if (error) return NextResponse.json({ error: error.message }, { status: 400 }); return NextResponse.json({ ok: true });
  }
  if (body.action === "revoke") {
    const reason = text(body.reason, 500); if (reason.length < 10) return NextResponse.json({ error: "A revocation reason of at least 10 characters is required" }, { status: 400 });
    const { error } = await auth.supabase.from("certificates").update({ revoked_at: new Date().toISOString(), revoked_by: auth.user.id, revocation_reason: reason }).eq("id", text(body.id, 80)).is("revoked_at", null);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    await auth.supabase.from("admin_audit_logs").insert({ actor_id: auth.user.id, action: "certificate.revoked", entity_type: "certificates", entity_id: text(body.id, 80), details: { reason } }); return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: "Unsupported certificate action" }, { status: 400 });
}
