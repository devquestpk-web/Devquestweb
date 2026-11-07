"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  CalendarClock,
  CheckCircle2,
  LoaderCircle,
  PlayCircle,
  Plus,
  Trash2,
  UsersRound,
  XCircle,
} from "lucide-react";
import { getSupabaseBrowserClient } from "../../lib/supabase-browser";

type Item = { id: string; title: string };
type Roster = {
  id: string;
  user_id: string;
  status: string;
  profiles?: { full_name?: string; student_id?: string } | null;
};
type Session = {
  id: string;
  title: string;
  topic?: string | null;
  trainer?: string | null;
  starts_at: string;
  status: string;
  deleted_at?: string | null;
  webinars?: { title?: string } | null;
  courses?: { title?: string } | null;
  session_enrollments?: Roster[];
  session_attendance?: Array<{ user_id: string; status: string }>;
};
type MeetRecord = {
  id: string;
  display_name?: string | null;
  participant_type: string;
  duration_seconds: number;
  match_status: string;
  matched_user_id?: string | null;
};

function formDate(value: FormDataEntryValue | null) {
  const date = new Date(String(value || ""));
  return Number.isFinite(date.getTime()) ? date.toISOString() : null;
}

async function call(init?: RequestInit) {
  const supabase = getSupabaseBrowserClient();
  const { data } = await supabase!.auth.getSession();
  const response = await fetch("/api/admin/sessions", {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${data.session?.access_token}`,
    },
  });
  const value = await response.json();
  if (!response.ok) throw new Error(value.error || "Request failed");
  return value;
}
async function googleCall(path: string, init?: RequestInit) {
  const supabase = getSupabaseBrowserClient();
  const { data } = await supabase!.auth.getSession();
  const response = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${data.session?.access_token}`,
    },
  });
  const value = await response.json();
  if (!response.ok)
    throw new Error(value.error || "Google Workspace request failed");
  return value;
}

export function SessionManagement() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [webinars, setWebinars] = useState<Item[]>([]);
  const [courses, setCourses] = useState<Item[]>([]);
  const [parentType, setParentType] = useState<"event" | "course">("event");
  const [parentId, setParentId] = useState("");
  const [newParentTitle, setNewParentTitle] = useState("");
  const [newParentDescription, setNewParentDescription] = useState("");
  const [publishParent, setPublishParent] = useState(true);
  const [meetRecords, setMeetRecords] = useState<Record<string, MeetRecord[]>>(
    {},
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [parentMessage, setParentMessage] = useState("");
  const [loadError, setLoadError] = useState("");
  const sessionForm = useRef<HTMLFormElement>(null);
  const parentOptions = useMemo(
    () => (parentType === "event" ? webinars : courses),
    [courses, parentType, webinars],
  );
  const load = useCallback(async () => {
    try {
      const result = await call();
      setSessions(result.sessions || []);
      setWebinars(result.webinars || []);
      setCourses(result.courses || []);
      setLoadError("");
    } catch (error) {
      setLoadError(
        error instanceof Error ? error.message : "Could not load sessions",
      );
    }
  }, []);
  useEffect(() => {
    queueMicrotask(() => void load());
  }, [load]);

  async function createParent() {
    const form = sessionForm.current;
    if (!form) return;
    const values = new FormData(form);
    setSaving(true);
    setParentMessage("");
    try {
      const result = await googleCall("/api/admin/programs", {
        method: "POST",
        body: JSON.stringify({
          parentType,
          title: newParentTitle,
          description: newParentDescription,
          published: publishParent,
          startsAt: formDate(values.get("startsAt")),
          endsAt: formDate(values.get("endsAt")),
        }),
      });
      if (parentType === "event")
        setWebinars((previous) => [...previous, result.program]);
      else setCourses((previous) => [...previous, result.program]);
      setParentId(result.program.id);
      setNewParentTitle("");
      setNewParentDescription("");
      setParentMessage(
        `${parentType === "event" ? "Event" : "Course"} created and selected. You can now create the session.`,
      );
    } catch (error) {
      setParentMessage(
        error instanceof Error ? error.message : "Could not create program",
      );
    } finally {
      setSaving(false);
    }
  }
  async function deleteParent() {
    const selected = parentOptions.find((item) => item.id === parentId);
    if (
      !selected ||
      !window.confirm(
        `Delete ${selected.title}? Unused programs are permanently deleted. Programs with historical records are archived and hidden while their history is preserved.`,
      )
    )
      return;
    setSaving(true);
    setParentMessage("");
    try {
      const result = await googleCall("/api/admin/programs", {
        method: "DELETE",
        body: JSON.stringify({ parentType, parentId }),
      });
      setParentId("");
      await load();
      setParentMessage(
        result.deleted
          ? `${selected.title} permanently deleted.`
          : `${selected.title} archived to preserve its history. It is no longer in active lists.`,
      );
    } catch (error) {
      setParentMessage(
        error instanceof Error ? error.message : "Could not delete program",
      );
    } finally {
      setSaving(false);
    }
  }
  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!parentId) {
      setMessage(
        "Select or create an event or course before creating the session.",
      );
      return;
    }
    setSaving(true);
    const form = event.currentTarget;
    const values = Object.fromEntries(new FormData(form));
    try {
      await call({
        method: "POST",
        body: JSON.stringify({
          parentType: values.parentType,
          parentId,
          title: values.title,
          topic: values.topic,
          trainer: values.trainer,
          startsAt: formDate(values.startsAt as FormDataEntryValue),
          endsAt: formDate(values.endsAt as FormDataEntryValue),
          joinUrl: values.joinUrl,
          recordingUrl: values.recordingUrl,
          joinReleasesAt: formDate(values.joinReleasesAt as FormDataEntryValue),
          status: values.status,
          enrollmentMode: values.enrollmentMode,
          resources: values.resourceUrl
            ? [
                {
                  title: values.resourceTitle || "Session resource",
                  url: values.resourceUrl,
                },
              ]
            : [],
        }),
      });
      form.reset();
      setParentType("event");
      setParentId("");
      setMessage("Session created. Its student roster is ready to manage.");
      await load();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Could not create session",
      );
    } finally {
      setSaving(false);
    }
  }
  async function update(sessionId: string, changes: Record<string, unknown>) {
    setSaving(true);
    try {
      await call({
        method: "PATCH",
        body: JSON.stringify({ sessionId, ...changes }),
      });
      await load();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Could not update session",
      );
    } finally {
      setSaving(false);
    }
  }
  async function remove(sessionId: string) {
    const reason = window.prompt(
      "Reason for deleting or archiving this session:",
    );
    if (reason === null) return;
    setSaving(true);
    try {
      const result = await call({
        method: "DELETE",
        body: JSON.stringify({ sessionId, reason }),
      });
      setMessage(
        result.softDeleted
          ? "Session archived because it has history."
          : "Session deleted. To remove its event or course from the selector, archive it above.",
      );
      await load();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Could not delete session",
      );
    } finally {
      setSaving(false);
    }
  }
  async function googleAction(
    sessionId: string,
    action: "create_meet" | "sync_attendance",
  ) {
    setSaving(true);
    try {
      const result = await googleCall("/api/admin/google-workspace", {
        method: "POST",
        body: JSON.stringify({ sessionId, action }),
      });
      setMessage(
        action === "create_meet"
          ? "Google Calendar event and Meet link created."
          : `Meet activity imported: ${result.imported}, matched: ${result.matched}, needs review: ${result.unmatched}.`,
      );
      await load();
      if (action === "sync_attendance") await reviewMeet(sessionId);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Google Workspace action failed",
      );
    } finally {
      setSaving(false);
    }
  }
  async function reviewMeet(sessionId: string) {
    try {
      const result = await googleCall(
        `/api/admin/google-workspace?sessionId=${encodeURIComponent(sessionId)}`,
      );
      setMeetRecords((previous) => ({
        ...previous,
        [sessionId]: result.participants || [],
      }));
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not load Meet participants",
      );
    }
  }
  async function reconcile(
    sessionId: string,
    participant: MeetRecord,
    action: "match" | "ignore",
  ) {
    const userId =
      action === "match"
        ? window.prompt("Enter the enrolled student's Supabase user ID:") || ""
        : undefined;
    if (action === "match" && !userId) return;
    await googleCall("/api/admin/google-workspace", {
      method: "POST",
      body: JSON.stringify({
        action: "reconcile",
        sessionId,
        participantId: participant.id,
        matchAction: action,
        userId,
      }),
    });
    await reviewMeet(sessionId);
    await load();
  }

  return (
    <div className="portal-work-grid admin-members-layout admin-session-layout">
      <section className="portal-panel">
        <div className="portal-panel-head">
          <div>
            <p>EVENT & COURSE SESSIONS</p>
            <h2>Create a session</h2>
          </div>
        </div>
        <form
          ref={sessionForm}
          className="portal-inline-form"
          onSubmit={create}
        >
          <div className="portal-form-row">
            <label>
              Attach to
              <select
                name="parentType"
                value={parentType}
                onChange={(event) => {
                  setParentType(event.target.value as "event" | "course");
                  setParentId("");
                  setParentMessage("");
                }}
              >
                <option value="event">Event / webinar</option>
                <option value="course">Course</option>
              </select>
            </label>
            <label>
              {parentType === "event" ? "Event / webinar" : "Course"}
              <select
                name="parentId"
                required
                value={parentId}
                onChange={(event) => setParentId(event.target.value)}
              >
                <option value="" disabled>
                  Select a {parentType === "event" ? "webinar" : "course"}
                </option>
                {parentOptions.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.title}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {parentId && (
            <button
              type="button"
              className="portal-archive-program"
              disabled={saving}
              onClick={() => void deleteParent()}
            >
              <Trash2 /> Delete selected{" "}
              {parentType === "event" ? "event" : "course"}
            </button>
          )}
          {loadError && (
            <p role="alert" className="portal-security-note">
              Could not load events and courses: {loadError}{" "}
              <button
                type="button"
                className="portal-mini-action"
                onClick={() => void load()}
              >
                Retry
              </button>
            </p>
          )}
          <details
            className="portal-parent-create"
            open={!parentOptions.length || undefined}
          >
            <summary>
              {parentOptions.length
                ? "Create a new event or course"
                : `No ${parentType === "event" ? "events" : "courses"} yet — create one to attach this session`}
            </summary>
            <div className="portal-parent-create-fields">
              <label>
                {parentType === "event" ? "Event" : "Course"} title
                <input
                  value={newParentTitle}
                  onChange={(event) => setNewParentTitle(event.target.value)}
                  placeholder={
                    parentType === "event"
                      ? "e.g. AWS Cloud Practitioner Prep"
                      : "e.g. Cloud Computing"
                  }
                />
              </label>
              <label>
                Description
                <input
                  value={newParentDescription}
                  onChange={(event) =>
                    setNewParentDescription(event.target.value)
                  }
                  placeholder="Short description for students"
                />
              </label>
              <label className="portal-parent-publish">
                <input
                  type="checkbox"
                  checked={publishParent}
                  onChange={(event) => setPublishParent(event.target.checked)}
                />{" "}
                Publish for student enrollment
              </label>
              {parentType === "event" && (
                <p className="portal-security-note">
                  The event will use the session start and end times entered
                  below.
                </p>
              )}
              <button
                type="button"
                className="portal-mini-action"
                disabled={saving || !!loadError}
                onClick={() => void createParent()}
              >
                <Plus /> Create {parentType === "event" ? "event" : "course"}
              </button>
            </div>
          </details>
          {parentMessage && (
            <p role="status" className="portal-parent-message">
              {parentMessage}
            </p>
          )}
          <label>
            Session title
            <input name="title" required />
          </label>
          <label>
            Topic
            <textarea name="topic" rows={2} />
          </label>
          <label>
            Trainer
            <input name="trainer" />
          </label>
          <div className="portal-form-row">
            <label>
              Starts
              <input name="startsAt" type="datetime-local" required />
            </label>
            <label>
              Ends
              <input name="endsAt" type="datetime-local" required />
            </label>
          </div>
          <div className="portal-form-row">
            <label>
              Enrollment
              <select name="enrollmentMode">
                <option value="mandatory">All enrolled students</option>
                <option value="optional">Opt-in only</option>
              </select>
            </label>
            <label>
              Initial status
              <select name="status">
                <option value="draft">Draft</option>
                <option value="scheduled">Publish / scheduled</option>
              </select>
            </label>
          </div>
          <label>
            Private Meet/session URL
            <input name="joinUrl" type="url" />
          </label>
          <label>
            Recording URL
            <input name="recordingUrl" type="url" />
          </label>
          <div className="portal-form-row">
            <label>
              Resource title
              <input name="resourceTitle" />
            </label>
            <label>
              Resource URL
              <input name="resourceUrl" type="url" />
            </label>
          </div>
          <label>
            Release join link
            <input name="joinReleasesAt" type="datetime-local" />
          </label>
          <button className="portal-primary" disabled={saving}>
            {saving ? <LoaderCircle className="spin" /> : <Plus />} Create
            session
          </button>
          {message && <p role="status">{message}</p>}
        </form>
      </section>
      <section className="portal-panel">
        <div className="portal-panel-head">
          <div>
            <p>SESSION ROSTERS</p>
            <h2>Lifecycle and attendance</h2>
          </div>
        </div>
        <div className="admin-inline-metrics">
          <article><CalendarClock /><b>{sessions.length}<small>Total sessions</small></b></article>
          <article><PlayCircle /><b>{sessions.filter((session) => session.status === "scheduled").length}<small>Upcoming</small></b></article>
          <article><CheckCircle2 /><b>{sessions.filter((session) => session.status === "completed").length}<small>Completed</small></b></article>
          <article><UsersRound /><b>{sessions.reduce((total, session) => total + (session.session_attendance?.length || 0), 0)}<small>Attendance</small></b></article>
        </div>
        <div className="portal-task-cards">
          {sessions.map((session) => (
            <article key={session.id}>
              <div className="portal-task-title">
                <span>
                  <CalendarClock />
                </span>
                <div>
                  <h3>{session.title}</h3>
                  <p>
                    {session.webinars?.title ||
                      session.courses?.title ||
                      "Program"}{" "}
                    · {new Date(session.starts_at).toLocaleString("en-PK")}
                  </p>
                  {session.topic && <small>{session.topic}</small>}
                </div>
                <em>{session.deleted_at ? "archived" : session.status}</em>
              </div>
              <div className="portal-task-meta admin-session-meta">
                <span>
                  {session.session_enrollments?.filter(
                    (item) => item.status === "enrolled",
                  ).length || 0}{" "}
                  enrolled · {session.session_attendance?.length || 0} marked
                </span>
                {!session.deleted_at && (
                  <div className="admin-session-actions">
                    <button
                      className="portal-mini-action"
                      disabled={saving}
                      onClick={() =>
                        void update(session.id, { status: "scheduled" })
                      }
                    >
                      <CheckCircle2 /> Publish
                    </button>
                    <button
                      className="portal-mini-action"
                      disabled={saving}
                      onClick={() => {
                        const startsAt = window.prompt(
                          "New start time (ISO or local datetime):",
                          session.starts_at,
                        );
                        const endsAt = window.prompt(
                          "New end time (ISO or local datetime):",
                        );
                        if (startsAt && endsAt)
                          void update(session.id, { startsAt, endsAt });
                      }}
                    >
                      Reschedule
                    </button>
                    <button
                      className="portal-mini-action"
                      disabled={saving}
                      onClick={() => {
                        const reason =
                          window.prompt("Cancellation reason:") || "";
                        void update(session.id, {
                          status: "cancelled",
                          cancellationReason: reason,
                        });
                      }}
                    >
                      <XCircle /> Cancel
                    </button>
                    <button
                      className="portal-icon-danger"
                      disabled={saving}
                      onClick={() => void remove(session.id)}
                      aria-label={`Delete session ${session.title}`}
                      title="Delete this session only; the event or course remains available"
                    >
                      <Trash2 />
                    </button>
                  </div>
                )}
              </div>
              {!session.deleted_at && (
                <div className="admin-session-tools">
                  <button
                    className="portal-mini-action"
                    onClick={() => void googleAction(session.id, "create_meet")}
                  >
                    Create Google Meet
                  </button>
                  <button
                    className="portal-mini-action"
                    onClick={() =>
                      void googleAction(session.id, "sync_attendance")
                    }
                  >
                    Sync Meet attendance
                  </button>
                  <button
                    className="portal-mini-action"
                    onClick={() => void reviewMeet(session.id)}
                  >
                    Review unmatched
                  </button>
                </div>
              )}
              {meetRecords[session.id]?.map((participant) => (
                <div
                  className="admin-table-row admin-session-participant"
                  key={participant.id}
                >
                  <b>
                    {participant.display_name || participant.participant_type}
                  </b>
                  <span>
                    {Math.round(participant.duration_seconds / 60)} min ·{" "}
                    {participant.match_status}
                  </span>
                  <span>{participant.matched_user_id || "Unmatched"}</span>
                  {participant.match_status === "unmatched" && (
                    <span>
                      <button
                        className="portal-mini-action"
                        onClick={() =>
                          void reconcile(session.id, participant, "match")
                        }
                      >
                        Match
                      </button>
                      <button
                        className="portal-mini-action"
                        onClick={() =>
                          void reconcile(session.id, participant, "ignore")
                        }
                      >
                        Ignore
                      </button>
                    </span>
                  )}
                </div>
              ))}
              {session.session_enrollments
                ?.filter((item) => item.status === "enrolled")
                .map((student) => (
                  <div
                    className="admin-table-row admin-session-student"
                    key={student.id}
                  >
                    <b>{student.profiles?.full_name || student.user_id}</b>
                    <span>{student.profiles?.student_id || "Student"}</span>
                    <select
                      aria-label={`Attendance for ${student.profiles?.full_name || student.user_id}`}
                      defaultValue={
                        session.session_attendance?.find(
                          (item) => item.user_id === student.user_id,
                        )?.status || "absent"
                      }
                      onChange={(event) =>
                        void update(session.id, {
                          action: "attendance",
                          userId: student.user_id,
                          status: event.target.value,
                        })
                      }
                    >
                      <option value="present">Present</option>
                      <option value="late">Late</option>
                      <option value="absent">Absent</option>
                      <option value="excused">Excused</option>
                    </select>
                  </div>
                ))}
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
