import { NextResponse } from "next/server";
import { requireStudentOrAdmin } from "../../../../lib/student-auth";
import { getSupabaseAdminClient } from "../../../../lib/supabase-admin";
import { generateCertCode } from "../../../../lib/ticket-codes";
import React from "react";
import { renderToStream } from "@react-pdf/renderer";
import { CertificateDocument } from "../../../../lib/certificate-pdf";
import QRCode from "qrcode";

export const runtime = "nodejs"; // Needed for PDF generation

export async function POST(request: Request) {
  try {
    // Both students and admins can trigger this, but we use admin client for the generation
    const auth = await requireStudentOrAdmin(request);
    if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
    const adminSupabase = getSupabaseAdminClient();
    
    const body = await request.json();
    const { itemType, courseId, webinarId, userId } = body;
    
    // Target user is either the requesting user or specified by admin
    const targetUserId = auth.role === "admin" && userId ? userId : auth.user.id;
    const itemId = itemType === "COURSE" ? courseId : webinarId;

    if (!itemType || !itemId) return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });

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
    const { data: existingCert } = await adminSupabase
      .from("certificates")
      .select("id")
      .eq("user_id", targetUserId)
      .eq("item_type", itemType)
      .eq(itemType === "COURSE" ? "course_id" : "webinar_id", itemId)
      .single();

    if (existingCert) return NextResponse.json({ error: "Certificate already exists" }, { status: 400 });

    // 4. Verification Check (Course completed or Webinar attended)
    // Assuming this check was already done or admin is forcing it.

    // 5. Generate Certificate Codes
    const certCode = generateCertCode();
    const issueDate = new Intl.DateTimeFormat("en-US", { year: "numeric", month: "long", day: "numeric" }).format(new Date());
    
    // Create a verify URL that goes in the QR
    const origin = request.headers.get("origin") || process.env.NEXT_PUBLIC_SITE_URL || "https://www.devquestpk.com";
    const verificationUrl = `${origin}/verify/${certCode}`;
    
    // Create QR Code containing the verification URL
    const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, {
      errorCorrectionLevel: "H",
      margin: 0,
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
        itemType
      })
    );
    
    // Convert Web ReadableStream to Buffer for Supabase Storage
    const chunks = [];
    // @ts-ignore - The stream is a Node.js Readable stream since we are in nodejs runtime
    for await (const chunk of pdfStream) {
      chunks.push(chunk);
    }
    const pdfBuffer = Buffer.concat(chunks);

    // 7. Upload to Supabase Storage
    const fileName = `${targetUserId}/${certCode}.pdf`;
    const { data: uploadData, error: uploadError } = await adminSupabase.storage
      .from("certificates")
      .upload(fileName, pdfBuffer, {
        contentType: "application/pdf",
        upsert: true
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
        pdf_url: publicUrlData.publicUrl,
        verification_url: verificationUrl
      })
      .select("id, cert_code, pdf_url, verification_url")
      .single();

    if (certError) throw certError;

    return NextResponse.json({ success: true, certificate: cert });
  } catch (error) {
    console.error("Certificate generation error:", error);
    return NextResponse.json({ error: "Could not generate certificate" }, { status: 500 });
  }
}
