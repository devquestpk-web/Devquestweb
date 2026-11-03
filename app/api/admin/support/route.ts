import { NextResponse } from "next/server";
import { requireAdmin } from "../../../lib/supabase-admin";

export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { data, error } = await auth.supabase.from("support_tickets").select("*, profiles(full_name, student_id), support_messages(*)").order("updated_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ tickets: data || [] });
}

export async function POST(request: Request) {
  const auth = await requireAdmin(request);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const body = await request.json();
  const ticketId = String(body.ticketId || "");
  const message = String(body.message || "").trim().slice(0, 5000);
  if (!ticketId || !message) return NextResponse.json({ error: "Ticket and message are required" }, { status: 400 });
  const { error } = await auth.supabase.from("support_messages").insert({ ticket_id: ticketId, author_id: auth.user.id, body: message, is_internal: Boolean(body.internal) });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (body.status) await auth.supabase.from("support_tickets").update({ status: body.status, updated_at: new Date().toISOString() }).eq("id", ticketId);
  await auth.supabase.from("admin_audit_logs").insert({ actor_id: auth.user.id, action: "support.replied", entity_type: "support_tickets", entity_id: ticketId, details: { internal: Boolean(body.internal) } });
  return NextResponse.json({ ok: true });
}
