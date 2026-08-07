import { NextResponse } from "next/server";
import { requireAdmin } from "../../../lib/supabase-admin";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const auth = await requireAdmin(request);
    if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
    const [{ data: users, error: usersError }, { data: profiles, error: profileError }] = await Promise.all([
      auth.supabase.auth.admin.listUsers({ page: 1, perPage: 500 }),
      auth.supabase.from("profiles").select("id, full_name, role, department, job_title, phone, bio, is_active, created_at").order("created_at"),
    ]);
    if (usersError || profileError) throw usersError || profileError;
    const profileMap = new Map((profiles ?? []).map((profile) => [profile.id, profile]));
    return NextResponse.json({ members: users.users.map((user) => ({ id: user.id, email: user.email, lastSignInAt: user.last_sign_in_at, ...profileMap.get(user.id) })) });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Could not load members" }, { status: 500 }); }
}

export async function POST(request: Request) {
  try {
    const auth = await requireAdmin(request);
    if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
    const body = await request.json();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    const fullName = String(body.fullName || "").trim();
    if (!email || !fullName || password.length < 8) return NextResponse.json({ error: "Name, email, and a password of at least 8 characters are required." }, { status: 400 });
    const { data, error } = await auth.supabase.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { full_name: fullName } });
    if (error || !data.user) throw error || new Error("Account could not be created");
    const { error: profileError } = await auth.supabase.from("profiles").update({ full_name: fullName, role: "team", department: String(body.department || "").trim() || null, job_title: String(body.jobTitle || "").trim() || null, is_active: true }).eq("id", data.user.id);
    if (profileError) throw profileError;
    return NextResponse.json({ member: { id: data.user.id, email }, message: "Account created. Share the temporary password securely and ask the member to change it after signing in." }, { status: 201 });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Could not create account" }, { status: 500 }); }
}

export async function PATCH(request: Request) {
  try {
    const auth = await requireAdmin(request);
    if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
    const body = await request.json(); const id = String(body.id || "");
    if (!id) return NextResponse.json({ error: "Member id is required." }, { status: 400 });
    const profileChanges: Record<string, unknown> = {};
    for (const [source, target] of [["fullName", "full_name"], ["department", "department"], ["jobTitle", "job_title"], ["phone", "phone"], ["bio", "bio"], ["isActive", "is_active"]] as const) if (source in body) profileChanges[target] = body[source];
    if (body.role === "team") profileChanges.role = "team";
    if (Object.keys(profileChanges).length) { const { error } = await auth.supabase.from("profiles").update(profileChanges).eq("id", id); if (error) throw error; }
    const authChanges: { password?: string; ban_duration?: string } = {};
    if (body.password) { if (String(body.password).length < 8) return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 }); authChanges.password = String(body.password); }
    if ("isActive" in body) authChanges.ban_duration = body.isActive ? "none" : "876000h";
    if (Object.keys(authChanges).length) { const { error } = await auth.supabase.auth.admin.updateUserById(id, authChanges); if (error) throw error; }
    return NextResponse.json({ message: "Member access updated." });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Could not update account" }, { status: 500 }); }
}
