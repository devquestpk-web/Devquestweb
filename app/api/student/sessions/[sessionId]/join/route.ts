import { NextResponse } from "next/server";
import { requireStudent } from "../../../../../lib/student-auth";

export async function GET(request: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  const auth = await requireStudent(request);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { sessionId } = await params;
  const { data: session } = await auth.supabase.from("event_sessions").select("id, status, join_url, join_releases_at, deleted_at").eq("id", sessionId).single();
  if (!session || session.deleted_at || session.status === "cancelled") return NextResponse.json({ error: "Session not found" }, { status: 404 });
  const { data: enrollment } = await auth.supabase.from("session_enrollments").select("id").eq("user_id", auth.user.id).eq("session_id", sessionId).eq("status", "enrolled").maybeSingle();
  if (!enrollment) return NextResponse.json({ error: "Enrollment required" }, { status: 403 });
  const released = session.status === "live" || (session.join_releases_at && new Date(session.join_releases_at).getTime() <= Date.now());
  if (!released || !session.join_url) return NextResponse.json({ error: "Join details are not available yet" }, { status: 403 });
  return NextResponse.json({ joinUrl: session.join_url }, { headers: { "Cache-Control": "no-store, private" } });
}
