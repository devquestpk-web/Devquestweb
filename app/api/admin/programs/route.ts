import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { syncProgramAfterWrite } from "../../../lib/background-jobs";
import { requireAdmin } from "../../../lib/supabase-admin";

function isMissingArchiveColumn(error: { code?: string; message?: string } | null) { return error?.code === "42703" || Boolean(error?.message?.includes("archived_at") && error.message.includes("does not exist")); }

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

export async function DELETE(request: Request) {
  const auth = await requireAdmin(request);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const body = await request.json();
    const parentType = body.parentType;
    const parentId = String(body.parentId || "");
    if ((parentType !== "event" && parentType !== "course") || !/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(parentId)) {
      return NextResponse.json({ error: "Choose a valid event or course" }, { status: 400 });
    }

    const table = parentType === "event" ? "webinars" : "courses";
    const sessionKey = parentType === "event" ? "webinar_id" : "course_id";
    let archiveSupported = true;
    let lookupResult = await auth.supabase.from(table).select("id, title, archived_at").eq("id", parentId).maybeSingle();
    if (isMissingArchiveColumn(lookupResult.error)) {
      archiveSupported = false;
      lookupResult = await auth.supabase.from(table).select("id, title").eq("id", parentId).maybeSingle();
    }
    const program = lookupResult.data as { id: string; title: string; archived_at?: string | null } | null;
    const lookupError = lookupResult.error;
    if (lookupError) return NextResponse.json({ error: lookupError.message }, { status: 500 });
    if (!program) return NextResponse.json({ error: "Event or course not found" }, { status: 404 });
    if (program.archived_at) return NextResponse.json({ ok: true, alreadyArchived: true });

    const { count: activeSessions, error: sessionsError } = await auth.supabase.from("event_sessions")
      .select("id", { count: "exact", head: true })
      .eq(sessionKey, parentId)
      .is("deleted_at", null)
      .in("status", ["draft", "scheduled", "live"]);
    if (sessionsError) return NextResponse.json({ error: sessionsError.message }, { status: 500 });
    if (activeSessions) return NextResponse.json({ error: "Cancel, complete, or delete this program's active sessions first" }, { status: 409 });

    const programKey = parentType === "event" ? "webinar_id" : "course_id";
    const historyChecks = await Promise.all([
      auth.supabase.from("event_sessions").select("id", { count: "exact", head: true }).eq(sessionKey, parentId),
      auth.supabase.from("enrollments").select("id", { count: "exact", head: true }).eq(programKey, parentId),
      auth.supabase.from("orders").select("id", { count: "exact", head: true }).eq(programKey, parentId),
      auth.supabase.from("tickets").select("id", { count: "exact", head: true }).eq(programKey, parentId),
      auth.supabase.from("certificates").select("id", { count: "exact", head: true }).eq(programKey, parentId),
      auth.supabase.from("certificate_templates").select("id", { count: "exact", head: true }).eq(programKey, parentId),
    ]);
    const historyError = historyChecks.find((result) => result.error)?.error;
    if (historyError) return NextResponse.json({ error: historyError.message }, { status: 500 });
    const hasHistory = historyChecks.some((result) => Boolean(result.count));

    if (!hasHistory) {
      const { error: deleteError } = await auth.supabase.from(table).delete().eq("id", parentId);
      if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 });
      await auth.supabase.from("admin_audit_logs").insert({ actor_id: auth.user.id, action: "program.deleted", entity_type: table, entity_id: parentId, details: { title: program.title } });
      const sheetSync = await syncProgramAfterWrite(table, parentId);
      return NextResponse.json({ ok: true, deleted: true, archived: false, sheetSync });
    }

    if (!archiveSupported) {
      return NextResponse.json({ error: "This program has historical records and cannot be deleted until the program archiving migration is applied." }, { status: 409 });
    }

    const { data: archived, error: archiveError } = await auth.supabase.from(table)
      .update({ archived_at: new Date().toISOString(), archived_by: auth.user.id, is_published: false })
      .eq("id", parentId)
      .is("archived_at", null)
      .select("id")
      .maybeSingle();
    if (archiveError) return NextResponse.json({ error: archiveError.message }, { status: 500 });
    if (!archived) return NextResponse.json({ ok: true, alreadyArchived: true });
    await auth.supabase.from("admin_audit_logs").insert({ actor_id: auth.user.id, action: "program.archived", entity_type: table, entity_id: parentId, details: { title: program.title } });
    const sheetSync = await syncProgramAfterWrite(table, parentId);
    return NextResponse.json({ ok: true, deleted: false, archived: true, sheetSync });
  } catch {
    return NextResponse.json({ error: "Invalid delete request" }, { status: 400 });
  }
}
