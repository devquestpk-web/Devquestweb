import { NextResponse } from "next/server";
import { requireStudent } from "../../../../lib/student-auth";

export const runtime = "edge";

export async function GET(request: Request, { params }: { params: { slug: string } }) {
  try {
    const auth = await requireStudent(request);
    if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
    const { supabase, user } = auth;

    // Fetch webinar
    const { data: webinar, error: webinarError } = await supabase
      .from("webinars")
      .select("*")
      .eq("slug", params.slug)
      .eq("is_published", true)
      .single();

    if (webinarError || !webinar) {
      return NextResponse.json({ error: "Webinar not found" }, { status: 404 });
    }

    // Check registration
    const { data: enrollment } = await supabase
      .from("enrollments")
      .select("id")
      .eq("user_id", user.id)
      .eq("item_type", "WEBINAR")
      .eq("webinar_id", webinar.id)
      .single();
    
    const isRegistered = !!enrollment;

    // Mask meeting link if not registered
    const safeWebinar = {
      ...webinar,
      meeting_link: isRegistered ? webinar.meeting_link : null,
    };

    return NextResponse.json({
      webinar: safeWebinar,
      isRegistered
    });
  } catch (error) {
    return NextResponse.json({ error: "Could not fetch webinar details" }, { status: 500 });
  }
}
