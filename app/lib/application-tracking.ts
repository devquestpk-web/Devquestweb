import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { getSupabaseAdminClient } from "./supabase-admin";

export const applicationStatuses = [
  "submitted",
  "under_review",
  "shortlisted",
  "interview",
  "accepted",
  "rejected",
] as const;

export type ApplicationStatus = typeof applicationStatuses[number];
export type TrackableApplicationType = "ambassador" | "career";

export const applicationStatusLabels: Record<ApplicationStatus, string> = {
  submitted: "Submitted",
  under_review: "Under review",
  shortlisted: "Shortlisted",
  interview: "Interview",
  accepted: "Accepted",
  rejected: "Not selected",
};

export function isApplicationStatus(value: unknown): value is ApplicationStatus {
  return applicationStatuses.includes(String(value) as ApplicationStatus);
}

export function hashTrackingToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function createTrackingCredentials(type: TrackableApplicationType, submissionId: string) {
  const token = randomBytes(32).toString("base64url");
  const prefix = type === "career" ? "CAR" : "AMB";
  const code = `DQ-${prefix}-${new Date().getUTCFullYear()}-${submissionId.replaceAll("-", "").slice(0, 12).toUpperCase()}`;
  return { token, tokenHash: hashTrackingToken(token), code };
}

export function normalizeTrackingCode(value: unknown) {
  return String(value ?? "").trim().toUpperCase();
}

export function isTrackingCode(value: unknown) {
  return /^DQ-(CAR|AMB)-\d{4}-[A-F0-9]{8,12}$/.test(normalizeTrackingCode(value));
}

export function trackingUrlForRequest(request: Request, token: string) {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  const vercelProduction = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  const base = configured || (vercelProduction ? `https://${vercelProduction}` : "https://www.devquestpk.com");
  return `${base}/application-status?token=${encodeURIComponent(token)}`;
}

export async function createTrackedApplication(input: {
  submissionId: string;
  type: TrackableApplicationType;
  trackingCode: string;
  tokenHash: string;
  fullName: string;
  email: string;
  phone?: string;
  city?: string;
  position?: string;
  fields: Record<string, string>;
  cvFilename?: string;
}) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase.from("applications").insert({
    submission_id: input.submissionId,
    application_type: input.type,
    tracking_code: input.trackingCode,
    access_token_hash: input.tokenHash,
    full_name: input.fullName,
    email: input.email.toLowerCase(),
    phone: input.phone || null,
    city: input.city || null,
    position: input.position || null,
    details: input.fields,
    cv_filename: input.cvFilename || null,
  }).select("id, tracking_code, status, created_at").single();

  if (error) throw error;
  const { error: historyError } = await supabase.from("application_status_history").insert({
    application_id: data.id,
    status: "submitted",
    public_note: "Your application has been received by DevQuest.",
  });
  if (historyError) console.error("Initial application history error", historyError);
  return data;
}
