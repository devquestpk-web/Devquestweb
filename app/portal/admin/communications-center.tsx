"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { CheckCircle2, Clock3, Layers3, LoaderCircle, Mail, RefreshCw, Send, XCircle } from "lucide-react";
import { getSupabaseBrowserClient } from "../../lib/supabase-browser";

type Template = {
  id: string;
  template_key: string;
  name: string;
  version: number;
};
type Job = {
  id: string;
  notification_type?: string;
  entity_type?: string;
  status: string;
  attempts: number;
  created_at: string;
};

async function call(init?: RequestInit) {
  const supabase = getSupabaseBrowserClient();
  const { data } = await supabase!.auth.getSession();
  const response = await fetch("/api/admin/communications", {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${data.session?.access_token}`,
      ...init?.headers,
    },
  });
  const value = await response.json();
  if (!response.ok) throw new Error(value.error || "Request failed");
  return value;
}

/* eslint-disable react-hooks/set-state-in-effect */
export function CommunicationsCenter() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [notifications, setNotifications] = useState<Job[]>([]);
  const [syncJobs, setSyncJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState("");
  const [syncMessage, setSyncMessage] = useState("");

  const load = useCallback(async () => {
    try {
      const value = await call();
      setTemplates(value.templates || []);
      setNotifications(value.notifications || []);
      setSyncJobs(value.syncJobs || []);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not load communications",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    const values = new FormData(event.currentTarget);
    try {
      const result = await call({
        method: "POST",
        body: JSON.stringify({
          action: values.get("action"),
          templateKey: values.get("templateKey"),
          testEmail: values.get("testEmail"),
          scheduledFor: values.get("scheduledFor") || undefined,
          audience: {
            kind: values.get("audience"),
            userId: values.get("userId") || undefined,
            webinarId: values.get("webinarId") || undefined,
            sessionId: values.get("sessionId") || undefined,
          },
          variables: {
            student_name: "Student",
            event_title: values.get("eventTitle") || "DevQuest Event",
            session_title: values.get("sessionTitle") || "DevQuest Session",
            session_date: values.get("sessionDate") || "See portal",
            portal_url: `${location.origin}/portal/student`,
          },
        }),
      });
      setMessage(
        `${result.queued} email${result.queued === 1 ? "" : "s"} queued.`,
      );
      await load();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Could not queue email",
      );
    } finally {
      setSaving(false);
    }
  }

  async function retry(id: string, target: "email" | "sheets") {
    await call({
      method: "POST",
      body: JSON.stringify({ action: "retry", id, target }),
    });
    await load();
  }

  async function syncSheets() {
    setSyncing(true);
    setSyncMessage("");
    try {
      const result = await call({
        method: "POST",
        body: JSON.stringify({ action: "sync_sheets" }),
      });
      setSyncMessage(
        `Sheets sync: ${result.completed} completed, ${result.failed} failed. ${result.queuedPrograms} existing programs queued.`,
      );
      await load();
    } catch (error) {
      setSyncMessage(
        error instanceof Error ? error.message : "Could not start Sheets sync",
      );
    } finally {
      setSyncing(false);
    }
  }

  if (loading)
    return (
      <div className="portal-empty">
        <LoaderCircle className="spin" /> Loading communications…
      </div>
    );
  const unique = templates.filter(
    (template, index, all) =>
      all.findIndex((item) => item.template_key === template.template_key) ===
      index,
  );
  const jobs = [
    ...notifications.map((job) => ({ ...job, target: "email" as const })),
    ...syncJobs.map((job) => ({ ...job, target: "sheets" as const })),
  ].slice(0, 50);

  return (
    <div className="portal-work-grid admin-members-layout admin-communications-layout">
      <section className="portal-panel">
        <div className="portal-panel-head">
          <div>
            <p>COMMUNICATIONS CENTER</p>
            <h2>Compose and schedule</h2>
          </div>
        </div>
        <form className="portal-inline-form" onSubmit={submit}>
          <label>
            Template
            <select name="templateKey" required>
              {unique.map((template) => (
                <option value={template.template_key} key={template.id}>
                  {template.name} · v{template.version}
                </option>
              ))}
            </select>
          </label>
          <label>
            Audience
            <select name="audience" defaultValue="individual">
              <option value="individual">Individual student</option>
              <option value="all_students">
                All opted-in verified students
              </option>
              <option value="event">Event enrollees</option>
              <option value="session">Session enrollees</option>
            </select>
          </label>
          <label>
            Student user ID
            <input name="userId" />
          </label>
          <div className="portal-form-row">
            <label>
              Event ID
              <input name="webinarId" />
            </label>
            <label>
              Session ID
              <input name="sessionId" />
            </label>
          </div>
          <div className="portal-form-row">
            <label>
              Event title
              <input name="eventTitle" />
            </label>
            <label>
              Session title
              <input name="sessionTitle" />
            </label>
          </div>
          <label>
            Session display date
            <input name="sessionDate" />
          </label>
          <label>
            Schedule for
            <input name="scheduledFor" type="datetime-local" />
          </label>
          <label>
            Test recipient
            <input name="testEmail" type="email" />
          </label>
          <div className="portal-form-row">
            <button
              className="portal-mini-action"
              name="action"
              value="test"
              disabled={saving}
            >
              <Mail /> Test
            </button>
            <button
              className="portal-primary"
              name="action"
              value="send"
              disabled={saving}
            >
              {saving ? <LoaderCircle className="spin" /> : <Send />} Queue
              campaign
            </button>
          </div>
          {message && <p role="status">{message}</p>}
        </form>
      </section>
      <section className="portal-panel">
        <div className="portal-panel-head">
          <div>
            <p>DELIVERY &amp; SYNC</p>
            <h2>Recent background work</h2>
          </div>
          <button
            className="portal-mini-action"
            type="button"
            disabled={syncing}
            onClick={() => void syncSheets()}
          >
            {syncing ? <LoaderCircle className="spin" /> : <RefreshCw />} Sync
            Sheets
          </button>
        </div>
        <div className="admin-inline-metrics">
          <article><Layers3 /><b>{jobs.length}<small>Total jobs</small></b></article>
          <article><CheckCircle2 /><b>{jobs.filter((job) => ["sent", "completed"].includes(job.status)).length}<small>Completed</small></b></article>
          <article><XCircle /><b>{jobs.filter((job) => ["failed", "dead"].includes(job.status)).length}<small>Failed</small></b></article>
          <article><Clock3 /><b>{jobs.filter((job) => ["pending", "processing", "retrying"].includes(job.status)).length}<small>In progress</small></b></article>
        </div>
        {syncMessage && <p role="status">{syncMessage}</p>}
        <div className="admin-table">
          <div className="admin-table-row admin-table-head">
            <span>Type</span>
            <span>Status</span>
            <span>Attempts</span>
            <span>Created</span>
            <span>Action</span>
          </div>
          {jobs.map((job) => (
            <div className="admin-table-row" key={`${job.target}-${job.id}`}>
              <b>
                {job.target === "sheets"
                  ? `Sheets: ${job.entity_type}`
                  : job.notification_type}
              </b>
              <span>{job.status}</span>
              <span>{job.attempts}</span>
              <span>{new Date(job.created_at).toLocaleString("en-PK")}</span>
              <span>
                {["failed", "dead"].includes(job.status) && (
                  <button
                    className="portal-mini-action"
                    onClick={() => void retry(job.id, job.target)}
                  >
                    <RefreshCw /> Retry
                  </button>
                )}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
