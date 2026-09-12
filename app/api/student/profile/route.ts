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
      .select("full_name, phone, city, github_url, linkedin_url, discord_handle, bio, skills, avatar_url")
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
    const { full_name, phone, city, github_url, linkedin_url, discord_handle, bio, skills, avatar_url } = body;

    const { error } = await auth.supabase
      .from("profiles")
      .update({
        full_name: String(full_name || "").trim(),
        phone: phone ? String(phone).trim() : null,
        city: city ? String(city).trim() : null,
        github_url: github_url ? String(github_url).trim() : null,
        linkedin_url: linkedin_url ? String(linkedin_url).trim() : null,
        discord_handle: discord_handle ? String(discord_handle).trim() : null,
        bio: bio ? String(bio).trim() : null,
        skills: Array.isArray(skills) ? skills : [],
        avatar_url: avatar_url ? String(avatar_url).trim() : null,
      })
      .eq("id", auth.user.id);

    if (error) throw error;
    return NextResponse.json({ message: "Profile updated successfully" });
  } catch (error) {
    return NextResponse.json({ error: "Could not update profile" }, { status: 500 });
  }
}
