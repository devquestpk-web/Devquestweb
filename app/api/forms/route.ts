import { NextResponse } from "next/server";
import { Resend } from "resend";
import { jobs } from "../../careers/jobs";
import { createTrackedApplication, createTrackingCredentials, trackingUrlForRequest } from "../../lib/application-tracking";
import { appendWebsiteFormSubmission, type WebsiteFormType } from "../../lib/google-sheets";

export const runtime = "nodejs";

const generalRecipient = process.env.FORM_RECIPIENT_EMAIL || "hello@devquestpk.com";
const applicationRecipient = process.env.FORM_APPLICATION_RECIPIENT_EMAIL || "careers@devquestpk.com";
const sender = process.env.FORM_FROM_EMAIL || "DevQuest PK <no-reply@devquestpk.com>";
const allowedForms = new Set<WebsiteFormType>(["contact", "ambassador", "career"]);
const allowedCareerPositions = new Set(jobs.map((job) => job.title));
const maxJsonBytes = 40_000;
const maxCvBytes = 5 * 1024 * 1024;
const maxMultipartBytes = maxCvBytes + 250_000;
const allowedCvExtensions = new Set(["pdf", "doc", "docx"]);
const allowedCvTypes = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/octet-stream",
]);

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

function safeFilename(filename: string) {
  const cleaned = filename.replace(/[^a-zA-Z0-9._() -]/g, "_").slice(0, 120);
  return cleaned || "application-cv.pdf";
}

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type")?.toLowerCase() || "";
    const isMultipart = contentType.startsWith("multipart/form-data");
    const contentLength = Number(request.headers.get("content-length") || 0);
    const maximumRequestSize = isMultipart ? maxMultipartBytes : maxJsonBytes;
    if (contentLength > maximumRequestSize) {
      return NextResponse.json({ error: isMultipart ? "The CV must be 5 MB or smaller." : "Application is too large." }, { status: 413 });
    }

    const origin = request.headers.get("origin");
    const host = request.headers.get("host");
    if (origin && host && new URL(origin).host !== host) {
      return NextResponse.json({ error: "Invalid form origin." }, { status: 403 });
    }

    let formType = "";
    let fields: Record<string, unknown> = {};
    let honeypot = "";
    let cv: File | null = null;

    if (isMultipart) {
      const formData = await request.formData();
      formType = clean(formData.get("formType"), 30).toLowerCase();
      honeypot = clean(formData.get("website"), 100);
      const rawFields = clean(formData.get("fields"), 30_000);

      try {
        const parsedFields: unknown = JSON.parse(rawFields);
        if (!parsedFields || typeof parsedFields !== "object" || Array.isArray(parsedFields)) {
          return NextResponse.json({ error: "Invalid application details." }, { status: 400 });
        }
        fields = parsedFields as Record<string, unknown>;
      } catch {
        return NextResponse.json({ error: "Invalid application details." }, { status: 400 });
      }

      const uploadedCv = formData.get("cv");
      if (uploadedCv instanceof File && uploadedCv.size > 0) cv = uploadedCv;
    } else {
      const body = await request.json();
      formType = clean(body.formType, 30).toLowerCase();
      fields = body.fields && typeof body.fields === "object" ? body.fields as Record<string, unknown> : {};
      honeypot = clean(body.website, 100);
    }

    if (honeypot) return NextResponse.json({ ok: true });
    if (!allowedForms.has(formType as WebsiteFormType)) return NextResponse.json({ error: "Unknown form." }, { status: 400 });
    const validFormType = formType as WebsiteFormType;
    const recipient = validFormType === "contact" ? generalRecipient : applicationRecipient;

    if ((validFormType === "ambassador" || validFormType === "career") && !cv) {
      return NextResponse.json({ error: "Please attach your CV." }, { status: 400 });
    }

    const position = clean(fields.position, 160);
    if (validFormType === "career" && !allowedCareerPositions.has(position)) {
      return NextResponse.json({ error: "Please select a valid open position." }, { status: 400 });
    }

    if (cv) {
      const extension = cv.name.split(".").pop()?.toLowerCase() || "";
      const cvType = cv.type || "application/octet-stream";
      if (!allowedCvExtensions.has(extension) || !allowedCvTypes.has(cvType)) {
        return NextResponse.json({ error: "Please attach a PDF, DOC, or DOCX file." }, { status: 415 });
      }
      if (cv.size > maxCvBytes) {
        return NextResponse.json({ error: "The CV must be 5 MB or smaller." }, { status: 413 });
      }
    }

    const name = clean(fields.fullName || fields.name, 120);
    const email = clean(fields.email, 180);
    if (!name || !/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json({ error: "Please provide a valid name and email." }, { status: 400 });
    }

    const safeFields: Array<readonly [string, string]> = Object.entries(fields)
      .map(([key, value]) => [clean(key, 60), clean(value)] as const)
      .filter(([, value]) => Boolean(value));
    const cvFilename = cv ? safeFilename(cv.name) : "";
    const cvContentType = cv?.type || "application/octet-stream";
    const cvContent = cv ? Buffer.from(await cv.arrayBuffer()) : null;
    if (cvFilename) safeFields.push(["cvAttachment", cvFilename]);

    const submissionId = crypto.randomUUID();
    let tracking: { code: string; url: string } | null = null;
    if (validFormType === "ambassador" || validFormType === "career") {
      const credentials = createTrackingCredentials(validFormType, submissionId);
      try {
        await createTrackedApplication({
          submissionId,
          type: validFormType,
          trackingCode: credentials.code,
          tokenHash: credentials.tokenHash,
          fullName: name,
          email,
          phone: clean(fields.whatsapp || fields.phone, 80),
          city: clean(fields.city, 100),
          position: validFormType === "career" ? position : "Campus Ambassador",
          fields: Object.fromEntries(safeFields),
          cvFilename,
        });
        tracking = { code: credentials.code, url: trackingUrlForRequest(request, credentials.token) };
      } catch (trackingError) {
        console.error("Application tracking creation error", trackingError);
        return NextResponse.json({ error: "We could not create your secure application tracker. Please try again.", code: "TRACKING_UNAVAILABLE" }, { status: 503 });
      }
    }

    const formTitle = validFormType === "ambassador"
      ? "Campus Ambassador Application"
      : validFormType === "career"
        ? `Career Application — ${position}`
        : "Website Enquiry";
    let sheetSynced = false;
    let sheetConfigured = false;
    try {
      const sheetResult = await appendWebsiteFormSubmission({
        formType: validFormType,
        submittedAt: new Date().toISOString(),
        submissionId,
        fields: Object.fromEntries(safeFields),
        sourcePage: clean(request.headers.get("referer"), 500),
        attachment: cvContent ? {
          filename: cvFilename,
          contentType: cvContentType,
          base64: cvContent.toString("base64"),
        } : undefined,
      });
      sheetConfigured = sheetResult.configured;
      sheetSynced = sheetResult.synced;
    } catch (sheetError) {
      console.error("Google Sheets form sync error", sheetError);
    }

    let emailSent = false;
    let applicantEmailSent = false;
    let emailWarning = "";
    const apiKey = process.env.RESEND_API_KEY;
    if (apiKey) {
      const rows = safeFields.map(([key, value]) => `
        <tr>
          <th style="padding:10px 12px;text-align:left;vertical-align:top;color:#40506b;border-bottom:1px solid #e6ebf2;">${escapeHtml(label(key))}</th>
          <td style="padding:10px 12px;white-space:pre-wrap;color:#0b193a;border-bottom:1px solid #e6ebf2;">${escapeHtml(value)}</td>
        </tr>`).join("");
      const resend = new Resend(apiKey);
      const { error } = await resend.emails.send({
        from: sender,
        to: recipient,
        replyTo: email,
        subject: `[DevQuest] ${formTitle} — ${name}`,
        html: `<div style="font-family:Arial,sans-serif;background:#f4f7fb;padding:30px;color:#0b193a;"><div style="max-width:720px;margin:auto;background:#fff;border:1px solid #dce5f0;border-radius:14px;overflow:hidden;"><div style="padding:24px 26px;background:#071426;color:#fff;"><small style="color:#7fe6ff;letter-spacing:.12em;font-weight:700;">DEVQUEST WEBSITE</small><h1 style="margin:8px 0 0;font-size:24px;">${formTitle}</h1></div><table style="width:100%;border-collapse:collapse;font-size:14px;">${rows}</table><p style="margin:0;padding:20px 26px;color:#67748c;font-size:12px;">Reply to this email to contact ${escapeHtml(name)} at ${escapeHtml(email)}.</p></div></div>`,
        attachments: cvContent ? [{
          filename: cvFilename,
          content: cvContent,
          contentType: cvContentType,
        }] : undefined,
      });
      if (error) {
        console.error("Resend form delivery error", error);
        emailWarning = validFormType === "contact"
          ? "Your enquiry was saved, but the DevQuest team email could not be delivered."
          : "Your application was saved, but the DevQuest team email could not be delivered.";
      } else emailSent = true;

      if (tracking) {
        const applicationLabel = validFormType === "career" ? position : "Campus Ambassador programme";
        const { error: applicantEmailError } = await resend.emails.send({
          from: sender,
          to: email,
          subject: `[DevQuest] Application received — ${tracking.code}`,
          html: `<div style="font-family:Arial,sans-serif;background:#f4f7fb;padding:30px;color:#0b193a"><div style="max-width:680px;margin:auto;background:#fff;border:1px solid #dce5f0;border-radius:14px;overflow:hidden"><div style="padding:24px 26px;background:#071426;color:#fff"><small style="color:#7fe6ff;letter-spacing:.12em;font-weight:700">DEVQUEST APPLICATION TRACKER</small><h1 style="margin:8px 0 0;font-size:24px">Application received</h1></div><div style="padding:26px"><p>Hello ${escapeHtml(name)},</p><p>We received your application for <strong>${escapeHtml(applicationLabel)}</strong>.</p><p style="padding:14px 16px;background:#edf5ff;border-radius:10px">Tracking ID: <strong>${escapeHtml(tracking.code)}</strong></p><p><a href="${escapeHtml(tracking.url)}" style="display:inline-block;padding:12px 18px;color:#fff;background:#175fe2;border-radius:8px;text-decoration:none;font-weight:700">View live application status</a></p><p style="color:#67748c;font-size:13px">Keep this private link safe. Anyone with the link can view your application status.</p></div></div></div>`,
        });
        if (applicantEmailError) {
          console.error("Applicant confirmation email error", applicantEmailError);
          emailWarning = "Your application was saved, but the confirmation email could not be delivered. Save your tracking ID to check the status later.";
        } else applicantEmailSent = true;
      }
    } else if (tracking) {
      emailWarning = "Your application was saved, but confirmation email is not configured. Save your tracking ID to check the status later.";
    }

    if (!tracking && !sheetSynced && !emailSent) {
      const code = sheetConfigured ? "DELIVERY_FAILED" : "DELIVERY_NOT_CONFIGURED";
      return NextResponse.json({ error: "We could not save your form. Please try again.", code }, { status: 503 });
    }

    return NextResponse.json({ ok: true, sheetSynced, emailSent, applicantEmailSent, emailWarning: emailWarning || undefined, tracking });
  } catch (error) {
    console.error("Form delivery error", error);
    return NextResponse.json({ error: "We could not send your form. Please try again." }, { status: 500 });
  }
}
