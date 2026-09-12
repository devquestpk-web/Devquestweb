import { NextResponse } from "next/server";
import { requireStudent } from "../../../lib/student-auth";
import { generateTicketCode, generateQrPayload } from "../../../lib/ticket-codes";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const auth = await requireStudent(request);
    if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
    const { supabase, user } = auth;
    
    const body = await request.json();
    const { itemType, courseId, webinarId } = body;

    if (!itemType || (itemType !== "COURSE" && itemType !== "WEBINAR")) {
      return NextResponse.json({ error: "Invalid item type" }, { status: 400 });
    }
    if (itemType === "COURSE" && !courseId) return NextResponse.json({ error: "Course ID is required" }, { status: 400 });
    if (itemType === "WEBINAR" && !webinarId) return NextResponse.json({ error: "Webinar ID is required" }, { status: 400 });

    const itemId = itemType === "COURSE" ? courseId : webinarId;

    // 1. Validate the item exists and get price
    const { data: itemData, error: itemError } = await supabase
      .from(itemType === "COURSE" ? "courses" : "webinars")
      .select("id, price, is_published")
      .eq("id", itemId)
      .single();

    if (itemError || !itemData || !itemData.is_published) {
      return NextResponse.json({ error: "Item not available" }, { status: 404 });
    }

    // 2. Check if already enrolled
    const { data: existingEnrollment } = await supabase
      .from("enrollments")
      .select("id")
      .eq("user_id", user.id)
      .eq("item_type", itemType)
      .eq(itemType === "COURSE" ? "course_id" : "webinar_id", itemId)
      .single();

    if (existingEnrollment) {
      return NextResponse.json({ error: "You are already enrolled in this item" }, { status: 400 });
    }

    // 3. Create Order (simulating instant payment for now)
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: user.id,
        item_type: itemType,
        course_id: itemType === "COURSE" ? courseId : null,
        webinar_id: itemType === "WEBINAR" ? webinarId : null,
        amount: itemData.price,
        payment_status: "COMPLETED",
      })
      .select("id")
      .single();

    if (orderError) throw orderError;

    // 4. Generate Ticket
    const ticketCode = generateTicketCode(itemType);
    const qrPayload = generateQrPayload(ticketCode, itemId, user.id, itemType);

    const { data: ticket, error: ticketError } = await supabase
      .from("tickets")
      .insert({
        ticket_code: ticketCode,
        order_id: order.id,
        user_id: user.id,
        item_type: itemType,
        course_id: itemType === "COURSE" ? courseId : null,
        webinar_id: itemType === "WEBINAR" ? webinarId : null,
        qr_payload: qrPayload,
      })
      .select("ticket_code, id")
      .single();

    if (ticketError) throw ticketError;

    // 5. Create Enrollment
    const { error: enrollmentError } = await supabase
      .from("enrollments")
      .insert({
        user_id: user.id,
        item_type: itemType,
        course_id: itemType === "COURSE" ? courseId : null,
        webinar_id: itemType === "WEBINAR" ? webinarId : null,
      });

    if (enrollmentError) throw enrollmentError;

    return NextResponse.json({ 
      success: true, 
      message: "Enrollment successful",
      ticketCode: ticket.ticket_code 
    });
  } catch (error) {
    console.error("Checkout error", error);
    return NextResponse.json({ error: "Checkout failed" }, { status: 500 });
  }
}
