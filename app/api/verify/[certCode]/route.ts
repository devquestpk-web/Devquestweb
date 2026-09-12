import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "../../../lib/supabase-admin";

export const runtime = "edge";

export async function GET(request: Request, { params }: { params: Promise<{ certCode: string }> }) {
  try {
    const { certCode } = await params;
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
      return NextResponse.json({ error: "Certificate not found or invalid" }, { status: 404 });
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

    return NextResponse.json({ verified: true, certificate: verificationData });
  } catch (error) {
    return NextResponse.json({ error: "Verification system error" }, { status: 500 });
  }
}
