import { NextResponse } from "next/server";
import { Resend } from "resend";

const recipient = process.env.FORM_RECIPIENT_EMAIL || "devquestpk@gmail.com";
const sender = process.env.FORM_FROM_EMAIL || "DevQuest Website <onboarding@resend.dev>";
const allowedForms = new Set(["contact", "ambassador"]);

function clean(value: unknown, maxLength = 4000) {
  return String(value ?? "").trim().slice(0, maxLength);
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function label(key: string) {
  return key.replace(/([A-Z])/g, " $1").replace(/^./, (character) => character.toUpperCase());
}

export async function POST(request: Request) {
  try {
    const contentLength = Number(request.headers.get("content-length") || 0);
    if (contentLength > 40_000) return NextResponse.json({ error: "Application is too large." }, { status: 413 });

    const origin = request.headers.get("origin");
    const host = request.headers.get("host");
    if (origin && host && new URL(origin).host !== host) {
      return NextResponse.json({ error: "Invalid form origin." }, { status: 403 });
    }

    const body = await request.json();
    const formType = clean(body.formType, 30).toLowerCase();
    const fields = body.fields && typeof body.fields === "object" ? body.fields as Record<string, unknown> : {};
    const honeypot = clean(body.website, 100);
    if (honeypot) return NextResponse.json({ ok: true });
    if (!allowedForms.has(formType)) return NextResponse.json({ error: "Unknown form." }, { status: 400 });

    const name = clean(fields.fullName || fields.name, 120);
    const email = clean(fields.email, 180);
    if (!name || !/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json({ error: "Please provide a valid name and email." }, { status: 400 });
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Email delivery is not configured yet.", code: "MAIL_NOT_CONFIGURED" }, { status: 503 });
    }

    const safeFields = Object.entries(fields)
      .map(([key, value]) => [clean(key, 60), clean(value)] as const)
      .filter(([, value]) => value);
    const rows = safeFields.map(([key, value]) => `
      <tr>
        <th style="padding:10px 12px;text-align:left;vertical-align:top;color:#40506b;border-bottom:1px solid #e6ebf2;">${escapeHtml(label(key))}</th>
        <td style="padding:10px 12px;white-space:pre-wrap;color:#0b193a;border-bottom:1px solid #e6ebf2;">${escapeHtml(value)}</td>
      </tr>`).join("");
    const formTitle = formType === "ambassador" ? "Campus Ambassador Application" : "Website Enquiry";
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from: sender,
      to: recipient,
      replyTo: email,
      subject: `[DevQuest] ${formTitle} — ${name}`,
      html: `<div style="font-family:Arial,sans-serif;background:#f4f7fb;padding:30px;color:#0b193a;"><div style="max-width:720px;margin:auto;background:#fff;border:1px solid #dce5f0;border-radius:14px;overflow:hidden;"><div style="padding:24px 26px;background:#071426;color:#fff;"><small style="color:#7fe6ff;letter-spacing:.12em;font-weight:700;">DEVQUEST WEBSITE</small><h1 style="margin:8px 0 0;font-size:24px;">${formTitle}</h1></div><table style="width:100%;border-collapse:collapse;font-size:14px;">${rows}</table><p style="margin:0;padding:20px 26px;color:#67748c;font-size:12px;">Reply to this email to contact ${escapeHtml(name)} at ${escapeHtml(email)}.</p></div></div>`,
    });

    if (error) {
      console.error("Resend form delivery error", error);
      return NextResponse.json({ error: "We could not send your form. Please try again." }, { status: 502 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Form delivery error", error);
    return NextResponse.json({ error: "We could not send your form. Please try again." }, { status: 500 });
  }
}
