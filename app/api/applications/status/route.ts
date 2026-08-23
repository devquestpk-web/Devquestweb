import { NextResponse } from "next/server";
import { applicationStatusLabels, hashTrackingToken, isTrackingCode, normalizeTrackingCode } from "../../../lib/application-tracking";
import { getSupabaseAdminClient } from "../../../lib/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const responseHeaders = {
  "Cache-Control": "no-store, private",
  "Referrer-Policy": "no-referrer",
};

export async function GET(request: Request) {
  try {
    const searchParams = new URL(request.url).searchParams;
    const token = searchParams.get("token")?.trim() || "";
    const trackingCode = normalizeTrackingCode(searchParams.get("id"));
    if (!token && !isTrackingCode(trackingCode)) {
      return NextResponse.json({ error: "Enter a valid DevQuest tracking ID." }, { status: 400, headers: responseHeaders });
    }
    if (token && (token.length < 32 || token.length > 200)) {
      return NextResponse.json({ error: "This tracking link is invalid." }, { status: 400, headers: responseHeaders });
    }

    const supabase = getSupabaseAdminClient();
    let applicationQuery = supabase
      .from("applications")
      .select("id, tracking_code, application_type, full_name, position, status, public_note, created_at, updated_at, status_updated_at");
    applicationQuery = token
      ? applicationQuery.eq("access_token_hash", hashTrackingToken(token))
      : applicationQuery.eq("tracking_code", trackingCode);
    const { data: application, error } = await applicationQuery.maybeSingle();

    if (error) throw error;
    if (!application) {
      return NextResponse.json({ error: "We could not find an application with that tracking ID." }, { status: 404, headers: responseHeaders });
    }

    const { data: history, error: historyError } = await supabase
      .from("application_status_history")
      .select("status, public_note, created_at")
      .eq("application_id", application.id)
      .order("created_at", { ascending: true });
    if (historyError) throw historyError;

    return NextResponse.json({
      application: {
        trackingCode: application.tracking_code,
        applicationType: application.application_type,
        fullName: application.full_name,
        position: application.position,
        status: application.status,
        statusLabel: applicationStatusLabels[application.status as keyof typeof applicationStatusLabels],
        publicNote: application.public_note,
        submittedAt: application.created_at,
        updatedAt: application.status_updated_at || application.updated_at,
        history: (history ?? []).map((entry) => ({
          status: entry.status,
          label: applicationStatusLabels[entry.status as keyof typeof applicationStatusLabels],
          note: entry.public_note,
          createdAt: entry.created_at,
        })),
      },
    }, { headers: responseHeaders });
  } catch (error) {
    console.error("Application status lookup error", error);
    return NextResponse.json({ error: "Application status is temporarily unavailable." }, { status: 500, headers: responseHeaders });
  }
}
