import { NextResponse } from "next/server";
import { requireStudent } from "../../../lib/student-auth";

export async function GET(request: Request) {
  const auth = await requireStudent(request);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { data, error } = await auth.supabase.from("support_tickets").select("id, subject, category, priority, status, created_at, updated_at, support_messages(id, body, author_id, created_at, is_internal)").eq("user_id", auth.user.id).eq("support_messages.is_internal", false).order("updated_at", { ascending: false });
  if (error) return NextResponse.json({ error: "Could not load support requests" }, { status: 500 });
  return NextResponse.json({ tickets: data || [] });
}

export async function POST(request: Request) {
  const auth = await requireStudent(request);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const body = await request.json();
  const subject = String(body.subject || "").trim().slice(0, 180);
  const message = String(body.message || "").trim().slice(0, 5000);
  if (subject.length < 3 || !message) return NextResponse.json({ error: "Subject and message are required" }, { status: 400 });
  const { data: ticket, error } = await auth.supabase.from("support_tickets").insert({ user_id: auth.user.id, subject, category: String(body.category || "general").slice(0, 40) }).select("id").single();
  if (error || !ticket) return NextResponse.json({ error: "Could not create support request" }, { status: 500 });
  const { error: messageError } = await auth.supabase.from("support_messages").insert({ ticket_id: ticket.id, author_id: auth.user.id, body: message });
  if (messageError) return NextResponse.json({ error: "Support request was created without its message" }, { status: 500 });
  return NextResponse.json({ ok: true, ticketId: ticket.id }, { status: 201 });
}
