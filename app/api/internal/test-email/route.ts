import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { Resend } from "resend";

export const runtime = "nodejs";

function validWorkerSecret(request: Request) {
  const configured = process.env.BACKGROUND_WORKER_SECRET;
  const supplied = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!configured || !supplied) return false;
  const left = Buffer.from(configured);
  const right = Buffer.from(supplied);
  return left.length === right.length && timingSafeEqual(left, right);
}

export async function POST(request: Request) {
  if (!validWorkerSecret(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  const to = process.env.EMAIL_REPLY_TO;
  if (!apiKey || !from || !to) return NextResponse.json({ error: "Email delivery is not configured" }, { status: 503 });

  try {
    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.send({
      from,
      to,
      subject: "DevQuest PK email delivery test",
      html: "<p>This is a protected DevQuest PK email delivery test.</p>",
    });
    if (error) {
      console.error("Test email delivery failed", error);
      return NextResponse.json({ error: "Test email delivery failed" }, { status: 502 });
    }
    return NextResponse.json({ ok: true, messageId: data?.id ?? null });
  } catch (error) {
    console.error("Test email delivery failed", error);
    return NextResponse.json({ error: "Test email delivery failed" }, { status: 502 });
  }
}
