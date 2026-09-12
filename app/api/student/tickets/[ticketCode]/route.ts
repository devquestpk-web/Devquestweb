import { NextResponse } from "next/server";
import { requireStudent } from "../../../../lib/student-auth";
import QRCode from "qrcode";

export const runtime = "nodejs"; // Needed for QRCode generation

export async function GET(request: Request, { params }: { params: { ticketCode: string } }) {
  try {
    const auth = await requireStudent(request);
    if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
    const { supabase, user } = auth;

    // Fetch ticket with joined details
    const { data: ticket, error: ticketError } = await supabase
      .from("tickets")
      .select(`
        *,
        courses:course_id(title, slug),
        webinars:webinar_id(title, slug, start_time, venue)
      `)
      .eq("user_id", user.id)
      .eq("ticket_code", params.ticketCode)
      .single();

    if (ticketError || !ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    // Generate QR code data URL from the signed payload
    const qrDataUrl = await QRCode.toDataURL(ticket.qr_payload, {
      errorCorrectionLevel: "H",
      margin: 1,
      color: { dark: "#071427", light: "#ffffff" }
    });

    return NextResponse.json({ ticket, qrDataUrl });
  } catch (error) {
    return NextResponse.json({ error: "Could not fetch ticket details" }, { status: 500 });
  }
}
