import { NextResponse } from "next/server";
import { requireAdmin } from "../../../lib/supabase-admin";

const sessionStatuses = new Set(["draft", "scheduled", "live", "completed", "cancelled"]);
const attendanceStatuses = new Set(["present", "late", "absent", "excused"]);
function optionalUrl(value: unknown) { const text = String(value || "").trim(); if (!text) return null; const url = new URL(text); if (url.protocol !== "https:") throw new Error("Session links must use HTTPS"); return url.toString(); }
function cleanResources(value: unknown) { if (!Array.isArray(value)) return []; return value.slice(0, 20).map((entry) => { const item = entry && typeof entry === "object" ? entry as Record<string, unknown> : {}; return { title: String(item.title || "Resource").trim().slice(0, 120), url: optionalUrl(item.url) }; }).filter((item) => item.url); }

export async function GET(request: Request) {
  const auth = await requireAdmin(request); if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const [{ data, error }, { data: webinars, error: webinarsError }, { data: courses, error: coursesError }] = await Promise.all([
    auth.supabase.from("event_sessions").select("*, webinars(title), courses(title), session_enrollments(id, user_id, status, registered_at), session_attendance(id, user_id, status, checked_in_at)").order("starts_at", { ascending: false }),
    auth.supabase.from("webinars").select("id, title").order("title"),
    auth.supabase.from("courses").select("id, title").order("title"),
  ]);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (webinarsError || coursesError) return NextResponse.json({ error: webinarsError?.message || coursesError?.message || "Could not load parent programs" }, { status: 500 });
  const userIds = Array.from(new Set((data || []).flatMap((session) => [
    ...(session.session_enrollments || []).map((entry: { user_id: string }) => entry.user_id),
    ...(session.session_attendance || []).map((entry: { user_id: string }) => entry.user_id),
  ])));
  const { data: profiles, error: profilesError } = userIds.length
    ? await auth.supabase.from("profiles").select("id, full_name, student_id").in("id", userIds)
    : { data: [], error: null };
  if (profilesError) return NextResponse.json({ error: profilesError.message }, { status: 500 });
  const profilesById = new Map((profiles || []).map((profile) => [profile.id, profile]));
  const sessions = (data || []).map((session) => ({
    ...session,
    session_enrollments: (session.session_enrollments || []).map((entry: { user_id: string }) => ({ ...entry, profiles: profilesById.get(entry.user_id) || null })),
    session_attendance: (session.session_attendance || []).map((entry: { user_id: string }) => ({ ...entry, profiles: profilesById.get(entry.user_id) || null })),
  }));
  return NextResponse.json({ sessions, webinars: webinars || [], courses: courses || [] }, { headers: { "Cache-Control": "no-store, private" } });
}

export async function POST(request: Request) {
  const auth = await requireAdmin(request); if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  try {
    const body = await request.json(); const title = String(body.title || "").trim().slice(0, 180); const parentType = body.parentType === "course" ? "course" : "event"; const parentId = String(body.parentId || body.webinarId || "");
    if (!parentId || title.length < 2 || !body.startsAt || !body.endsAt) return NextResponse.json({ error: "Parent, title, start, and end are required" }, { status: 400 });
    const startsAt = new Date(body.startsAt);
    const endsAt = new Date(body.endsAt);
    if (!Number.isFinite(startsAt.getTime()) || !Number.isFinite(endsAt.getTime()) || endsAt <= startsAt) return NextResponse.json({ error: "Session end must be later than its start" }, { status: 400 });
    const status = sessionStatuses.has(body.status) ? body.status : "draft";
    const { data, error } = await auth.supabase.from("event_sessions").insert({ webinar_id: parentType === "event" ? parentId : null, course_id: parentType === "course" ? parentId : null, title, topic: String(body.topic || "").trim().slice(0, 500) || null, trainer: String(body.trainer || "").trim().slice(0, 180) || null, starts_at: startsAt.toISOString(), ends_at: endsAt.toISOString(), status, published_at: status === "scheduled" ? new Date().toISOString() : null, enrollment_mode: body.enrollmentMode === "optional" ? "optional" : "mandatory", join_url: optionalUrl(body.joinUrl), recording_url: optionalUrl(body.recordingUrl), resources: cleanResources(body.resources), join_releases_at: body.joinReleasesAt || null, created_by: auth.user.id }).select("id").single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (body.enrollmentMode !== "optional") {
      const enrollmentQuery = auth.supabase.from("enrollments").select("user_id").eq("item_type", parentType === "event" ? "WEBINAR" : "COURSE").eq(parentType === "event" ? "webinar_id" : "course_id", parentId);
      const { data: parentEnrollments } = await enrollmentQuery;
      if (parentEnrollments?.length) await auth.supabase.from("session_enrollments").upsert(parentEnrollments.map((entry) => ({ session_id: data.id, user_id: entry.user_id, status: "enrolled" })), { onConflict: "session_id,user_id" });
    }
    await auth.supabase.from("admin_audit_logs").insert({ actor_id: auth.user.id, action: "session.created", entity_type: "event_sessions", entity_id: data.id, details: { parent_type: parentType, parent_id: parentId, status } });
    return NextResponse.json({ ok: true, session: data }, { status: 201 });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid session" }, { status: 400 }); }
}

export async function PATCH(request: Request) {
  const auth = await requireAdmin(request); if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  try {
    const body = await request.json(); const sessionId = String(body.sessionId || ""); if (!sessionId) return NextResponse.json({ error: "Session is required" }, { status: 400 });
    if (body.action === "attendance") {
      const userId = String(body.userId || ""); const status = String(body.status || "present"); if (!userId || !attendanceStatuses.has(status)) return NextResponse.json({ error: "Valid student and attendance status are required" }, { status: 400 });
      const { error } = await auth.supabase.from("session_attendance").upsert({ session_id: sessionId, user_id: userId, status, checked_in_at: ["present", "late"].includes(status) ? new Date().toISOString() : null, marked_by: auth.user.id, notes: String(body.notes || "").trim().slice(0, 500) || null, updated_at: new Date().toISOString() }, { onConflict: "session_id,user_id" });
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      await auth.supabase.from("admin_audit_logs").insert({ actor_id: auth.user.id, action: "session.attendance_marked", entity_type: "event_sessions", entity_id: sessionId, details: { user_id: userId, status } }); return NextResponse.json({ ok: true });
    }
    const { data: current } = await auth.supabase.from("event_sessions").select("*").eq("id", sessionId).single(); if (!current || current.deleted_at) return NextResponse.json({ error: "Active session not found" }, { status: 404 });
    const changes: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (body.title !== undefined) changes.title = String(body.title).trim().slice(0, 180); if (body.topic !== undefined) changes.topic = String(body.topic).trim().slice(0, 500) || null; if (body.trainer !== undefined) changes.trainer = String(body.trainer).trim().slice(0, 180) || null;
    if (body.startsAt) changes.starts_at = body.startsAt; if (body.endsAt) changes.ends_at = body.endsAt; if (body.joinUrl !== undefined) changes.join_url = optionalUrl(body.joinUrl); if (body.recordingUrl !== undefined) changes.recording_url = optionalUrl(body.recordingUrl); if (body.joinReleasesAt !== undefined) changes.join_releases_at = body.joinReleasesAt || null; if (body.resources !== undefined) changes.resources = cleanResources(body.resources);
    if (body.status !== undefined) { if (!sessionStatuses.has(body.status)) return NextResponse.json({ error: "Invalid session status" }, { status: 400 }); changes.status = body.status; if (body.status === "scheduled" && !current.published_at) changes.published_at = new Date().toISOString(); if (body.status === "cancelled") { changes.cancelled_at = new Date().toISOString(); changes.cancellation_reason = String(body.cancellationReason || "").trim().slice(0, 500) || null; } }
    const { error } = await auth.supabase.from("event_sessions").update(changes).eq("id", sessionId); if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await auth.supabase.from("admin_audit_logs").insert({ actor_id: auth.user.id, action: changes.status === "cancelled" ? "session.cancelled" : "session.updated", entity_type: "event_sessions", entity_id: sessionId, details: { changes: Object.keys(changes), reason: changes.cancellation_reason || null } }); return NextResponse.json({ ok: true });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid session update" }, { status: 400 }); }
}

export async function DELETE(request: Request) {
  const auth = await requireAdmin(request); if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status }); const body = await request.json(); const sessionId = String(body.sessionId || ""); if (!sessionId) return NextResponse.json({ error: "Session is required" }, { status: 400 });
  const [{ count: enrollments }, { count: attendance }] = await Promise.all([auth.supabase.from("session_enrollments").select("id", { count: "exact", head: true }).eq("session_id", sessionId), auth.supabase.from("session_attendance").select("id", { count: "exact", head: true }).eq("session_id", sessionId)]); const hasHistory = Boolean(enrollments || attendance);
  const result = hasHistory ? await auth.supabase.from("event_sessions").update({ deleted_at: new Date().toISOString(), deleted_by: auth.user.id, status: "cancelled", cancelled_at: new Date().toISOString(), cancellation_reason: String(body.reason || "Archived by administrator").slice(0, 500) }).eq("id", sessionId) : await auth.supabase.from("event_sessions").delete().eq("id", sessionId);
  if (result.error) return NextResponse.json({ error: result.error.message }, { status: 500 }); await auth.supabase.from("admin_audit_logs").insert({ actor_id: auth.user.id, action: hasHistory ? "session.soft_deleted" : "session.deleted", entity_type: "event_sessions", entity_id: sessionId, details: { reason: body.reason || null } }); return NextResponse.json({ ok: true, softDeleted: hasHistory });
}
