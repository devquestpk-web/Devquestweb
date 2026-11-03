import { NextResponse } from "next/server";
import { requireStudent } from "../../../lib/student-auth";

export async function GET(request: Request) {
  const auth = await requireStudent(request);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { data: enrollments, error } = await auth.supabase.from("enrollments").select("item_type, webinar_id, course_id").eq("user_id", auth.user.id);
  if (error) return NextResponse.json({ error: "Could not load sessions" }, { status: 500 });
  const webinarIds = (enrollments || []).map((item) => item.webinar_id).filter(Boolean);
  const courseIds = (enrollments || []).map((item) => item.course_id).filter(Boolean);
  const selection = "id, webinar_id, course_id, title, topic, trainer, starts_at, ends_at, status, enrollment_mode, resources, join_releases_at, webinars(title), courses(title)";
  const [eventResult, courseResult] = await Promise.all([
    webinarIds.length ? auth.supabase.from("event_sessions").select(selection).in("webinar_id", webinarIds).is("deleted_at", null).neq("status", "draft") : Promise.resolve({ data: [], error: null }),
    courseIds.length ? auth.supabase.from("event_sessions").select(selection).in("course_id", courseIds).is("deleted_at", null).neq("status", "draft") : Promise.resolve({ data: [], error: null }),
  ]);
  if (eventResult.error || courseResult.error) return NextResponse.json({ error: "Could not load sessions" }, { status: 500 });
  const sessions = [...(eventResult.data || []), ...(courseResult.data || [])].sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());
  const sessionIds = sessions.map((session) => session.id);
  const { data: ownSessionEnrollments, error: sessionEnrollmentError } = sessionIds.length
    ? await auth.supabase.from("session_enrollments").select("session_id").eq("user_id", auth.user.id).eq("status", "enrolled").in("session_id", sessionIds)
    : { data: [], error: null };
  if (sessionEnrollmentError) return NextResponse.json({ error: "Could not load session enrollments" }, { status: 500 });
  const enrolledSessionIds = new Set((ownSessionEnrollments || []).map((entry) => entry.session_id));
  const now = Date.now();
  const safeSessions = sessions.map((session) => {
    const enrolled = enrolledSessionIds.has(session.id);
    return { ...session, resources: enrolled ? session.resources : [], enrolled, joinAvailable: enrolled && (session.status === "live" || Boolean(session.join_releases_at && new Date(session.join_releases_at).getTime() <= now)) };
  });
  return NextResponse.json({ sessions: safeSessions });
}

export async function POST(request: Request) {
  const auth = await requireStudent(request);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { sessionId } = await request.json();
  const { data: session } = await auth.supabase.from("event_sessions").select("id, webinar_id, course_id, title, enrollment_mode, status, deleted_at").eq("id", String(sessionId || "")).single();
  if (!session || session.status === "cancelled" || session.deleted_at) return NextResponse.json({ error: "Session is unavailable" }, { status: 404 });
  const parentType = session.webinar_id ? "WEBINAR" : "COURSE"; const parentColumn = session.webinar_id ? "webinar_id" : "course_id"; const parentId = session.webinar_id || session.course_id;
  const { data: eventEnrollment } = await auth.supabase.from("enrollments").select("id").eq("user_id", auth.user.id).eq("item_type", parentType).eq(parentColumn, parentId).maybeSingle();
  if (!eventEnrollment) return NextResponse.json({ error: "Event enrollment is required" }, { status: 403 });
  const { error } = await auth.supabase.from("session_enrollments").upsert({ session_id: session.id, user_id: auth.user.id, status: "enrolled", cancelled_at: null }, { onConflict: "session_id,user_id" });
  if (error) return NextResponse.json({ error: "Could not enroll in session" }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const auth = await requireStudent(request);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { sessionId } = await request.json();
  const { data: session } = await auth.supabase.from("event_sessions").select("enrollment_mode").eq("id", String(sessionId || "")).single();
  if (session?.enrollment_mode !== "optional") return NextResponse.json({ error: "Mandatory sessions cannot be cancelled separately" }, { status: 409 });
  const { error } = await auth.supabase.from("session_enrollments").update({ status: "cancelled", cancelled_at: new Date().toISOString() }).eq("session_id", String(sessionId)).eq("user_id", auth.user.id);
  if (error) return NextResponse.json({ error: "Could not cancel session enrollment" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
