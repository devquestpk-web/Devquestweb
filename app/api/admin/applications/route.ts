import { NextResponse } from "next/server";
import { Resend } from "resend";
import { applicationStatusLabels, isApplicationStatus } from "../../../lib/application-tracking";
import { requireAdmin } from "../../../lib/supabase-admin";

export const runtime = "nodejs";

const sender = process.env.FORM_FROM_EMAIL || "DevQuest PK <no-reply@devquestpk.com>";

function clean(value: unknown, maxLength: number) {
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

export async function GET(request: Request) {
  try {
    const auth = await requireAdmin(request);
    if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
    const { data, error } = await auth.supabase
      .from("applications")
      .select("id, tracking_code, application_type, full_name, email, phone, city, position, details, cv_filename, status, public_note, created_at, status_updated_at")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw error;
    return NextResponse.json({ applications: data ?? [] });
  } catch (error) {
    console.error("Admin applications list error", error);
    return NextResponse.json({ error: "Could not load applications." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const auth = await requireAdmin(request);
    if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
    const body = await request.json();
    const id = clean(body.id, 80);
    const status = clean(body.status, 30);
    const publicNote = clean(body.publicNote, 1000);
    if (!id || !isApplicationStatus(status)) {
      return NextResponse.json({ error: "A valid application and status are required." }, { status: 400 });
    }

    const { data: current, error: currentError } = await auth.supabase
      .from("applications")
      .select("id, tracking_code, application_type, full_name, email, position, status, public_note")
      .eq("id", id)
      .single();
    if (currentError) throw currentError;

    const statusChanged = current.status !== status;
    const noteChanged = (current.public_note || "") !== publicNote;
    if (!statusChanged && !noteChanged) {
      return NextResponse.json({ message: "No application changes were needed.", application: current, emailSent: false });
    }

    const { data: application, error: updateError } = await auth.supabase
      .from("applications")
      .update({ status, public_note: publicNote || null })
      .eq("id", id)
      .select("id, tracking_code, application_type, full_name, email, position, status, public_note, status_updated_at")
      .single();
    if (updateError) throw updateError;

    const { error: historyError } = await auth.supabase.from("application_status_history").insert({
      application_id: id,
      status,
      public_note: publicNote || null,
      changed_by: auth.user.id,
    });
    if (historyError) throw historyError;

    let emailSent = false;
    let emailWarning = "";
    if (statusChanged && process.env.RESEND_API_KEY) {
      const statusLabel = applicationStatusLabels[status];
      const applicationLabel = application.application_type === "career"
        ? application.position || "Career application"
        : "Campus Ambassador application";
      const { error: emailError } = await new Resend(process.env.RESEND_API_KEY).emails.send({
        from: sender,
        to: application.email,
        subject: `[DevQuest] Application update — ${statusLabel}`,
        html: `<div style="font-family:Arial,sans-serif;background:#f4f7fb;padding:30px;color:#0b193a"><div style="max-width:680px;margin:auto;background:#fff;border:1px solid #dce5f0;border-radius:14px;overflow:hidden"><div style="padding:24px 26px;background:#071426;color:#fff"><small style="color:#7fe6ff;letter-spacing:.12em;font-weight:700">DEVQUEST APPLICATION UPDATE</small><h1 style="margin:8px 0 0;font-size:24px">${escapeHtml(statusLabel)}</h1></div><div style="padding:26px"><p>Hello ${escapeHtml(application.full_name)},</p><p>Your <strong>${escapeHtml(applicationLabel)}</strong> status has been updated.</p><p style="padding:14px 16px;background:#edf5ff;border-radius:10px"><strong>${escapeHtml(statusLabel)}</strong></p>${application.public_note ? `<p>${escapeHtml(application.public_note)}</p>` : ""}<p style="color:#67748c;font-size:13px">Tracking ID: ${escapeHtml(application.tracking_code)}. Use the private tracking link from your original confirmation to view the complete timeline.</p></div></div></div>`,
      });
      if (emailError) {
        console.error("Application status email error", emailError);
        emailWarning = "Status saved, but the applicant email could not be sent.";
      } else emailSent = true;
    }

    return NextResponse.json({
      message: emailWarning || (emailSent ? "Status updated and applicant notified." : "Application status updated."),
      application,
      emailSent,
      emailWarning: emailWarning || undefined,
    });
  } catch (error) {
    console.error("Admin application update error", error);
    return NextResponse.json({ error: "Could not update this application." }, { status: 500 });
  }
}
