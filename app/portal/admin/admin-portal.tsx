"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Award,
  BarChart3,
  Bell,
  BriefcaseBusiness,
  CalendarCheck2,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  Circle,
  ClipboardList,
  Clock3,
  Download,
  FileText,
  Filter,
  GraduationCap,
  HelpCircle,
  KeyRound,
  LayoutDashboard,
  ListChecks,
  LoaderCircle,
  LogOut,
  Mail,
  MailCheck,
  MoreVertical,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Timer,
  Trash2,
  UserCheck,
  UserCog,
  UsersRound,
  UserX,
  type LucideIcon,
} from "lucide-react";
import {
  getSupabaseBrowserClient,
  isSupabaseConfigured,
} from "../../lib/supabase-browser";
import { CommunicationsCenter } from "./communications-center";
import { SessionManagement } from "./session-management";
import { CertificateManagement } from "./certificate-management";

type Tab =
  | "overview"
  | "applications"
  | "members"
  | "tasks"
  | "attendance"
  | "reports"
  | "sessions"
  | "communications"
  | "certificates";
type Member = {
  id: string;
  email?: string;
  full_name?: string | null;
  role?: "member" | "ambassador" | "team" | "admin" | "student";
  department?: string | null;
  job_title?: string | null;
  is_active?: boolean;
  lastSignInAt?: string | null;
};
type Task = {
  id: string;
  title: string;
  description: string | null;
  assignee_id: string | null;
  assignee_name: string | null;
  priority: "low" | "medium" | "high";
  status: "todo" | "in_progress" | "completed";
  due_date: string | null;
};
type Attendance = {
  id: string;
  user_id: string;
  attendance_date: string;
  check_in: string | null;
  check_out: string | null;
  status: string;
};
type Report = {
  id: string;
  user_id: string;
  report_type: string;
  summary: string;
  blockers: string | null;
  submitted_at: string;
};
type Application = {
  id: string;
  tracking_code: string;
  application_type: "career" | "ambassador";
  full_name: string;
  email: string;
  phone: string | null;
  city: string | null;
  position: string | null;
  details: Record<string, string>;
  cv_filename: string | null;
  status:
    | "submitted"
    | "under_review"
    | "shortlisted"
    | "interview"
    | "accepted"
    | "rejected";
  public_note: string | null;
  created_at: string;
  status_updated_at: string;
};
type ApplicationStatus = Application["status"];

const applicationStatusLabels: Record<ApplicationStatus, string> = {
  submitted: "Submitted",
  under_review: "Under review",
  shortlisted: "Shortlisted",
  interview: "Interview",
  accepted: "Accepted",
  rejected: "Not selected",
};
const applicationStatusOrder = Object.keys(
  applicationStatusLabels,
) as ApplicationStatus[];

const nav = [
  { id: "overview" as const, label: "Overview", icon: LayoutDashboard },
  {
    id: "applications" as const,
    label: "Applications",
    icon: BriefcaseBusiness,
  },
  { id: "members" as const, label: "Team & credentials", icon: UsersRound },
  { id: "tasks" as const, label: "Task management", icon: ClipboardList },
  { id: "attendance" as const, label: "Attendance", icon: CalendarCheck2 },
  { id: "reports" as const, label: "Reports", icon: BarChart3 },
  { id: "sessions" as const, label: "Event sessions", icon: CalendarClock },
  { id: "communications" as const, label: "Communications", icon: MailCheck },
  { id: "certificates" as const, label: "Certificates", icon: Award },
];
const fmt = (value?: string | null) =>
  value
    ? new Intl.DateTimeFormat("en-PK", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }).format(new Date(value))
    : "—";

export function AdminPortal() {
  const [tab, setTab] = useState<Tab>("overview");
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState<{
    type: "error" | "success";
    text: string;
  } | null>(null);
  const supabase = getSupabaseBrowserClient();

  const api = useCallback(
    async (
      resource: "members" | "applications",
      method: string,
      body?: unknown,
    ) => {
      if (!supabase) throw new Error("Supabase is not configured.");
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      const response = await fetch(`/api/admin/${resource}`, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: body ? JSON.stringify(body) : undefined,
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Admin request failed");
      return result;
    },
    [supabase],
  );

  const refresh = useCallback(
    async (activeUser: User) => {
      if (!supabase) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", activeUser.id)
        .single();
      if (profile?.role !== "admin") {
        setIsAdmin(false);
        return;
      }
      setIsAdmin(true);
      const [
        memberResult,
        applicationResult,
        taskResult,
        attendanceResult,
        reportResult,
      ] = await Promise.all([
        api("members", "GET"),
        api("applications", "GET"),
        supabase
          .from("team_tasks")
          .select("*")
          .order("created_at", { ascending: false }),
        supabase
          .from("team_attendance")
          .select("*")
          .order("attendance_date", { ascending: false })
          .limit(250),
        supabase
          .from("team_reports")
          .select("*")
          .order("submitted_at", { ascending: false })
          .limit(250),
      ]);
      setMembers(memberResult.members ?? []);
      setApplications(applicationResult.applications ?? []);
      if (!taskResult.error) setTasks((taskResult.data ?? []) as Task[]);
      if (!attendanceResult.error)
        setAttendance((attendanceResult.data ?? []) as Attendance[]);
      if (!reportResult.error)
        setReports((reportResult.data ?? []) as Report[]);
    },
    [api, supabase],
  );

  useEffect(() => {
    if (!supabase) {
      queueMicrotask(() => setLoading(false));
      return;
    }
    supabase.auth.getSession().then(async ({ data }) => {
      const active = data.session?.user ?? null;
      setUser(active);
      if (active) await refresh(active);
      setLoading(false);
    });
  }, [refresh, supabase]);

  const searchResults = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return [];
    return [
      ...members.map((member) => ({
        label: member.full_name || member.email || "Student",
        detail: member.role === "student" ? "Student account" : "Team account",
        tab: "members" as Tab,
      })),
      ...applications.map((application) => ({
        label: application.full_name,
        detail: application.position || "Application",
        tab: "applications" as Tab,
      })),
      ...tasks.map((task) => ({
        label: task.title,
        detail: "Task",
        tab: "tasks" as Tab,
      })),
    ]
      .filter((item) =>
        `${item.label} ${item.detail}`.toLowerCase().includes(query),
      )
      .slice(0, 6);
  }, [applications, members, search, tasks]);

  async function createMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    setSaving(true);
    setMessage(null);
    try {
      const result = await api("members", "POST", Object.fromEntries(values));
      setMessage({ type: "success", text: result.message });
      form.reset();
      if (user) await refresh(user);
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error instanceof Error ? error.message : "Could not create member",
      });
    } finally {
      setSaving(false);
    }
  }
  async function updateMember(id: string, changes: Record<string, unknown>) {
    setSaving(true);
    setMessage(null);
    try {
      const result = await api("members", "PATCH", { id, ...changes });
      setMessage({ type: "success", text: result.message });
      if (user) await refresh(user);
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error instanceof Error ? error.message : "Could not update member",
      });
    } finally {
      setSaving(false);
    }
  }
  async function deleteStudent(id: string) {
    const student = members.find((member) => member.id === id);
    const label = student?.full_name || student?.email || "this student";
    if (
      window.prompt(
        `Type DELETE to permanently remove login access for ${label}. Learning records will be retained.`,
      ) !== "DELETE"
    )
      return;
    setSaving(true);
    setMessage(null);
    try {
      const result = await api("members", "DELETE", { id });
      setMessage({ type: "success", text: result.message });
      if (user) await refresh(user);
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Could not delete student account",
      });
    } finally {
      setSaving(false);
    }
  }
  async function updateApplication(
    event: FormEvent<HTMLFormElement>,
    id: string,
  ) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    setSaving(true);
    setMessage(null);
    try {
      const result = await api("applications", "PATCH", {
        id,
        status: values.get("status"),
        publicNote: values.get("publicNote"),
      });
      setMessage({
        type: result.emailWarning ? "error" : "success",
        text: result.message,
      });
      if (user) await refresh(user);
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Could not update application",
      });
    } finally {
      setSaving(false);
    }
  }
  async function bulkUpdateApplications(
    toStatus: ApplicationStatus,
    fromStatus: ApplicationStatus | "all" = "submitted",
  ) {
    const fromLabel =
      fromStatus === "all" ? "all" : applicationStatusLabels[fromStatus];
    const toLabel = applicationStatusLabels[toStatus];
    if (
      !window.confirm(
        `Are you sure you want to move ${fromLabel} applications to '${toLabel}'?`,
      )
    )
      return;
    setSaving(true);
    setMessage(null);
    try {
      const result = await api("applications", "PATCH", {
        bulk: true,
        fromStatus,
        toStatus,
      });
      setMessage({ type: "success", text: result.message });
      if (user) await refresh(user);
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Could not bulk update applications",
      });
    } finally {
      setSaving(false);
    }
  }
  async function deleteApplication(id: string) {
    const target = applications.find((app) => app.id === id);
    const name = target ? target.full_name : "this application";
    if (
      !window.confirm(
        `Are you sure you want to delete the application from ${name}? This action will permanently remove it from the database.`,
      )
    )
      return;
    setSaving(true);
    setMessage(null);
    try {
      const result = await api("applications", "DELETE", { id });
      setMessage({ type: "success", text: result.message });
      setApplications((prev) => prev.filter((app) => app.id !== id));
      if (user) await refresh(user);
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Could not delete application",
      });
    } finally {
      setSaving(false);
    }
  }
  async function createTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || !user) return;
    const form = event.currentTarget;
    const values = new FormData(form);
    const assignee = members.find(
      (member) => member.id === values.get("assigneeId"),
    );
    setSaving(true);
    const { error } = await supabase
      .from("team_tasks")
      .insert({
        title: values.get("title"),
        description: values.get("description") || null,
        assignee_id: assignee?.id || null,
        assignee_name: assignee?.full_name || assignee?.email || null,
        priority: values.get("priority"),
        due_date: values.get("dueDate") || null,
        created_by: user.id,
      });
    setSaving(false);
    if (error) setMessage({ type: "error", text: error.message });
    else {
      form.reset();
      setMessage({ type: "success", text: "Task assigned." });
      await refresh(user);
    }
  }
  async function deleteTask(id: string) {
    if (!supabase || !user || !window.confirm("Delete this task?")) return;
    setSaving(true);
    const { error } = await supabase.from("team_tasks").delete().eq("id", id);
    setSaving(false);
    if (error) setMessage({ type: "error", text: error.message });
    else await refresh(user);
  }
  async function signOut() {
    if (!supabase) return;
    setSaving(true);
    setMessage(null);
    const { error } = await supabase.auth.signOut({ scope: "global" });
    if (error) {
      setSaving(false);
      setMessage({ type: "error", text: error.message });
      return;
    }
    window.location.replace("/admin#admin-login");
  }

  if (loading)
    return (
      <State
        title="Opening Admin Portal"
        copy="Verifying administrator access…"
      />
    );
  if (!isSupabaseConfigured())
    return (
      <State
        title="Configuration required"
        copy="Supabase environment variables are missing."
      />
    );
  if (!user)
    return (
      <State
        title="Sign in as an administrator"
        copy="Use your approved DevQuest admin credentials."
        action={
          <a href="#admin-login">
            <KeyRound /> Open admin login
          </a>
        }
      />
    );
  if (!isAdmin)
    return (
      <State
        title="Administrator access required"
        copy="This account does not have permission to enter the Admin Portal."
      />
    );
  const memberName = (id: string) =>
    members.find((member) => member.id === id)?.full_name ||
    members.find((member) => member.id === id)?.email ||
    "Unknown member";
  return (
    <div className="team-portal-shell admin-portal-shell">
      <aside className="team-portal-sidebar admin-dashboard-sidebar">
        <Link className="team-portal-wordmark admin-dashboard-brand" href="/">
          <span>DQ</span>
          <b>
            DevQuest <i>PK</i>
            <small>Admin Portal</small>
          </b>
          <em aria-hidden="true">‹</em>
        </Link>
        <nav>
          {nav.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={tab === id ? "active" : ""}
              onClick={() => setTab(id)}
              title={label}
            >
              <Icon /> {label}
            </button>
          ))}
        </nav>
        <div className="admin-system-nav">
          <small>System</small>
          <button
            type="button"
            onClick={() =>
              setMessage({
                type: "success",
                text: "Settings are managed through the secure project configuration.",
              })
            }
          >
            <Settings /> Settings
          </button>
          <button type="button" onClick={() => setTab("reports")}>
            <Activity /> Audit logs
          </button>
        </div>
        <div className="admin-sidebar-footer">
          <b>
            DevQuest <i>PK</i>
          </b>
          <small>Events · Training · Community</small>
        </div>
      </aside>
      <main className="team-portal-main admin-dashboard-main">
        <header className="admin-dashboard-topbar">
          <div className="admin-global-search">
            <Search />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search students, events, sessions, tasks…"
              aria-label="Search admin records"
            />
            <kbd>Ctrl + K</kbd>
            {searchResults.length > 0 && (
              <div className="admin-search-results">
                {searchResults.map((result, index) => (
                  <button
                    key={`${result.label}-${index}`}
                    onClick={() => {
                      setTab(result.tab);
                      setSearch("");
                    }}
                  >
                    <b>{result.label}</b>
                    <small>{result.detail}</small>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="admin-top-actions">
            <button type="button" aria-label="Notifications">
              <Bell />
              <i />
            </button>
            <button type="button" aria-label="Help">
              <HelpCircle />
            </button>
            <span className="admin-top-divider" />
            <div className="team-portal-top-user">
              <span>AD</span>
              <div>
                <b>Administrator</b>
                <small>{user.email}</small>
              </div>
              <ChevronDown />
            </div>
            <button
              className="admin-quiet-signout"
              type="button"
              onClick={signOut}
              disabled={saving}
              aria-label="Sign out"
            >
              {saving ? <LoaderCircle className="spin" /> : <LogOut />}
            </button>
          </div>
        </header>
        {message && (
          <div className={`portal-message ${message.type}`}>
            {message.type === "success" ? <CheckCircle2 /> : <AlertCircle />}
            {message.text}
          </div>
        )}
        {tab === "overview" && (
          <Overview
            applications={applications}
            members={members}
            tasks={tasks}
            attendance={attendance}
            reports={reports}
            setTab={setTab}
          />
        )}
        {tab === "applications" && (
          <Applications
            applications={applications}
            saving={saving}
            onUpdate={updateApplication}
            onBulkUpdate={bulkUpdateApplications}
            onDelete={deleteApplication}
          />
        )}
        {tab === "members" && (
          <Members
            members={members}
            saving={saving}
            onCreate={createMember}
            onUpdate={updateMember}
            onDeleteStudent={deleteStudent}
          />
        )}
        {tab === "tasks" && (
          <Tasks
            members={members}
            tasks={tasks}
            saving={saving}
            onCreate={createTask}
            onDelete={deleteTask}
          />
        )}
        {tab === "attendance" && (
          <AttendancePanel attendance={attendance} memberName={memberName} />
        )}
        {tab === "reports" && (
          <ReportsPanel reports={reports} memberName={memberName} />
        )}
        {tab === "sessions" && <SessionManagement />}
        {tab === "communications" && <CommunicationsCenter />}
        {tab === "certificates" && <CertificateManagement />}
      </main>
    </div>
  );
}

function State({
  title,
  copy,
  action,
}: {
  title: string;
  copy: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="portal-state">
      <section>
        <Link className="portal-back" href="/">
          <ArrowLeft /> Back to website
        </Link>
        <div className="portal-state-icon">
          <ShieldCheck />
        </div>
        <p className="portal-kicker">ADMIN PORTAL</p>
        <h1>{title}</h1>
        <p>{copy}</p>
        {action && <div className="portal-state-action">{action}</div>}
      </section>
    </div>
  );
}
function Head({ kicker, title }: { kicker: string; title: string }) {
  return (
    <div className="portal-panel-head">
      <div>
        <p>{kicker}</p>
        <h2>{title}</h2>
      </div>
    </div>
  );
}
function AdminModuleHero({
  kicker,
  title,
  copy,
  icon: Icon,
}: {
  kicker: string;
  title: string;
  copy: string;
  icon: LucideIcon;
}) {
  return (
    <section className="admin-module-hero">
      <div>
        <p>{kicker}</p>
        <h1>{title}</h1>
        <span>{copy}</span>
      </div>
      <div className="admin-module-hero-art" aria-hidden="true">
        <Icon />
        <i />
        <i />
      </div>
    </section>
  );
}
function AdminMetrics({
  items,
}: {
  items: Array<{
    label: string;
    value: number;
    tone: string;
    icon: LucideIcon;
  }>;
}) {
  return (
    <div className="admin-module-metrics">
      {items.map(({ label, value, tone, icon: Icon }) => (
        <article className={tone} key={label}>
          <span>
            <Icon />
          </span>
          <div>
            <strong>{value}</strong>
            <p>{label}</p>
          </div>
        </article>
      ))}
    </div>
  );
}
function Overview({
  applications,
  members,
  tasks,
  attendance,
  reports,
  setTab,
}: {
  applications: Application[];
  members: Member[];
  tasks: Task[];
  attendance: Attendance[];
  reports: Report[];
  setTab: (tab: Tab) => void;
}) {
  const students = members.filter((member) => member.role === "student");
  const openTasks = tasks.filter((task) => task.status !== "completed");
  const pendingApplications = applications.filter((application) =>
    ["submitted", "under_review"].includes(application.status),
  );
  const latestStudents = students.slice(0, 3);
  const activity = [
    ...latestStudents.map((student) => ({
      icon: UsersRound,
      tone: "green",
      text: `Student account: ${student.full_name || student.email || "New student"}`,
      time: student.lastSignInAt ? fmt(student.lastSignInAt) : "Recently added",
    })),
    ...tasks
      .slice(0, 2)
      .map((task) => ({
        icon: ClipboardList,
        tone: "blue",
        text: `Task: ${task.title}`,
        time: task.due_date ? `Due ${task.due_date}` : "No due date",
      })),
  ].slice(0, 4);
  const stats = [
    ["Applications", applications.length, BriefcaseBusiness, "blue"],
    [
      "Students active",
      students.filter((student) => student.is_active !== false).length,
      GraduationCap,
      "green",
    ],
    [
      "Team accounts",
      members.filter((member) => member.role === "team").length,
      UsersRound,
      "purple",
    ],
    ["Attendance", attendance.length, CalendarCheck2, "blue"],
    ["Open tasks", openTasks.length, ClipboardList, "gold"],
    [
      "Certificates",
      reports.filter((report) =>
        report.report_type.toLowerCase().includes("certificate"),
      ).length,
      Award,
      "pink",
    ],
  ] as const;
  return (
    <div className="admin-dashboard-overview">
      <section className="admin-dashboard-welcome">
        <div>
          <p>DEVQUEST OPERATIONS</p>
          <h2>
            Welcome back, Administrator <span>👋</span>
          </h2>
          <span>
            Manage students, sessions, attendance, certificates and team
            operations.
          </span>
        </div>
        <div className="admin-welcome-orb" aria-hidden="true" />
      </section>
      <div className="admin-stat-grid">
        {stats.map(([label, value, Icon, tone]) => (
          <article className={`admin-stat-card ${tone}`} key={label}>
            <span>
              <Icon />
            </span>
            <div>
              <strong>{value}</strong>
              <p>{label}</p>
            </div>
            <i aria-hidden="true" />
          </article>
        ))}
      </div>
      <div className="admin-dashboard-grid">
        <section className="admin-dashboard-card admin-upcoming-card">
          <header>
            <div>
              <span>
                <CalendarClock />
              </span>
              <h3>Upcoming sessions</h3>
            </div>
            <button onClick={() => setTab("sessions")}>
              View all <ArrowRight />
            </button>
          </header>
          <div className="admin-session-empty">
            <CalendarClock />
            <div>
              <b>Manage your next learning session</b>
              <small>
                Create a session, attach its Google Meet link, and enrol
                students from the Event sessions workspace.
              </small>
            </div>
            <button onClick={() => setTab("sessions")}>Open sessions</button>
          </div>
        </section>
        <section className="admin-dashboard-card admin-trend-card">
          <header>
            <div>
              <span>
                <BarChart3 />
              </span>
              <h3>Operations snapshot</h3>
            </div>
            <button onClick={() => setTab("reports")}>
              Reports <ArrowRight />
            </button>
          </header>
          <div className="admin-bars" aria-label="Operations summary chart">
            {[
              applications.length,
              students.length,
              attendance.length,
              openTasks.length,
              reports.length,
              members.filter((member) => member.role === "team").length,
            ].map((value, index) => (
              <div key={index}>
                <i
                  style={{
                    height: `${Math.max(16, Math.min(100, value ? value * 14 : 16))}%`,
                  }}
                />
                <small>
                  {
                    ["Apps", "Students", "Attend.", "Tasks", "Reports", "Team"][
                      index
                    ]
                  }
                </small>
              </div>
            ))}
          </div>
          <p className="admin-chart-caption">
            Live totals from your DevQuest portal.
          </p>
        </section>
        <section className="admin-dashboard-card admin-activity-card">
          <header>
            <div>
              <span>
                <Activity />
              </span>
              <h3>Recent activity</h3>
            </div>
            <button onClick={() => setTab("reports")}>
              View logs <ArrowRight />
            </button>
          </header>
          <div className="admin-activity-list">
            {activity.map((item, index) => {
              const Icon = item.icon;
              return (
                <article key={`${item.text}-${index}`}>
                  <span className={item.tone}>
                    <Icon />
                  </span>
                  <div>
                    <b>{item.text}</b>
                    <small>{item.time}</small>
                  </div>
                </article>
              );
            })}
            {!activity.length && (
              <div className="admin-empty-activity">
                <Clock3 /> Activity will appear as your team begins working.
              </div>
            )}
          </div>
        </section>
        <section className="admin-dashboard-card admin-pending-card">
          <header>
            <div>
              <span>
                <ClipboardList />
              </span>
              <h3>Pending actions</h3>
            </div>
            <button onClick={() => setTab("applications")}>
              View all <ArrowRight />
            </button>
          </header>
          <div className="admin-pending-list">
            <article>
              <span>
                <BriefcaseBusiness />
              </span>
              <div>
                <b>Review {pendingApplications.length} new applications</b>
                <small>
                  Career and ambassador registrations awaiting review
                </small>
              </div>
              <button onClick={() => setTab("applications")}>Review</button>
            </article>
            <article>
              <span>
                <CalendarCheck2 />
              </span>
              <div>
                <b>Track attendance</b>
                <small>Record attendance from each session roster</small>
              </div>
              <button onClick={() => setTab("sessions")}>Open</button>
            </article>
            <article>
              <span>
                <MailCheck />
              </span>
              <div>
                <b>Manage communications</b>
                <small>Send notices and check delivery logs</small>
              </div>
              <button onClick={() => setTab("communications")}>Open</button>
            </article>
          </div>
        </section>
      </div>
    </div>
  );
}
function Applications({
  applications,
  saving,
  onUpdate,
  onBulkUpdate,
  onDelete,
}: {
  applications: Application[];
  saving: boolean;
  onUpdate: (event: FormEvent<HTMLFormElement>, id: string) => void;
  onBulkUpdate: (
    toStatus: ApplicationStatus,
    fromStatus?: ApplicationStatus | "all",
  ) => void;
  onDelete: (id: string) => void;
}) {
  const submittedCount = applications.filter(
    (app) => app.status === "submitted",
  ).length;
  return (
    <div className="portal-work-grid">
      <section className="portal-panel">
        <div className="admin-applications-header">
          <Head
            kicker="APPLICANT PIPELINE"
            title="Career and ambassador applications"
          />
          <div className="admin-bulk-actions">
            <button
              type="button"
              className="portal-primary admin-bulk-btn"
              disabled={saving || submittedCount === 0}
              onClick={() => onBulkUpdate("under_review", "submitted")}
            >
              {saving ? <LoaderCircle className="spin" /> : <ClipboardList />}
              <span>Move all Submitted to Under review ({submittedCount})</span>
            </button>
            <button
              type="button"
              className="portal-mini-action"
              disabled={saving || applications.length === 0}
              onClick={() => onBulkUpdate("under_review", "all")}
            >
              Set all applications to Under review
            </button>
          </div>
        </div>
        <p className="portal-security-note">
          <ShieldCheck /> Status notes below are visible to the applicant.
          Changing the status also sends an email when delivery is available.
        </p>
        <div className="admin-application-status-summary">
          {applicationStatusOrder.map((status) => (
            <article key={status}>
              <span className={`admin-status-dot status-${status}`} />
              <div>
                <strong>
                  {
                    applications.filter(
                      (application) => application.status === status,
                    ).length
                  }
                </strong>
                <small>{applicationStatusLabels[status]}</small>
              </div>
            </article>
          ))}
        </div>
        <div className="admin-application-list">
          {applications.map((application) => (
            <article key={application.id}>
              <header>
                <span
                  className={`application-type application-type-${application.application_type}`}
                >
                  {application.application_type === "career" ? (
                    <BriefcaseBusiness />
                  ) : (
                    <UsersRound />
                  )}
                  {application.application_type}
                </span>
                <div className="admin-application-status-meta">
                  <span
                    className={`admin-application-status status-${application.status}`}
                  >
                    {applicationStatusLabels[application.status]}
                  </span>
                  <small>Updated {fmt(application.status_updated_at)}</small>
                  <button
                    className="portal-icon-danger"
                    onClick={() => onDelete(application.id)}
                    disabled={saving}
                    title="Delete application"
                    aria-label={`Delete application from ${application.full_name}`}
                  >
                    <Trash2 />
                  </button>
                </div>
              </header>
              <div className="admin-application-main">
                <div>
                  <h3>{application.full_name}</h3>
                  <p>{application.position || "Campus Ambassador"}</p>
                  <small>
                    {application.tracking_code} ·{" "}
                    {application.city || "City not provided"} · Submitted{" "}
                    {fmt(application.created_at)}
                  </small>
                </div>
                <div className="admin-application-contact">
                  <a href={`mailto:${application.email}`}>
                    <Mail /> {application.email}
                  </a>
                  {application.phone && <span>{application.phone}</span>}
                  {application.cv_filename && (
                    <span>CV: {application.cv_filename}</span>
                  )}
                </div>
              </div>
              <form
                className="admin-application-update"
                onSubmit={(event) => onUpdate(event, application.id)}
              >
                <label>
                  Change status
                  <select name="status" defaultValue={application.status}>
                    <option value="submitted">Submitted</option>
                    <option value="under_review">Under review</option>
                    <option value="shortlisted">Shortlisted</option>
                    <option value="interview">Interview</option>
                    <option value="accepted">Accepted</option>
                    <option value="rejected">Not selected</option>
                  </select>
                </label>
                <label>
                  Applicant-visible update
                  <textarea
                    name="publicNote"
                    rows={2}
                    defaultValue={application.public_note || ""}
                    placeholder="Optional next step, interview instructions, or update"
                  />
                </label>
                <button className="portal-primary" disabled={saving}>
                  {saving ? (
                    <LoaderCircle className="spin" />
                  ) : (
                    <CheckCircle2 />
                  )}{" "}
                  Save and notify
                </button>
              </form>
            </article>
          ))}
          {!applications.length && (
            <Empty text="No tracked applications yet." />
          )}
        </div>
      </section>
    </div>
  );
}

function Members({
  members,
  saving,
  onCreate,
  onUpdate,
  onDeleteStudent,
}: {
  members: Member[];
  saving: boolean;
  onCreate: (e: FormEvent<HTMLFormElement>) => void;
  onUpdate: (id: string, changes: Record<string, unknown>) => void;
  onDeleteStudent: (id: string) => void;
}) {
  const teamMembers = members.filter((member) => member.role === "team");
  const students = members.filter((member) => member.role === "student");
  return (
    <div className="portal-work-grid admin-members-layout">
      <section className="portal-panel">
        <Head kicker="NEW TEAM MEMBER" title="Create an individual portal" />
        <form className="portal-inline-form" onSubmit={onCreate}>
          <label>
            Full name
            <input name="fullName" required />
          </label>
          <label>
            Email
            <input name="email" type="email" required />
          </label>
          <label>
            Temporary password
            <input name="password" type="password" minLength={8} required />
          </label>
          <div className="portal-form-row">
            <label>
              Department
              <input name="department" />
            </label>
            <label>
              Job title
              <input name="jobTitle" />
            </label>
          </div>
          <button className="portal-primary" disabled={saving}>
            <Plus /> Create team portal
          </button>
        </form>
        <p className="portal-security-note">
          <ShieldCheck /> Every account receives its own isolated Team Portal.
          Passwords are stored only by Supabase Auth.
        </p>
      </section>
      <section className="portal-panel">
        <Head kicker="TEAM ACCESS" title="Individual team portals" />
        <div className="admin-member-list">
          {teamMembers.map((member) => (
            <article key={member.id}>
              <span>
                <UserCog />
              </span>
              <div>
                <b>{member.full_name || "Unnamed member"}</b>
                <small>
                  {member.email}
                  <br />
                  {member.department || "No department"} ·{" "}
                  {member.job_title || "No title"}
                </small>
              </div>
              <button
                className="portal-mini-action"
                onClick={() => {
                  const password = window.prompt(
                    `New temporary password for ${member.email}`,
                  );
                  if (password) void onUpdate(member.id, { password });
                }}
              >
                <KeyRound /> Reset password
              </button>
              <button
                className="portal-mini-action"
                onClick={() =>
                  onUpdate(member.id, { isActive: member.is_active === false })
                }
              >
                {member.is_active === false ? "Activate" : "Disable"}
              </button>
            </article>
          ))}
          {!teamMembers.length && <Empty text="No team portals created yet." />}
        </div>
      </section>
      <section className="portal-panel admin-student-accounts">
        <Head kicker="STUDENT ACCOUNTS" title="Student access and activity" />
        <p className="portal-security-note">
          <ShieldCheck /> Deleting a student removes their sign-in access but
          preserves their enrollment, attendance, and certificate history.
        </p>
        <div className="admin-member-list">
          {students.map((student) => (
            <article key={student.id}>
              <span>
                <UsersRound />
              </span>
              <div>
                <b>{student.full_name || "Unnamed student"}</b>
                <small>
                  {student.email || "No email"}
                  <br />
                  Last login: {fmt(student.lastSignInAt)} ·{" "}
                  {student.is_active === false
                    ? "Deleted / disabled"
                    : "Active"}
                </small>
              </div>
              {student.is_active === false ? (
                <em>Inactive</em>
              ) : (
                <button
                  className="portal-icon-danger"
                  type="button"
                  disabled={saving}
                  onClick={() => void onDeleteStudent(student.id)}
                  title={`Delete ${student.full_name || student.email || "student"}`}
                  aria-label={`Delete ${student.full_name || student.email || "student"}`}
                >
                  <Trash2 />
                </button>
              )}
            </article>
          ))}
          {!students.length && <Empty text="No student accounts found." />}
        </div>
      </section>
    </div>
  );
}
function Tasks({
  members,
  tasks,
  saving,
  onCreate,
  onDelete,
}: {
  members: Member[];
  tasks: Task[];
  saving: boolean;
  onCreate: (e: FormEvent<HTMLFormElement>) => void;
  onDelete: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [renderedAt] = useState(() => Date.now());
  const visibleTasks = tasks.filter(
    (task) =>
      `${task.title} ${task.assignee_name || ""}`
        .toLowerCase()
        .includes(query.toLowerCase()) &&
      (status === "all" || task.status === status),
  );
  const overdue = tasks.filter(
    (task) =>
      task.status !== "completed" &&
      task.due_date &&
      new Date(task.due_date).getTime() < renderedAt,
  ).length;
  return (
    <div className="admin-module-page">
      <AdminModuleHero
        kicker="TASK MANAGEMENT"
        title="Task Management"
        copy="Create, assign, and track tasks for your team and events."
        icon={ClipboardList}
      />
      <AdminMetrics
        items={[
          {
            label: "Total Tasks",
            value: tasks.length,
            tone: "blue",
            icon: ListChecks,
          },
          {
            label: "Completed",
            value: tasks.filter((task) => task.status === "completed").length,
            tone: "green",
            icon: CheckCircle2,
          },
          {
            label: "In Progress",
            value: tasks.filter((task) => task.status === "in_progress").length,
            tone: "gold",
            icon: Timer,
          },
          { label: "Overdue", value: overdue, tone: "red", icon: AlertCircle },
        ]}
      />
      <div className="admin-module-split">
        <section className="admin-module-card">
          <header className="admin-module-card-head">
            <span>
              <Plus />
            </span>
            <div>
              <h2>Create Task</h2>
              <p>Assign a new task to a team member.</p>
            </div>
          </header>
          <form
            className="portal-inline-form admin-designed-form"
            onSubmit={onCreate}
          >
            <label>
              Title *
              <input name="title" required placeholder="Enter task title..." />
            </label>
            <label>
              Assign to *
              <select name="assigneeId" required defaultValue="">
                <option value="" disabled>
                  Select team member
                </option>
                {members
                  .filter((member) => member.role === "team")
                  .map((member) => (
                    <option value={member.id} key={member.id}>
                      {member.full_name || member.email}
                    </option>
                  ))}
              </select>
            </label>
            <div className="portal-form-row">
              <label>
                Priority
                <select name="priority">
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </label>
              <label>
                Due date
                <input name="dueDate" type="date" />
              </label>
            </div>
            <label>
              Details
              <textarea
                name="description"
                rows={4}
                placeholder="Add task description, requirements, or notes..."
              />
            </label>
            <div className="admin-form-actions">
              <button className="portal-primary" disabled={saving}>
                <Plus /> Assign Task
              </button>
              <button type="reset" className="portal-secondary">
                Clear
              </button>
            </div>
          </form>
        </section>
        <section className="admin-module-card admin-list-card">
          <header className="admin-module-card-head">
            <span>
              <ClipboardList />
            </span>
            <div>
              <h2>Task List</h2>
              <p>All assigned tasks with their current status.</p>
            </div>
          </header>
          <div className="admin-module-toolbar">
            <label>
              <Search />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search tasks..."
                aria-label="Search tasks"
              />
            </label>
            <span>
              <Filter />
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                aria-label="Filter task status"
              >
                <option value="all">All tasks</option>
                <option value="todo">Pending</option>
                <option value="in_progress">In progress</option>
                <option value="completed">Completed</option>
              </select>
            </span>
          </div>
          <div className="admin-designed-list">
            {visibleTasks.map((task) => (
              <article key={task.id}>
                <span className={`admin-check-dot ${task.status}`}>
                  <CheckCircle2 />
                </span>
                <div className="admin-list-primary">
                  <b>{task.title}</b>
                  <small>{task.assignee_name || "Unassigned"}</small>
                </div>
                <time>
                  {task.due_date ? fmt(task.due_date) : "No due date"}
                </time>
                <em className={`priority-${task.priority}`}>{task.priority}</em>
                <strong className={`status-${task.status}`}>
                  {task.status.replace("_", " ")}
                </strong>
                <button
                  type="button"
                  className="portal-icon-danger"
                  onClick={() => onDelete(task.id)}
                  disabled={saving}
                  aria-label={`Delete ${task.title}`}
                >
                  <Trash2 />
                </button>
              </article>
            ))}
            {!visibleTasks.length && <Empty text="No matching tasks found." />}
          </div>
        </section>
      </div>
    </div>
  );
}

function AttendancePanel({
  attendance,
  memberName,
}: {
  attendance: Attendance[];
  memberName: (id: string) => string;
}) {
  const [query, setQuery] = useState("");
  const visible = attendance.filter((record) =>
    memberName(record.user_id).toLowerCase().includes(query.toLowerCase()),
  );
  function exportCsv() {
    const rows = [
      ["Member", "Date", "Check in", "Check out", "Status"],
      ...visible.map((record) => [
        memberName(record.user_id),
        record.attendance_date,
        record.check_in || "",
        record.check_out || "",
        record.status,
      ]),
    ];
    const csv = rows
      .map((row) =>
        row
          .map((value) => `"${String(value).replaceAll('"', '""')}"`)
          .join(","),
      )
      .join("\n");
    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "devquest-attendance.csv";
    link.click();
    URL.revokeObjectURL(url);
  }
  return (
    <div className="admin-module-page">
      <AdminModuleHero
        kicker="TEAM RECORD"
        title="Attendance Overview"
        copy="Track team attendance, check-in and checkout times, and daily presence."
        icon={CalendarCheck2}
      />
      <AdminMetrics
        items={[
          {
            label: "Total Records",
            value: attendance.length,
            tone: "blue",
            icon: UsersRound,
          },
          {
            label: "Present",
            value: attendance.filter(
              (record) => record.status.toLowerCase() === "present",
            ).length,
            tone: "green",
            icon: UserCheck,
          },
          {
            label: "In Progress",
            value: attendance.filter(
              (record) => record.check_in && !record.check_out,
            ).length,
            tone: "gold",
            icon: Timer,
          },
          {
            label: "Absent",
            value: attendance.filter(
              (record) => record.status.toLowerCase() === "absent",
            ).length,
            tone: "red",
            icon: UserX,
          },
        ]}
      />
      <section className="admin-module-card admin-table-card">
        <div className="admin-table-actions">
          <div className="admin-segment active">
            <ListChecks /> Attendance records
          </div>
          <label>
            <Search />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search member..."
              aria-label="Search attendance"
            />
          </label>
          <button
            type="button"
            className="portal-secondary"
            onClick={exportCsv}
          >
            <Download /> Export
          </button>
        </div>
        <div className="admin-modern-table-wrap">
          <table className="admin-modern-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Member</th>
                <th>Date</th>
                <th>Check in</th>
                <th>Check out</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((record, index) => (
                <tr key={record.id}>
                  <td>{index + 1}</td>
                  <td>
                    <span className="admin-table-avatar">
                      {memberName(record.user_id).slice(0, 2).toUpperCase()}
                    </span>
                    <b>{memberName(record.user_id)}</b>
                  </td>
                  <td>{fmt(record.attendance_date)}</td>
                  <td>{record.check_in ? fmt(record.check_in) : "—"}</td>
                  <td>{record.check_out ? fmt(record.check_out) : "—"}</td>
                  <td>
                    <span
                      className={`admin-record-status ${record.status.toLowerCase()}`}
                    >
                      {record.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!visible.length && <Empty text="No attendance records found." />}
        </div>
      </section>
    </div>
  );
}

function ReportsPanel({
  reports,
  memberName,
}: {
  reports: Report[];
  memberName: (id: string) => string;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const attention = reports.filter((report) => Boolean(report.blockers)).length;
  const visible = reports.filter(
    (report) =>
      `${memberName(report.user_id)} ${report.report_type} ${report.summary}`
        .toLowerCase()
        .includes(query.toLowerCase()) &&
      (filter === "all" ||
        (filter === "attention" ? Boolean(report.blockers) : !report.blockers)),
  );
  return (
    <div className="admin-module-page">
      <AdminModuleHero
        kicker="TEAM OUTPUT"
        title="Submitted Reports"
        copy="View and manage all submitted reports from team members."
        icon={BarChart3}
      />
      <AdminMetrics
        items={[
          {
            label: "Total Reports",
            value: reports.length,
            tone: "blue",
            icon: FileText,
          },
          {
            label: "Reviewed",
            value: reports.length - attention,
            tone: "green",
            icon: CheckCircle2,
          },
          { label: "In Review", value: 0, tone: "gold", icon: Clock3 },
          {
            label: "Needs Attention",
            value: attention,
            tone: "red",
            icon: AlertCircle,
          },
        ]}
      />
      <section className="admin-module-card admin-report-card">
        <div className="admin-table-actions">
          <div className="admin-report-tabs">
            <button
              className={filter === "all" ? "active" : ""}
              onClick={() => setFilter("all")}
            >
              All reports ({reports.length})
            </button>
            <button
              className={filter === "reviewed" ? "active" : ""}
              onClick={() => setFilter("reviewed")}
            >
              Reviewed ({reports.length - attention})
            </button>
            <button
              className={filter === "attention" ? "active" : ""}
              onClick={() => setFilter("attention")}
            >
              Needs attention ({attention})
            </button>
          </div>
          <label>
            <Search />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search reports..."
              aria-label="Search reports"
            />
          </label>
        </div>
        <div className="admin-report-list">
          {visible.map((report) => (
            <article key={report.id}>
              <span>
                <BarChart3 />
              </span>
              <div>
                <h3>
                  {memberName(report.user_id)} — {report.report_type}
                </h3>
                <p>{report.summary}</p>
                {report.blockers && (
                  <small>
                    <b>Blocker:</b> {report.blockers}
                  </small>
                )}
              </div>
              <time>{fmt(report.submitted_at)}</time>
              <em className={report.blockers ? "attention" : "reviewed"}>
                {report.blockers ? "Needs attention" : "Reviewed"}
              </em>
              <MoreVertical />
            </article>
          ))}
          {!visible.length && <Empty text="No matching reports found." />}
        </div>
      </section>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="portal-empty">
      <Circle /> {text}
    </div>
  );
}
