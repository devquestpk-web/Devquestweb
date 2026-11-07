import { NextResponse } from "next/server";
import { requireStudent } from "../../../../../lib/student-auth";

export const runtime = "nodejs";

function safeFileName(value: string) {
  return value.replace(/[^a-z0-9_-]+/gi, "-").replace(/^-+|-+$/g, "").slice(0, 90) || "certificate";
}

export async function GET(request: Request, context: { params: Promise<{ certificateId: string }> }) {
  const auth = await requireStudent(request);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { certificateId } = await context.params;
  const { data: certificate, error } = await auth.supabase
    .from("certificates")
    .select("id, cert_code, user_id, revoked_at")
    .eq("id", certificateId)
    .eq("user_id", auth.user.id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: "Could not load certificate" }, { status: 500 });
  if (!certificate) return NextResponse.json({ error: "Certificate not found" }, { status: 404 });
  if (certificate.revoked_at) return NextResponse.json({ error: "This certificate has been revoked" }, { status: 410 });

  const path = `${auth.user.id}/${certificate.cert_code}.pdf`;
  const download = await auth.supabase.storage.from("certificates").download(path);
  if (download.error || !download.data) return NextResponse.json({ error: "Certificate file is unavailable" }, { status: 404 });

  return new Response(download.data, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="DevQuest-${safeFileName(certificate.cert_code)}.pdf"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
