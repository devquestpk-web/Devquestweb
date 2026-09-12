import { NextResponse } from "next/server";
import { requireStudent } from "../../../lib/student-auth";

export const runtime = "edge";

export async function GET(request: Request) {
  try {
    const auth = await requireStudent(request);
    if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
    const { supabase, user } = auth;

    // Fetch user's enrollments to determine access
    const { data: enrollments, error: enrollmentsError } = await supabase
      .from("enrollments")
      .select("item_type, course_id, webinar_id")
      .eq("user_id", user.id);

    if (enrollmentsError) throw enrollmentsError;
    
    if (!enrollments || enrollments.length === 0) {
      return NextResponse.json({ resources: [] });
    }

    const courseIds = enrollments.filter(e => e.item_type === "COURSE").map(e => e.course_id);
    const webinarIds = enrollments.filter(e => e.item_type === "WEBINAR").map(e => e.webinar_id);

    // Build the query to get resources for enrolled courses and webinars
    let query = supabase.from("resources").select(`
      *,
      courses:course_id(title),
      webinars:webinar_id(title)
    `);

    // Add OR condition for the accessible items
    const orConditions = [];
    if (courseIds.length > 0) orConditions.push(`course_id.in.(${courseIds.join(',')})`);
    if (webinarIds.length > 0) orConditions.push(`webinar_id.in.(${webinarIds.join(',')})`);
    
    if (orConditions.length > 0) {
      query = query.or(orConditions.join(','));
    } else {
      return NextResponse.json({ resources: [] });
    }

    const { data: resources, error: resourcesError } = await query;

    if (resourcesError) throw resourcesError;

    // We don't send the raw fileUrl to the client. The client will hit the detail route to get a signed URL.
    const safeResources = resources.map(r => ({
      id: r.id,
      title: r.title,
      file_type: r.file_type,
      item_type: r.item_type,
      source_title: r.item_type === "COURSE" ? r.courses?.title : r.webinars?.title
    }));

    return NextResponse.json({ resources: safeResources });
  } catch (error) {
    return NextResponse.json({ error: "Could not fetch resources" }, { status: 500 });
  }
}
