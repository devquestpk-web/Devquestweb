import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "../../../lib/supabase-admin";

export const runtime = "nodejs";

function verify(raw: string, request: Request) {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  const id = request.headers.get("svix-id"); const timestamp = request.headers.get("svix-timestamp"); const signatures = request.headers.get("svix-signature");
  if (!secret || !id || !timestamp || !signatures) return false;
  if (Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return false;
  const key = Buffer.from(secret.replace(/^whsec_/, ""), "base64");
  const expected = createHmac("sha256", key).update(`${id}.${timestamp}.${raw}`).digest("base64");
  return signatures.split(" ").some((part) => { const candidate = part.replace(/^v1,/, ""); const left = Buffer.from(expected); const right = Buffer.from(candidate); return left.length === right.length && timingSafeEqual(left, right); });
}

export async function POST(request: Request) {
  const raw = await request.text();
  if (!verify(raw, request)) return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 });
  const event = JSON.parse(raw) as { type?: string; data?: { email_id?: string; to?: string[] } };
  const messageId = event.data?.email_id || ""; const recipient = event.data?.to?.[0]?.toLowerCase() || "";
  const status = event.type?.replace("email.", "") || "unknown";
  const supabase = getSupabaseAdminClient();
  const { data: notification } = await supabase.from("notification_outbox").select("id").eq("provider_message_id", messageId).maybeSingle();
  if (recipient) await supabase.from("email_delivery_logs").insert({ notification_id: notification?.id || null, provider_message_id: messageId || null, recipient_email: recipient, status, provider_event: event });
  if (notification && ["delivered", "bounced", "complained", "failed"].includes(status)) await supabase.from("notification_outbox").update({ status: status === "delivered" ? "delivered" : "failed", last_error: status === "delivered" ? null : `Provider reported ${status}` }).eq("id", notification.id);
  if (recipient && ["bounced", "complained"].includes(status)) await supabase.from("email_suppressions").upsert({ email: recipient, reason: status, source: "resend" });
  return NextResponse.json({ ok: true });
}
