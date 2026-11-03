import { Resend } from "resend";

const allowedVariables = new Set([
  "student_name", "student_id", "event_title", "session_title", "session_date",
  "join_url", "portal_url", "certificate_url", "support_subject", "support_message",
]);

export function escapeHtml(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

export function renderTemplate(source: string, variables: Record<string, unknown>, html = false) {
  return source.replace(/\{\{([a-z_]+)\}\}/g, (_match, key: string) => {
    if (!allowedVariables.has(key)) return "";
    const value = String(variables[key] ?? "");
    return html ? escapeHtml(value) : value.replace(/[\r\n]+/g, " ");
  });
}

export function brandedEmail(content: string) {
  return `<div style="margin:0;background:#f4f7fb;padding:32px 16px;font-family:Arial,sans-serif;color:#0b193a"><div style="max-width:680px;margin:auto;background:#fff;border:1px solid #dce5f0;border-radius:16px;overflow:hidden"><div style="padding:24px 28px;background:#071426;color:#fff"><div style="color:#7fe6ff;font-size:12px;font-weight:700;letter-spacing:.14em">DEVQUEST PK</div><div style="margin-top:8px;font-size:24px;font-weight:700">Learn. Build. Lead.</div></div><div style="padding:28px;line-height:1.65">${content}</div><div style="padding:18px 28px;background:#f7f9fc;color:#67748c;font-size:12px">This operational message was sent by DevQuest PK. Manage optional email preferences in your Student Portal.</div></div></div>`;
}

export async function sendBrandedEmail(input: { to: string; subject: string; html: string }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || process.env.FORM_FROM_EMAIL;
  if (!apiKey || !from) throw new Error("Email delivery is not configured");
  const resend = new Resend(apiKey);
  const { data, error } = await resend.emails.send({
    from,
    to: input.to,
    replyTo: process.env.EMAIL_REPLY_TO || undefined,
    subject: input.subject,
    html: brandedEmail(input.html),
  });
  if (error) throw new Error(error.message);
  return data?.id || null;
}
