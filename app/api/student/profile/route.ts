import { NextResponse } from "next/server";
import { requireStudent } from "../../../lib/student-auth";

export const runtime = "edge";

export async function GET(request: Request) {
  try {
    const auth = await requireStudent(request);
    if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
    const { supabase, user } = auth;

    // Fetch base profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("student_id, full_name, phone, city, university, degree, semester, github_url, linkedin_url, discord_handle, bio, skills, avatar_url, profile_completed, email_notifications, marketing_emails")
      .eq("id", user.id)
      .single();

    if (profileError) throw profileError;

    // Fetch stats
    const [enrollments, tickets, certificates, completed_lessons] = await Promise.all([
      supabase.from("enrollments").select("id", { count: "exact" }).eq("user_id", user.id),
      supabase.from("tickets").select("id", { count: "exact" }).eq("user_id", user.id),
      supabase.from("certificates").select("id", { count: "exact" }).eq("user_id", user.id),
      supabase.from("lesson_progress").select("user_id", { count: "exact" }).eq("user_id", user.id).eq("is_completed", true),
    ]);

    return NextResponse.json({
      profile,
      stats: {
        enrollments: enrollments.count || 0,
        tickets: tickets.count || 0,
        certificates: certificates.count || 0,
        completed_lessons: completed_lessons.count || 0,
      }
    });
  } catch (error) {
    return NextResponse.json({ error: "Could not fetch profile" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const auth = await requireStudent(request);
    if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
    
    const body = await request.json();
    const { full_name, phone, city, university, degree, semester, github_url, linkedin_url, discord_handle, bio, skills, avatar_url, email_notifications, marketing_emails } = body;
    const clean = (value: unknown, max: number) => value ? String(value).trim().slice(0, max) : null;
    const fullName = clean(full_name, 120) || "";
    const normalizedUniversity = clean(university, 180);
    const normalizedDegree = clean(degree, 180);

    const { error } = await auth.supabase
      .from("profiles")
      .update({
        full_name: fullName,
        phone: clean(phone, 40), city: clean(city, 100), university: normalizedUniversity,
        degree: normalizedDegree, semester: clean(semester, 60),
        github_url: clean(github_url, 300), linkedin_url: clean(linkedin_url, 300),
        discord_handle: clean(discord_handle, 100), bio: clean(bio, 1000),
        skills: Array.isArray(skills) ? skills.map((skill) => String(skill).slice(0, 60)).slice(0, 30) : [],
        avatar_url: clean(avatar_url, 500),
        profile_completed: Boolean(fullName && normalizedUniversity && normalizedDegree),
        ...(typeof email_notifications === "boolean" ? { email_notifications } : {}),
        ...(typeof marketing_emails === "boolean" ? { marketing_emails } : {}),
      })
      .eq("id", auth.user.id);

    if (error) throw error;
    return NextResponse.json({ message: "Profile updated successfully" });
  } catch (error) {
    return NextResponse.json({ error: "Could not update profile" }, { status: 500 });
  }
}
