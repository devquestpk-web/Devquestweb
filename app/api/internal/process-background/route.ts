import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { processIntegrationJobs, processNotificationJobs, queueMissingProgramJobs } from "../../../lib/background-jobs";
import { configuredSpreadsheetId } from "../../../lib/google-sheets-api";
import { getSupabaseAdminClient } from "../../../lib/supabase-admin";

export const runtime = "nodejs";

function validSecret(request: Request, configured: string | undefined) {
  const supplied = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!configured || !supplied) return false;
  const left = Buffer.from(configured); const right = Buffer.from(supplied);
  return left.length === right.length && timingSafeEqual(left, right);
}

async function runBackgroundJobs() {
  try {
    const spreadsheetId = configuredSpreadsheetId();
    let queuedPrograms = 0;
    try {
      queuedPrograms = await queueMissingProgramJobs(1000);
    } catch (error) {
      console.error("Could not queue missing program Sheet rows", error);
    }
    const [sheets, notifications] = await Promise.all([processIntegrationJobs(100), processNotificationJobs(100)]);
    const { data: failedJobs } = await getSupabaseAdminClient()
      .from("integration_outbox")
      .select("entity_type, entity_id, status, attempts, last_error")
      .in("status", ["failed", "dead"])
      .order("created_at", { ascending: false })
      .limit(10);
    return NextResponse.json({ ok: true, spreadsheetId, queuedPrograms, sheets, notifications, failedJobs: failedJobs || [] });
  } catch (error) {
    console.error("Background processing failed", error);
    return NextResponse.json({ error: "Background processing failed" }, { status: 503 });
  }
}

export async function POST(request: Request) {
  if (!validSecret(request, process.env.BACKGROUND_WORKER_SECRET)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return runBackgroundJobs();
}

// Vercel Cron invokes GET and sends CRON_SECRET in the Authorization header.
export async function GET(request: Request) {
  if (!validSecret(request, process.env.CRON_SECRET)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return runBackgroundJobs();
}
