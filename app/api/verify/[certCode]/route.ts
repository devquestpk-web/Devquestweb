import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "../../../lib/supabase-admin";

export const runtime = "edge";

export async function GET(request: Request, { params }: { params: Promise<{ certCode: string }> }) {
  try {
    const { certCode } = await params;
    if (!/^[A-Za-z0-9][A-Za-z0-9-]{3,99}$/.test(certCode)) {
      return NextResponse.json({ error: "Invalid certificate ID" }, { status: 400, headers: { "Cache-Control": "no-store" } });
    }
    const adminSupabase = getSupabaseAdminClient();

    // Fetch the certificate and joined item data
    const { data: certificate, error } = await adminSupabase
      .from("certificates")
      .select(`
        *,
        profiles:user_id(full_name),
        courses:course_id(title, instructor_name),
        webinars:webinar_id(title, speaker_name)
      `)
      .eq("cert_code", certCode)
      .single();

    if (error || !certificate) {
      return NextResponse.json({ error: "Certificate not found or invalid" }, { status: 404, headers: { "Cache-Control": "no-store" } });
    }

    if (certificate.revoked_at) {
      return NextResponse.json({ verified: false, error: "Certificate revoked" }, { status: 410, headers: { "Cache-Control": "no-store" } });
    }

    // Prepare safe public response
    const verificationData = {
      certCode: certificate.cert_code,
      studentName: certificate.profiles?.full_name || "Unknown Student",
      itemType: certificate.item_type,
      itemTitle: certificate.item_type === "COURSE" ? certificate.courses?.title : certificate.webinars?.title,
      instructorName: certificate.item_type === "COURSE" ? certificate.courses?.instructor_name : certificate.webinars?.speaker_name,
      issuedAt: certificate.issued_at,
      pdfUrl: certificate.pdf_url,
    };

    return NextResponse.json({ verified: true, certificate: verificationData }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Verification system error" }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}
