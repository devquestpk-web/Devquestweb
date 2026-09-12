import { NextResponse } from "next/server";
import { requireStudent } from "../../../lib/student-auth";

export const runtime = "edge";

export async function GET(request: Request) {
  try {
    const auth = await requireStudent(request);
    if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
    const { supabase, user } = auth;

    // Fetch all published courses
    const { data: courses, error: coursesError } = await supabase
      .from("courses")
      .select("*")
      .eq("is_published", true)
      .order("created_at", { ascending: false });

    if (coursesError) throw coursesError;

    // Fetch user's enrollments to determine status
    const { data: enrollments, error: enrollmentsError } = await supabase
      .from("enrollments")
      .select("course_id")
      .eq("user_id", user.id)
      .eq("item_type", "COURSE");

    if (enrollmentsError) throw enrollmentsError;
    
    const enrolledIds = new Set(enrollments.map((e) => e.course_id));

    // Combine
    const mappedCourses = courses.map((course) => ({
      ...course,
      isEnrolled: enrolledIds.has(course.id),
    }));

    return NextResponse.json({ courses: mappedCourses });
  } catch (error) {
    return NextResponse.json({ error: "Could not fetch courses" }, { status: 500 });
  }
}
