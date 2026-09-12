import { NextResponse } from "next/server";
import { requireStudent } from "../../../lib/student-auth";

export const runtime = "edge";

export async function POST(request: Request) {
  try {
    const auth = await requireStudent(request);
    if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
    const { supabase, user } = auth;
    
    const body = await request.json();
    const { lessonId } = body;

    if (!lessonId) return NextResponse.json({ error: "Lesson ID is required" }, { status: 400 });

    // 1. Verify the lesson exists and user is enrolled in the course
    const { data: lesson, error: lessonError } = await supabase
      .from("course_lessons")
      .select("course_id")
      .eq("id", lessonId)
      .single();

    if (lessonError || !lesson) return NextResponse.json({ error: "Lesson not found" }, { status: 404 });

    const { data: enrollment } = await supabase
      .from("enrollments")
      .select("id")
      .eq("user_id", user.id)
      .eq("item_type", "COURSE")
      .eq("course_id", lesson.course_id)
      .single();

    if (!enrollment) return NextResponse.json({ error: "You are not enrolled in this course" }, { status: 403 });

    // 2. Upsert progress
    const now = new Date().toISOString();
    const { error: upsertError } = await supabase
      .from("lesson_progress")
      .upsert({
        user_id: user.id,
        lesson_id: lessonId,
        is_completed: true,
        completed_at: now,
      }, { onConflict: 'user_id,lesson_id' });

    if (upsertError) throw upsertError;

    // 3. Check for course completion
    const [allLessons, completedLessons] = await Promise.all([
      supabase.from("course_lessons").select("id", { count: "exact" }).eq("course_id", lesson.course_id),
      supabase.from("lesson_progress")
        .select("lesson_id", { count: "exact" })
        .eq("user_id", user.id)
        .eq("is_completed", true)
        .in("lesson_id", (await supabase.from("course_lessons").select("id").eq("course_id", lesson.course_id)).data?.map(l => l.id) || []),
    ]);

    const total = allLessons.count || 0;
    const completed = completedLessons.count || 0;
    
    let courseCompleted = false;
    // If all lessons are completed, check if certificate exists
    if (total > 0 && completed >= total) {
      courseCompleted = true;
      const { data: cert } = await supabase
        .from("certificates")
        .select("id")
        .eq("user_id", user.id)
        .eq("item_type", "COURSE")
        .eq("course_id", lesson.course_id)
        .single();
        
      if (!cert) {
        // Trigger certificate generation in background
        const origin = request.headers.get("origin") || process.env.NEXT_PUBLIC_SITE_URL || "https://www.devquestpk.com";
        const certUrl = new URL("/api/student/certificates/generate", origin);
        
        fetch(certUrl.toString(), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": request.headers.get("authorization") || "",
          },
          body: JSON.stringify({ itemType: "COURSE", courseId: lesson.course_id })
        }).catch(e => console.error("Auto cert gen failed", e));
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: "Progress updated",
      courseCompleted
    });
  } catch (error) {
    console.error("Progress error", error);
    return NextResponse.json({ error: "Could not update progress" }, { status: 500 });
  }
}
