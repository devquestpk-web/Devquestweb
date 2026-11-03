import type { SupabaseClient } from "@supabase/supabase-js";

export type CertificateScope = { itemType: "COURSE" | "WEBINAR"; courseId?: string | null; webinarId?: string | null; sessionId?: string | null };
export type EligibilityResult = { eligible: boolean; reason: string; snapshot: Record<string, unknown> };

export async function evaluateCertificateEligibility(supabase: SupabaseClient, userId: string, scope: CertificateScope, rules: Record<string, unknown> = {}): Promise<EligibilityResult> {
  if (scope.sessionId) {
    const { data: session } = await supabase.from("event_sessions").select("id, status, webinar_id, course_id").eq("id", scope.sessionId).is("deleted_at", null).maybeSingle();
    if (!session || session.status !== "completed") return { eligible: false, reason: "The session must be completed", snapshot: { sessionId: scope.sessionId } };
    const { data: attendance } = await supabase.from("session_attendance").select("status, source, checked_in_at").eq("session_id", scope.sessionId).eq("user_id", userId).in("status", ["present", "late"]).maybeSingle();
    return attendance
      ? { eligible: true, reason: "Verified session attendance", snapshot: { sessionId: scope.sessionId, attendance } }
      : { eligible: false, reason: "Verified session attendance is required", snapshot: { sessionId: scope.sessionId } };
  }
  if (scope.itemType === "COURSE" && scope.courseId) {
    const { data: lessons } = await supabase.from("course_lessons").select("id").eq("course_id", scope.courseId);
    if (!lessons?.length) return { eligible: false, reason: "This course has no certificate-eligible lessons", snapshot: { requiredLessons: 0 } };
    const lessonIds = lessons.map((lesson) => lesson.id);
    const { count } = await supabase.from("lesson_progress").select("lesson_id", { count: "exact", head: true }).eq("user_id", userId).eq("is_completed", true).in("lesson_id", lessonIds);
    const completed = count || 0;
    return { eligible: completed >= lessonIds.length, reason: completed >= lessonIds.length ? "Course completed" : "Course completion is required", snapshot: { requiredLessons: lessonIds.length, completedLessons: completed } };
  }
  if (scope.itemType === "WEBINAR" && scope.webinarId) {
    const { data: sessions } = await supabase.from("event_sessions").select("id").eq("webinar_id", scope.webinarId).eq("status", "completed").is("deleted_at", null);
    if (!sessions?.length) return { eligible: false, reason: "No completed event sessions were found", snapshot: { completedSessions: 0 } };
    const { data: attendance } = await supabase.from("session_attendance").select("session_id, status").eq("user_id", userId).in("session_id", sessions.map((session) => session.id)).in("status", ["present", "late"]);
    const attended = new Set((attendance || []).map((entry) => entry.session_id)).size;
    const requiredPercent = Math.min(100, Math.max(0, Number(rules.minimumAttendancePercent ?? (rules.requireAllSessions === false ? 1 : 100))));
    const percent = Math.round((attended / sessions.length) * 100);
    return { eligible: percent >= requiredPercent, reason: percent >= requiredPercent ? "Attendance requirement met" : `At least ${requiredPercent}% attendance is required`, snapshot: { completedSessions: sessions.length, attendedSessions: attended, attendancePercent: percent, requiredPercent } };
  }
  return { eligible: false, reason: "Invalid certificate scope", snapshot: {} };
}

export async function resolveCertificateTemplate(supabase: SupabaseClient, scope: CertificateScope) {
  const filters: Array<[string, string]> = scope.sessionId ? [["session_id", scope.sessionId]] : scope.courseId ? [["course_id", scope.courseId]] : scope.webinarId ? [["webinar_id", scope.webinarId]] : [];
  for (const [column, value] of filters) {
    const { data } = await supabase.from("certificate_templates").select("id, config, eligibility_rules").eq(column, value).eq("is_active", true).order("updated_at", { ascending: false }).limit(1).maybeSingle();
    if (data) return data;
  }
  const { data } = await supabase.from("certificate_templates").select("id, config, eligibility_rules").eq("scope_type", "DEFAULT").eq("is_active", true).order("updated_at", { ascending: false }).limit(1).maybeSingle();
  return data;
}
