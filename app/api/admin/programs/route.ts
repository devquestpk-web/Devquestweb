import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { syncProgramAfterWrite } from "../../../lib/background-jobs";
import { requireAdmin } from "../../../lib/supabase-admin";

export async function POST(request: Request) {
  const auth = await requireAdmin(request);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const body = await request.json();
    const parentType = body.parentType;
    const title = String(body.title || "").trim().slice(0, 180);
    const description = String(body.description || "").trim().slice(0, 2000) || title;
    if (parentType !== "event" && parentType !== "course") return NextResponse.json({ error: "Choose an event or course" }, { status: 400 });
    if (title.length < 2) return NextResponse.json({ error: "Program title must have at least two characters" }, { status: 400 });

    const slug = `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "program"}-${randomUUID().slice(0, 8)}`;
    const published = body.published === true;
    const fields: Record<string, unknown> = { title, slug, description, price: 0, is_published: published };
    if (parentType === "event") {
      if (typeof body.startsAt !== "string" || typeof body.endsAt !== "string" || !body.startsAt || !body.endsAt) {
        return NextResponse.json({ error: "Set the session start and end times before creating an event" }, { status: 400 });
      }
      const startsAt = new Date(body.startsAt);
      const endsAt = new Date(body.endsAt);
      if (!Number.isFinite(startsAt.getTime()) || !Number.isFinite(endsAt.getTime()) || endsAt <= startsAt) {
        return NextResponse.json({ error: "Set a valid start and end time before creating an event" }, { status: 400 });
      }
      fields.start_time = startsAt.toISOString();
      fields.end_time = endsAt.toISOString();
    }

    const table = parentType === "event" ? "webinars" : "courses";
    const { data, error } = await auth.supabase.from(table).insert(fields).select("id, title").single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await auth.supabase.from("admin_audit_logs").insert({ actor_id: auth.user.id, action: "program.created", entity_type: table, entity_id: data.id, details: { published } });
    const sheetSync = await syncProgramAfterWrite(table, data.id);
    return NextResponse.json({ ok: true, program: data, sheetSync }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid program request" }, { status: 400 });
  }
}
