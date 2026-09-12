import { NextResponse } from "next/server";
import { requireStudent } from "../../../lib/student-auth";

export const runtime = "edge";

export async function GET(request: Request) {
  try {
    const auth = await requireStudent(request);
    if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
    const { supabase, user } = auth;

    const { data: certificates, error: certificatesError } = await supabase
      .from("certificates")
      .select(`
        *,
        courses:course_id(title, slug),
        webinars:webinar_id(title, slug)
      `)
      .eq("user_id", user.id)
      .order("issued_at", { ascending: false });

    if (certificatesError) throw certificatesError;

    return NextResponse.json({ certificates });
  } catch (error) {
    return NextResponse.json({ error: "Could not fetch certificates" }, { status: 500 });
  }
}
