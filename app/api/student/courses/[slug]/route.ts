import { NextResponse } from "next/server";
import { requireStudent } from "../../../../lib/student-auth";

export const runtime = "edge";

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const auth = await requireStudent(request);
    if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
    const { supabase, user } = auth;

    // Fetch course
    const { data: course, error: courseError } = await supabase
      .from("courses")
      .select("*")
      .eq("slug", slug)
      .eq("is_published", true)
      .single();

    if (courseError || !course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // Check enrollment
    const { data: enrollment } = await supabase
      .from("enrollments")
      .select("id")
      .eq("user_id", user.id)
      .eq("item_type", "COURSE")
      .eq("course_id", course.id)
      .single();
    
    const isEnrolled = !!enrollment;

    // Fetch lessons
    const { data: lessons, error: lessonsError } = await supabase
      .from("course_lessons")
      .select("*")
      .eq("course_id", course.id)
      .order("order_index", { ascending: true });

    if (lessonsError) throw lessonsError;

    let progress: Record<string, boolean> = {};

    // If enrolled, fetch lesson progress
    if (isEnrolled && lessons && lessons.length > 0) {
      const { data: progressData } = await supabase
        .from("lesson_progress")
        .select("lesson_id, is_completed")
        .eq("user_id", user.id)
        .in("lesson_id", lessons.map(l => l.id));
      
      if (progressData) {
        progressData.forEach(p => {
          progress[p.lesson_id] = p.is_completed;
        });
      }
    }

    // If not enrolled, mask the video URLs
    const safeLessons = lessons?.map(l => ({
      ...l,
      video_url: isEnrolled ? l.video_url : null,
    }));

    return NextResponse.json({
      course,
      isEnrolled,
      lessons: safeLessons,
      progress
    });
  } catch (error) {
    return NextResponse.json({ error: "Could not fetch course details" }, { status: 500 });
  }
}
