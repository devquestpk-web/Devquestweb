import { NextResponse } from "next/server";
import { requireStudentOrAdmin } from "../../../../lib/student-auth";
import { getSupabaseAdminClient } from "../../../../lib/supabase-admin";
import { generateCertCode } from "../../../../lib/ticket-codes";
import React from "react";
import { renderToStream, type DocumentProps } from "@react-pdf/renderer";
import { CertificateDocument } from "../../../../lib/certificate-pdf";
import QRCode from "qrcode";
import { evaluateCertificateEligibility, resolveCertificateTemplate } from "../../../../lib/certificate-eligibility";

export const runtime = "nodejs"; // Needed for PDF generation

export async function POST(request: Request) {
  try {
    // Both students and admins can trigger this, but we use admin client for the generation
    const auth = await requireStudentOrAdmin(request);
    if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
    const adminSupabase = getSupabaseAdminClient();
    
    const body = await request.json();
    const { itemType, courseId, webinarId, sessionId, userId } = body;
    
    // Target user is either the requesting user or specified by admin
    const targetUserId = auth.role === "admin" && userId ? userId : auth.user.id;
    const itemId = itemType === "COURSE" ? courseId : webinarId;

    if (!(["COURSE", "WEBINAR"].includes(itemType)) || !itemId) return NextResponse.json({ error: "Missing or invalid certificate scope" }, { status: 400 });
    if (sessionId) {
      const { data: scopedSession } = await adminSupabase.from("event_sessions").select("id, course_id, webinar_id").eq("id", sessionId).maybeSingle();
      const belongsToItem = scopedSession && (itemType === "COURSE" ? scopedSession.course_id === courseId : scopedSession.webinar_id === webinarId);
      if (!belongsToItem) return NextResponse.json({ error: "Session does not belong to this certificate item" }, { status: 400 });
    }
    const scope = { itemType, courseId: itemType === "COURSE" ? courseId : null, webinarId: itemType === "WEBINAR" ? webinarId : null, sessionId: sessionId || null } as const;
    const template = await resolveCertificateTemplate(adminSupabase, scope);

    // 1. Fetch Item Details
    const { data: itemData, error: itemError } = await adminSupabase
      .from(itemType === "COURSE" ? "courses" : "webinars")
      .select("title")
      .eq("id", itemId)
      .single();

    if (itemError || !itemData) return NextResponse.json({ error: "Item not found" }, { status: 404 });

    // 2. Fetch User Profile
    const { data: profile } = await adminSupabase
      .from("profiles")
      .select("full_name")
      .eq("id", targetUserId)
      .single();

    const studentName = profile?.full_name || auth.user.email?.split("@")[0] || "DevQuest Student";

    // 3. Check for existing certificate
    const { data: existingCert, error: existingError } = await adminSupabase
      .from("certificates")
      .select("id, cert_code, pdf_url, verification_url")
      .eq("user_id", targetUserId)
      .eq(sessionId ? "session_id" : itemType === "COURSE" ? "course_id" : "webinar_id", sessionId || itemId)
      .is("revoked_at", null)
      .maybeSingle();

    if (existingError) return NextResponse.json({ error: "Could not check existing certificates" }, { status: 500 });
    if (existingCert) return NextResponse.json({ success: true, existing: true, certificate: existingCert });

    // 4. Enforce eligibility for every automatic/student issuance. Admins may
    // manually issue only by explicitly providing a reason, which is audited.
    const manualReason = typeof body.manualReason === "string" ? body.manualReason.trim().slice(0, 500) : "";
    if (auth.role === "admin" && manualReason && manualReason.length < 10) return NextResponse.json({ error: "An eligibility override reason must be at least 10 characters" }, { status: 400 });
    if (auth.role === "admin" && manualReason) {
      await adminSupabase.from("admin_audit_logs").insert({ actor_id: auth.user.id, action: "certificate.manual_issue", entity_type: "certificates", entity_id: itemId, details: { target_user_id: targetUserId, item_type: itemType, reason: manualReason } });
    }
    const eligibility = await evaluateCertificateEligibility(adminSupabase, targetUserId, scope, (template?.eligibility_rules || {}) as Record<string, unknown>);
    if (!(auth.role === "admin" && manualReason) && !eligibility.eligible) return NextResponse.json({ error: eligibility.reason }, { status: 403 });

    // 5. Generate Certificate Codes
    const certCode = generateCertCode();
    const issueDate = new Intl.DateTimeFormat("en-US", { year: "numeric", month: "long", day: "numeric" }).format(new Date());
    
    // Create a verify URL that goes in the QR
    const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.devquestpk.com";
    const origin = new URL(configuredSiteUrl).origin;
    const verificationUrl = `${origin}/verify/${certCode}`;
    
    // Create QR Code containing the verification URL
    const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, {
      errorCorrectionLevel: "H",
      margin: 1,
      color: { dark: "#061e3d", light: "#ffffff" }
    });

    // 6. Generate PDF Stream
    const pdfStream = await renderToStream(
      React.createElement(CertificateDocument, {
        studentName,
        courseTitle: itemData.title,
        issueDate,
        certCode,
        qrCodeDataUrl,
        itemType,
        template: (template?.config || {}) as Record<string, unknown>
      }) as unknown as React.ReactElement<DocumentProps>
    );
    
    // Convert Web ReadableStream to Buffer for Supabase Storage
    const chunks = [];
    for await (const chunk of pdfStream) {
      chunks.push(chunk);
    }
    const pdfBuffer = Buffer.concat(chunks as Uint8Array[]);

    // 7. Upload to Supabase Storage
    const fileName = `${targetUserId}/${certCode}.pdf`;
    const { error: uploadError } = await adminSupabase.storage
      .from("certificates")
      .upload(fileName, pdfBuffer, {
        contentType: "application/pdf",
        upsert: false
      });

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: publicUrlData } = adminSupabase.storage.from("certificates").getPublicUrl(fileName);

    // 8. Create DB Record
    const { data: cert, error: certError } = await adminSupabase
      .from("certificates")
      .insert({
        cert_code: certCode,
        user_id: targetUserId,
        item_type: itemType,
        course_id: itemType === "COURSE" ? courseId : null,
        webinar_id: itemType === "WEBINAR" ? webinarId : null,
        session_id: sessionId || null,
        template_id: template?.id || null,
        issuance_mode: auth.role === "admin" && manualReason ? "manual" : "automatic",
        eligibility_snapshot: { ...eligibility.snapshot, overrideReason: manualReason || null },
        uploaded_by: auth.role === "admin" ? auth.user.id : null,
        pdf_url: publicUrlData.publicUrl,
        verification_url: verificationUrl
      })
      .select("id, cert_code, pdf_url, verification_url")
      .single();

    if (certError) {
      await adminSupabase.storage.from("certificates").remove([fileName]);
      if (certError.code === "23505") {
        const { data: racedCertificate } = await adminSupabase.from("certificates").select("id, cert_code, pdf_url, verification_url").eq("user_id", targetUserId).eq(sessionId ? "session_id" : itemType === "COURSE" ? "course_id" : "webinar_id", sessionId || itemId).is("revoked_at", null).maybeSingle();
        if (racedCertificate) return NextResponse.json({ success: true, existing: true, certificate: racedCertificate });
      }
      throw certError;
    }

    return NextResponse.json({ success: true, certificate: cert });
  } catch (error) {
    console.error("Certificate generation error:", error);
    return NextResponse.json({ error: "Could not generate certificate" }, { status: 500 });
  }
}
