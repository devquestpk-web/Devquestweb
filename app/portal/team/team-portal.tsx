"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import {
  AlertCircle,
  ArrowLeft,
  BarChart3,
  CalendarCheck2,
  CheckCircle2,
  ChevronRight,
  Circle,
  ClipboardList,
  Clock3,
  LayoutDashboard,
  ListChecks,
  LoaderCircle,
  LogIn,
  Plus,
  Send,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "../../lib/supabase-browser";

type Tab = "overview" | "tasks" | "attendance" | "reports";
type Profile = { full_name: string | null; role: "member" | "ambassador" | "team" | "admin" };
type Task = {
  id: string;
  title: string;
  description: string | null;
  assignee_name: string | null;
  priority: "low" | "medium" | "high";
  status: "todo" | "in_progress" | "completed";
  due_date: string | null;
  created_at: string;
};
type Attendance = {
  id: string;
  attendance_date: string;
  check_in: string | null;
  check_out: string | null;
  status: "present" | "late" | "absent" | "leave";
  notes: string | null;
};
type Report = {
  id: string;
  report_type: "daily" | "weekly" | "monthly";
  summary: string;
  achievements: string | null;
  blockers: string | null;
  next_steps: string | null;
  submitted_at: string;
};

const navItems: { id: Tab; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "tasks", label: "Tasking", icon: ListChecks },
  { id: "attendance", label: "Attendance", icon: CalendarCheck2 },
  { id: "reports", label: "Reports", icon: BarChart3 },
];

function localDate() {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}

function formatDate(value: string | null) {
  if (!value) return "No due date";
  return new Intl.DateTimeFormat("en-PK", { day: "numeric", month: "short", year: "numeric" }).format(new Date(`${value}T00:00:00`));
}

function formatTime(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-PK", { hour: "numeric", minute: "2-digit" }).format(new Date(value));
}

const demoTasks: Task[] = [
  { id: "demo-1", title: "Finalize Tech Series speaker list", description: "Confirm availability and collect speaker introductions.", assignee_name: "Operations Team", priority: "high", status: "in_progress", due_date: "2026-08-10", created_at: "2026-08-05T10:00:00Z" },
  { id: "demo-2", title: "Prepare campus ambassador campaign", description: "Create the launch copy and university outreach schedule.", assignee_name: "Social Media Team", priority: "medium", status: "todo", due_date: "2026-08-14", created_at: "2026-08-04T10:00:00Z" },
  { id: "demo-3", title: "Review event visual assets", description: "Approve the final poster and story formats.", assignee_name: "Graphics Team", priority: "medium", status: "completed", due_date: "2026-08-07", created_at: "2026-08-03T10:00:00Z" },
  { id: "demo-4", title: "Publish weekly community report", description: "Combine chapter updates and engagement numbers.", assignee_name: "Administrative Team", priority: "low", status: "todo", due_date: "2026-08-12", created_at: "2026-08-02T10:00:00Z" },
];

const demoAttendance: Attendance[] = [
  { id: "attendance-1", attendance_date: localDate(), check_in: new Date().toISOString(), check_out: null, status: "present", notes: null },
  { id: "attendance-2", attendance_date: "2026-08-05", check_in: "2026-08-05T04:05:00Z", check_out: "2026-08-05T11:10:00Z", status: "present", notes: null },
  { id: "attendance-3", attendance_date: "2026-08-04", check_in: "2026-08-04T04:25:00Z", check_out: "2026-08-04T10:45:00Z", status: "late", notes: null },
];

const demoReports: Report[] = [
  { id: "report-1", report_type: "weekly", summary: "Coordinated the campus outreach plan and confirmed two university contacts.", achievements: "Completed the ambassador launch checklist.", blockers: "Waiting for one chapter confirmation.", next_steps: "Schedule the chapter onboarding call.", submitted_at: "2026-08-05T12:00:00Z" },
  { id: "report-2", report_type: "daily", summary: "Reviewed event registrations and shared the updated attendee count.", achievements: "Cleaned duplicate registrations.", blockers: null, next_steps: "Send reminder messages.", submitted_at: "2026-08-04T12:00:00Z" },
];

export function TeamPortal() {
  const [tab, setTab] = useState<Tab>("overview");
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [previewMode, setPreviewMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);

  const configured = isSupabaseConfigured();
  const supabase = getSupabaseBrowserClient();

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("preview") !== "1") return;
    setPreviewMode(true);
    setTasks(demoTasks);
    setAttendance(demoAttendance);
    setReports(demoReports);
    setLoading(false);
  }, []);

  const refreshWorkspace = useCallback(async (activeUser: User) => {
    if (!supabase) return;
    const [{ data: profileData, error: profileError }, taskResult, attendanceResult, reportResult] = await Promise.all([
      supabase.from("profiles").select("full_name, role").eq("id", activeUser.id).single(),
      supabase.from("team_tasks").select("*").order("created_at", { ascending: false }),
      supabase.from("team_attendance").select("*").eq("user_id", activeUser.id).order("attendance_date", { ascending: false }).limit(30),
      supabase.from("team_reports").select("*").eq("user_id", activeUser.id).order("submitted_at", { ascending: false }).limit(20),
    ]);

    if (profileError) {
      setMessage({ type: "error", text: "Your team profile is not ready yet. Ask a DevQuest administrator to activate it." });
      setProfile(null);
      return;
    }

    setProfile(profileData as Profile);
    if (!taskResult.error) setTasks((taskResult.data ?? []) as Task[]);
    if (!attendanceResult.error) setAttendance((attendanceResult.data ?? []) as Attendance[]);
    if (!reportResult.error) setReports((reportResult.data ?? []) as Report[]);
  }, [supabase]);

  useEffect(() => {
    if (!supabase) {
      queueMicrotask(() => setLoading(false));
      return;
    }

    supabase.auth.getSession().then(async ({ data }) => {
      const activeUser = data.session?.user ?? null;
      setUser(activeUser);
      if (activeUser) await refreshWorkspace(activeUser);
      setLoading(false);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      const activeUser = session?.user ?? null;
      setUser(activeUser);
      if (activeUser) void refreshWorkspace(activeUser);
      else setProfile(null);
    });
    return () => data.subscription.unsubscribe();
  }, [refreshWorkspace, supabase]);

  const todayAttendance = attendance.find((entry) => entry.attendance_date === localDate());
  const completedTasks = tasks.filter((task) => task.status === "completed").length;
  const openTasks = tasks.length - completedTasks;
  const attendanceRate = attendance.length
    ? Math.round((attendance.filter((entry) => entry.status === "present" || entry.status === "late").length / attendance.length) * 100)
    : 0;
  const name = previewMode ? "Hamid Ali" : profile?.full_name || user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Team member";
  const isTeam = previewMode || profile?.role === "team" || profile?.role === "admin";

  async function addTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    if (previewMode) {
      setTasks((current) => [{
        id: crypto.randomUUID(),
        title: String(values.get("title") || "").trim(),
        description: String(values.get("description") || "").trim() || null,
        assignee_name: String(values.get("assignee") || "").trim() || null,
        priority: String(values.get("priority") || "medium") as Task["priority"],
        status: "todo",
        due_date: String(values.get("dueDate") || "") || null,
        created_at: new Date().toISOString(),
      }, ...current]);
      form.reset();
      setMessage({ type: "success", text: "Preview task added. It will reset when this page is refreshed." });
      return;
    }
    if (!supabase || !user) return;
    setSaving(true);
    setMessage(null);
    const { error } = await supabase.from("team_tasks").insert({
      title: String(values.get("title") || "").trim(),
      description: String(values.get("description") || "").trim() || null,
      assignee_name: String(values.get("assignee") || "").trim() || null,
      priority: String(values.get("priority") || "medium"),
      due_date: String(values.get("dueDate") || "") || null,
      created_by: user.id,
    });
    setSaving(false);
    if (error) setMessage({ type: "error", text: error.message });
    else {
      form.reset();
      setMessage({ type: "success", text: "Task added to the team workspace." });
      await refreshWorkspace(user);
    }
  }

  async function updateTask(id: string, status: Task["status"]) {
    if (previewMode) {
      setTasks((current) => current.map((task) => task.id === id ? { ...task, status } : task));
      setMessage({ type: "success", text: "Task status updated in preview mode." });
      return;
    }
    if (!supabase || !user) return;
    setSaving(true);
    const { error } = await supabase.from("team_tasks").update({ status }).eq("id", id);
    setSaving(false);
    if (error) setMessage({ type: "error", text: error.message });
    else await refreshWorkspace(user);
  }

  async function recordAttendance(action: "check_in" | "check_out") {
    if (previewMode) {
      const now = new Date().toISOString();
      const today = localDate();
      setAttendance((current) => {
        const existing = current.find((entry) => entry.attendance_date === today);
        if (existing) return current.map((entry) => entry.id === existing.id ? { ...entry, [action]: now } : entry);
        return [{ id: crypto.randomUUID(), attendance_date: today, check_in: now, check_out: null, status: "present", notes: null }, ...current];
      });
      setMessage({ type: "success", text: action === "check_in" ? "Preview check-in recorded." : "Preview check-out recorded." });
      return;
    }
    if (!supabase || !user) return;
    setSaving(true);
    setMessage(null);
    const now = new Date().toISOString();
    const today = localDate();
    const result = action === "check_in"
      ? await supabase.from("team_attendance").upsert({ user_id: user.id, attendance_date: today, check_in: now, status: "present" }, { onConflict: "user_id,attendance_date" })
      : await supabase.from("team_attendance").update({ check_out: now }).eq("user_id", user.id).eq("attendance_date", today);
    setSaving(false);
    if (result.error) setMessage({ type: "error", text: result.error.message });
    else {
      setMessage({ type: "success", text: action === "check_in" ? "Attendance marked. Have a productive day!" : "Check-out recorded successfully." });
      await refreshWorkspace(user);
    }
  }

  async function submitReport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    if (previewMode) {
      setReports((current) => [{
        id: crypto.randomUUID(),
        report_type: String(values.get("reportType") || "weekly") as Report["report_type"],
        summary: String(values.get("summary") || "").trim(),
        achievements: String(values.get("achievements") || "").trim() || null,
        blockers: String(values.get("blockers") || "").trim() || null,
        next_steps: String(values.get("nextSteps") || "").trim() || null,
        submitted_at: new Date().toISOString(),
      }, ...current]);
      form.reset();
      setMessage({ type: "success", text: "Preview report submitted. It will reset when this page is refreshed." });
      return;
    }
    if (!supabase || !user) return;
    setSaving(true);
    setMessage(null);
    const { error } = await supabase.from("team_reports").insert({
      user_id: user.id,
      report_type: String(values.get("reportType") || "weekly"),
      summary: String(values.get("summary") || "").trim(),
      achievements: String(values.get("achievements") || "").trim() || null,
      blockers: String(values.get("blockers") || "").trim() || null,
      next_steps: String(values.get("nextSteps") || "").trim() || null,
    });
    setSaving(false);
    if (error) setMessage({ type: "error", text: error.message });
    else {
      form.reset();
      setMessage({ type: "success", text: "Your report has been submitted." });
      await refreshWorkspace(user);
    }
  }

  if (loading) return <PortalState icon={<LoaderCircle className="spin" />} title="Opening your workspace" copy="Checking your DevQuest team access…" />;

  if (!previewMode && !configured) {
    return <PortalState icon={<ShieldCheck />} title="Team Portal is built and ready" copy="Connect the DevQuest Supabase project to activate secure team accounts, shared tasks, attendance, and reports." action={<Link href="/portal"><ArrowLeft /> Back to portals</Link>} badge="DATABASE CONNECTION REQUIRED" />;
  }

  if (!previewMode && !user) {
    return <PortalState icon={<UserRound />} title="Sign in to enter the Team Portal" copy="Use your DevQuest-managed account. Team access is approved by a DevQuest administrator." action={<a href="#member-signin"><LogIn /> Sign in with DevQuest</a>} badge="TEAM MEMBERS ONLY" />;
  }

  if (!isTeam) {
    return <PortalState icon={<Clock3 />} title="Your team access is pending" copy={`You are signed in as ${user?.email || "a DevQuest member"}. A DevQuest administrator must change your member role to Team or Admin.`} action={<Link href="/portal"><ArrowLeft /> Back to portals</Link>} badge="APPROVAL REQUIRED" />;
  }

  return (
    <div className="team-portal-shell">
      <aside className="team-portal-sidebar">
        <Link className="team-portal-wordmark" href="/portal"><span>DQ</span><b>Team<br />Workspace</b></Link>
        <nav aria-label="Team portal navigation">
          {navItems.map(({ id, label, icon: Icon }) => (
            <button key={id} className={tab === id ? "active" : ""} onClick={() => { setTab(id); setMessage(null); }}><Icon /> {label}</button>
          ))}
        </nav>
        <div className="team-portal-user"><span>{name.slice(0, 2).toUpperCase()}</span><div><b>{name}</b><small>{previewMode ? "preview admin" : profile?.role}</small></div></div>
      </aside>

      <section className="team-portal-main">
        <header className="team-portal-topbar">
          <div><p>{new Intl.DateTimeFormat("en-PK", { weekday: "long", day: "numeric", month: "long" }).format(new Date())}</p><h1>{navItems.find((item) => item.id === tab)?.label}</h1></div>
          <div className="team-portal-top-user"><span>{name.slice(0, 2).toUpperCase()}</span><div><b>{name}</b><small>{previewMode ? "Preview workspace" : user?.email}</small></div></div>
        </header>

        {previewMode && <div className="portal-preview-notice"><ShieldCheck /><span><b>Preview mode</b> — explore every section safely. Changes reset when you refresh.</span><Link href="/portal/team">Exit preview</Link></div>}
        {message && <div className={`portal-message ${message.type}`}>{message.type === "success" ? <CheckCircle2 /> : <AlertCircle />}{message.text}</div>}

        {tab === "overview" && (
          <Overview name={name} tasks={tasks} openTasks={openTasks} completedTasks={completedTasks} attendanceRate={attendanceRate} todayAttendance={todayAttendance} reports={reports} onNavigate={setTab} />
        )}
        {tab === "tasks" && <TasksPanel tasks={tasks} saving={saving} onAdd={addTask} onUpdate={updateTask} />}
        {tab === "attendance" && <AttendancePanel entries={attendance} today={todayAttendance} saving={saving} onRecord={recordAttendance} />}
        {tab === "reports" && <ReportsPanel reports={reports} saving={saving} onSubmit={submitReport} />}
      </section>
    </div>
  );
}

function PortalState({ icon, title, copy, action, badge }: { icon: React.ReactNode; title: string; copy: string; action?: React.ReactNode; badge?: string }) {
  return <div className="portal-state"><section><Link className="portal-back" href="/portal"><ArrowLeft /> All portals</Link><div className="portal-state-icon">{icon}</div>{badge && <p className="portal-kicker">{badge}</p>}<h1>{title}</h1><p>{copy}</p>{action && <div className="portal-state-action">{action}</div>}<small><ShieldCheck /> Authentication and data are controlled by DevQuest.</small></section></div>;
}

function Overview({ name, tasks, openTasks, completedTasks, attendanceRate, todayAttendance, reports, onNavigate }: { name: string; tasks: Task[]; openTasks: number; completedTasks: number; attendanceRate: number; todayAttendance?: Attendance; reports: Report[]; onNavigate: (tab: Tab) => void }) {
  const stats = [
    { label: "Open tasks", value: openTasks, icon: ClipboardList, tone: "blue" },
    { label: "Completed", value: completedTasks, icon: CheckCircle2, tone: "green" },
    { label: "Attendance", value: `${attendanceRate}%`, icon: CalendarCheck2, tone: "gold" },
    { label: "Reports", value: reports.length, icon: BarChart3, tone: "purple" },
  ];
  return <div className="portal-dashboard">
    <section className="portal-welcome"><div><p>WELCOME BACK</p><h2>Keep the quest moving, {name.split(" ")[0]}.</h2><span>{todayAttendance?.check_in ? `Checked in at ${formatTime(todayAttendance.check_in)}` : "You have not checked in today."}</span></div><button onClick={() => onNavigate(todayAttendance?.check_in ? "tasks" : "attendance")}>{todayAttendance?.check_in ? "View my tasks" : "Mark attendance"} <ChevronRight /></button></section>
    <div className="portal-stat-grid">{stats.map(({ label, value, icon: Icon, tone }) => <article key={label} className={`portal-stat ${tone}`}><span><Icon /></span><div><strong>{value}</strong><p>{label}</p></div></article>)}</div>
    <div className="portal-overview-grid">
      <section className="portal-panel"><div className="portal-panel-head"><div><p>PRIORITY QUEUE</p><h2>Latest tasks</h2></div><button onClick={() => onNavigate("tasks")}>View all <ChevronRight /></button></div><div className="portal-mini-list">{tasks.slice(0, 4).map((task) => <article key={task.id}><span className={`task-dot ${task.status}`} /> <div><b>{task.title}</b><small>{task.assignee_name || "Team"} · {formatDate(task.due_date)}</small></div><em className={`priority-${task.priority}`}>{task.priority}</em></article>)}{tasks.length === 0 && <EmptyState text="No tasks have been added yet." />}</div></section>
      <section className="portal-panel portal-progress"><div className="portal-panel-head"><div><p>TEAM RHYTHM</p><h2>This workspace</h2></div></div><div className="progress-ring" style={{ "--progress": `${tasks.length ? Math.round((completedTasks / tasks.length) * 100) : 0}%` } as React.CSSProperties}><span>{tasks.length ? Math.round((completedTasks / tasks.length) * 100) : 0}%</span></div><p>Task completion</p><button onClick={() => onNavigate("reports")}>Submit progress report <Send /></button></section>
    </div>
  </div>;
}

function TasksPanel({ tasks, saving, onAdd, onUpdate }: { tasks: Task[]; saving: boolean; onAdd: (event: FormEvent<HTMLFormElement>) => void; onUpdate: (id: string, status: Task["status"]) => void }) {
  const [showForm, setShowForm] = useState(false);
  return <div className="portal-work-grid"><section className="portal-panel portal-task-list"><div className="portal-panel-head"><div><p>TEAM ASSIGNMENTS</p><h2>Tasks</h2></div><button className="portal-primary" onClick={() => setShowForm((value) => !value)}><Plus /> New task</button></div>{showForm && <form className="portal-inline-form" onSubmit={onAdd}><label>Task title<input name="title" required placeholder="What needs to be done?" /></label><div className="portal-form-row"><label>Assign to<input name="assignee" placeholder="Team member" /></label><label>Priority<select name="priority" defaultValue="medium"><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></label><label>Due date<input name="dueDate" type="date" /></label></div><label>Details<textarea name="description" rows={3} placeholder="Add context or expected outcome" /></label><button className="portal-primary" disabled={saving}>{saving ? <LoaderCircle className="spin" /> : <Plus />} Add task</button></form>}<div className="portal-task-cards">{tasks.map((task) => <article key={task.id}><div className="portal-task-title"><span className={`task-dot ${task.status}`} /><div><h3>{task.title}</h3><p>{task.description || "No additional details."}</p></div><em className={`priority-${task.priority}`}>{task.priority}</em></div><div className="portal-task-meta"><span>{task.assignee_name || "Unassigned"}</span><span>{formatDate(task.due_date)}</span><select value={task.status} onChange={(event) => onUpdate(task.id, event.target.value as Task["status"])} disabled={saving} aria-label={`Update ${task.title} status`}><option value="todo">To do</option><option value="in_progress">In progress</option><option value="completed">Completed</option></select></div></article>)}{tasks.length === 0 && <EmptyState text="Your team task list is clear." />}</div></section></div>;
}

function AttendancePanel({ entries, today, saving, onRecord }: { entries: Attendance[]; today?: Attendance; saving: boolean; onRecord: (action: "check_in" | "check_out") => void }) {
  return <div className="portal-work-grid attendance-layout"><section className="attendance-clock-card"><p>TODAY · {localDate()}</p><Clock3 /><h2>{new Intl.DateTimeFormat("en-PK", { hour: "numeric", minute: "2-digit" }).format(new Date())}</h2><span>{today?.check_in ? `Checked in ${formatTime(today.check_in)}` : "Ready when you are"}</span><button className="portal-primary" disabled={saving || Boolean(today?.check_out)} onClick={() => onRecord(today?.check_in ? "check_out" : "check_in")}>{saving ? <LoaderCircle className="spin" /> : <CalendarCheck2 />}{today?.check_out ? "Day completed" : today?.check_in ? "Check out" : "Check in"}</button>{today?.check_out && <small>Checked out {formatTime(today.check_out)}</small>}</section><section className="portal-panel"><div className="portal-panel-head"><div><p>PERSONAL RECORD</p><h2>Recent attendance</h2></div></div><div className="attendance-table"><div className="attendance-row attendance-header"><span>Date</span><span>In</span><span>Out</span><span>Status</span></div>{entries.map((entry) => <div className="attendance-row" key={entry.id}><span>{formatDate(entry.attendance_date)}</span><span>{formatTime(entry.check_in)}</span><span>{formatTime(entry.check_out)}</span><span className={`attendance-${entry.status}`}>{entry.status}</span></div>)}{entries.length === 0 && <EmptyState text="No attendance records yet." />}</div></section></div>;
}

function ReportsPanel({ reports, saving, onSubmit }: { reports: Report[]; saving: boolean; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  return <div className="portal-work-grid reports-layout"><section className="portal-panel"><div className="portal-panel-head"><div><p>PROGRESS UPDATE</p><h2>Submit a report</h2></div></div><form className="portal-report-form" onSubmit={onSubmit}><label>Report period<select name="reportType" defaultValue="weekly"><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option></select></label><label>Summary<textarea name="summary" required rows={3} placeholder="What did you work on?" /></label><label>Achievements<textarea name="achievements" rows={2} placeholder="Wins and completed outcomes" /></label><label>Blockers<textarea name="blockers" rows={2} placeholder="Anything slowing progress?" /></label><label>Next steps<textarea name="nextSteps" rows={2} placeholder="What will you focus on next?" /></label><button className="portal-primary" disabled={saving}>{saving ? <LoaderCircle className="spin" /> : <Send />} Submit report</button></form></section><section className="portal-panel"><div className="portal-panel-head"><div><p>SUBMISSION HISTORY</p><h2>My reports</h2></div></div><div className="portal-report-list">{reports.map((report) => <article key={report.id}><span><ClipboardList /></span><div><div><b>{report.report_type} report</b><small>{formatDate(report.submitted_at.slice(0, 10))}</small></div><p>{report.summary}</p>{report.blockers && <em>Blocker: {report.blockers}</em>}</div></article>)}{reports.length === 0 && <EmptyState text="Your submitted reports will appear here." />}</div></section></div>;
}

function EmptyState({ text }: { text: string }) {
  return <div className="portal-empty"><Circle /> <span>{text}</span></div>;
}
