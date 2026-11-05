import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { processIntegrationJobs, processNotificationJobs } from "../../../lib/background-jobs";
import { configuredSpreadsheetId } from "../../../lib/google-sheets-api";
import { getSupabaseAdminClient } from "../../../lib/supabase-admin";

export const runtime = "nodejs";

function validWorkerSecret(request: Request) {
  const configured = process.env.BACKGROUND_WORKER_SECRET;
  const supplied = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!configured || !supplied) return false;
  const left = Buffer.from(configured); const right = Buffer.from(supplied);
  return left.length === right.length && timingSafeEqual(left, right);
}

export async function POST(request: Request) {
  if (!validWorkerSecret(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const spreadsheetId = configuredSpreadsheetId();
    const [sheets, notifications] = await Promise.all([processIntegrationJobs(100), processNotificationJobs(100)]);
    const { data: failedJobs } = await getSupabaseAdminClient()
      .from("integration_outbox")
      .select("entity_type, entity_id, status, attempts, last_error")
      .in("status", ["failed", "dead"])
      .order("created_at", { ascending: false })
      .limit(10);
    return NextResponse.json({ ok: true, spreadsheetId, sheets, notifications, failedJobs: failedJobs || [] });
  } catch (error) {
    console.error("Background processing failed", error);
    return NextResponse.json({ error: "Background processing failed" }, { status: 503 });
  }
}
