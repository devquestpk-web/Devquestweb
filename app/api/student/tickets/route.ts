import { NextResponse } from "next/server";
import { requireStudent } from "../../../lib/student-auth";

export const runtime = "edge";

export async function GET(request: Request) {
  try {
    const auth = await requireStudent(request);
    if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
    const { supabase, user } = auth;

    // Fetch tickets with joined course/webinar details
    const { data: tickets, error: ticketsError } = await supabase
      .from("tickets")
      .select(`
        *,
        courses:course_id(title, slug),
        webinars:webinar_id(title, slug, start_time, venue)
      `)
      .eq("user_id", user.id)
      .order("issued_at", { ascending: false });

    if (ticketsError) throw ticketsError;

    return NextResponse.json({ tickets });
  } catch (error) {
    return NextResponse.json({ error: "Could not fetch tickets" }, { status: 500 });
  }
}
