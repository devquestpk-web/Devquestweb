import { NextResponse } from "next/server";
import { requireStudent } from "../../../lib/student-auth";

export const runtime = "edge";

export async function GET(request: Request) {
  try {
    const auth = await requireStudent(request);
    if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
    const { supabase, user } = auth;

    const { data: webinars, error: webinarsError } = await supabase
      .from("webinars")
      .select("*")
      .eq("is_published", true)
      .order("start_time", { ascending: true });

    if (webinarsError) throw webinarsError;

    const { data: enrollments, error: enrollmentsError } = await supabase
      .from("enrollments")
      .select("webinar_id")
      .eq("user_id", user.id)
      .eq("item_type", "WEBINAR");

    if (enrollmentsError) throw enrollmentsError;
    
    const enrolledIds = new Set(enrollments.map((e) => e.webinar_id));

    const mappedWebinars = webinars.map((webinar) => ({
      ...webinar,
      isRegistered: enrolledIds.has(webinar.id),
      meeting_link: enrolledIds.has(webinar.id) ? webinar.meeting_link : null,
    }));

    const now = new Date().getTime();
    const upcoming = mappedWebinars.filter(w => new Date(w.start_time).getTime() > now);
    const past = mappedWebinars.filter(w => new Date(w.start_time).getTime() <= now);

    return NextResponse.json({ upcoming, past });
  } catch (error) {
    return NextResponse.json({ error: "Could not fetch webinars" }, { status: 500 });
  }
}
