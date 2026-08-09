"use client";

import { ChangeEvent, FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { AlertCircle, ArrowLeft, BarChart3, CalendarCheck2, Camera, CheckCircle2, Circle, ClipboardList, Clock3, FileText, KeyRound, LoaderCircle, LockKeyhole, LogOut, Send, ShieldCheck, UserRound } from "lucide-react";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "../../lib/supabase-browser";

type Tab = "tasks" | "about" | "credentials" | "attendance" | "reports";
type Profile = { full_name: string | null; role: "member" | "ambassador" | "team" | "admin"; department: string | null; job_title: string | null; phone: string | null; bio: string | null; avatar_url: string | null };
type Task = { id: string; title: string; description: string | null; assignee_name: string | null; priority: "low" | "medium" | "high"; status: "todo" | "in_progress" | "completed"; due_date: string | null; created_at: string };
type Attendance = { id: string; attendance_date: string; check_in: string | null; check_out: string | null; status: "present" | "late" | "absent" | "leave"; notes: string | null };
type Report = { id: string; report_type: "daily" | "weekly" | "monthly"; summary: string; achievements: string | null; blockers: string | null; next_steps: string | null; submitted_at: string };

const navItems = [
  { id: "tasks" as const, label: "Tasks", icon: ClipboardList },
  { id: "about" as const, label: "About", icon: UserRound },
  { id: "credentials" as const, label: "Login credentials", icon: KeyRound },
  { id: "attendance" as const, label: "Attendance", icon: CalendarCheck2 },
  { id: "reports" as const, label: "Reports", icon: BarChart3 },
];

const today = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
const formatDate = (value: string | null) => value ? new Intl.DateTimeFormat("en-PK", { day: "numeric", month: "short", year: "numeric" }).format(new Date(`${value.slice(0, 10)}T00:00:00`)) : "No due date";
const formatTime = (value: string | null) => value ? new Intl.DateTimeFormat("en-PK", { hour: "numeric", minute: "2-digit" }).format(new Date(value)) : "—";

function ProfileAvatar({ name, url, className = "" }: { name: string; url?: string | null; className?: string }) {
  const initials = name.split(" ").map((part) => part[0]).slice(0, 2).join("").toUpperCase();
  return <span className={`portal-profile-avatar ${url ? "has-image" : ""} ${className}`.trim()} style={url ? { backgroundImage: `url(${JSON.stringify(url)})` } : undefined} role="img" aria-label={`${name} profile photo`}>{url ? null : initials}</span>;
}

export function TeamPortal() {
  const [tab, setTab] = useState<Tab>("tasks");
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarSaving, setAvatarSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const supabase = getSupabaseBrowserClient();

  const refresh = useCallback(async (activeUser: User) => {
    if (!supabase) return;
    const [profileResult, taskResult, attendanceResult, reportResult] = await Promise.all([
      supabase.from("profiles").select("full_name, role, department, job_title, phone, bio, avatar_url").eq("id", activeUser.id).single(),
      supabase.from("team_tasks").select("*").order("created_at", { ascending: false }),
      supabase.from("team_attendance").select("*").eq("user_id", activeUser.id).order("attendance_date", { ascending: false }).limit(60),
      supabase.from("team_reports").select("*").eq("user_id", activeUser.id).order("submitted_at", { ascending: false }).limit(30),
    ]);
    if (profileResult.error) setMessage({ type: "error", text: "Your team profile is not active yet. Ask a DevQuest administrator for access." });
    else setProfile(profileResult.data as Profile);
    if (!taskResult.error) setTasks((taskResult.data ?? []) as Task[]);
    if (!attendanceResult.error) setAttendance((attendanceResult.data ?? []) as Attendance[]);
    if (!reportResult.error) setReports((reportResult.data ?? []) as Report[]);
  }, [supabase]);

  useEffect(() => {
    if (!supabase) { queueMicrotask(() => setLoading(false)); return; }
    supabase.auth.getSession().then(async ({ data }) => { const active = data.session?.user ?? null; setUser(active); if (active) await refresh(active); setLoading(false); });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => { const active = session?.user ?? null; setUser(active); if (active) void refresh(active); else setProfile(null); });
    return () => data.subscription.unsubscribe();
  }, [refresh, supabase]);

  async function updateTask(id: string, status: Task["status"]) {
    if (!supabase || !user) return;
    setSaving(true); setMessage(null);
    const { error } = await supabase.from("team_tasks").update({ status }).eq("id", id);
    setSaving(false);
    if (error) setMessage({ type: "error", text: error.message }); else { setMessage({ type: "success", text: "Task status updated." }); await refresh(user); }
  }

  async function saveAbout(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!supabase || !user) return;
    const values = new FormData(event.currentTarget); setSaving(true); setMessage(null);
    const { error } = await supabase.from("profiles").update({ full_name: String(values.get("fullName") || "").trim(), department: String(values.get("department") || "").trim() || null, job_title: String(values.get("jobTitle") || "").trim() || null, phone: String(values.get("phone") || "").trim() || null, bio: String(values.get("bio") || "").trim() || null }).eq("id", user.id);
    setSaving(false);
    if (error) setMessage({ type: "error", text: error.message }); else { setMessage({ type: "success", text: "Your profile has been updated." }); await refresh(user); }
  }

  async function uploadProfileImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !supabase || !user) return;
    const allowedTypes: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
    const extension = allowedTypes[file.type];
    if (!extension) { setMessage({ type: "error", text: "Choose a JPG, PNG, or WebP image." }); return; }
    if (file.size > 5 * 1024 * 1024) { setMessage({ type: "error", text: "Profile images must be 5 MB or smaller." }); return; }

    setAvatarSaving(true); setMessage(null);
    const path = `${user.id}/profile.${extension}`;
    const { error: uploadError } = await supabase.storage.from("team-profile-images").upload(path, file, { upsert: true, contentType: file.type, cacheControl: "3600" });
    if (uploadError) { setAvatarSaving(false); setMessage({ type: "error", text: uploadError.message }); return; }
    const { data } = supabase.storage.from("team-profile-images").getPublicUrl(path);
    const avatarUrl = `${data.publicUrl}?v=${Date.now()}`;
    const { error: profileError } = await supabase.from("profiles").update({ avatar_url: avatarUrl }).eq("id", user.id);
    setAvatarSaving(false);
    if (profileError) setMessage({ type: "error", text: profileError.message });
    else { setMessage({ type: "success", text: "Your profile image has been updated." }); await refresh(user); }
  }

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!supabase) return;
    const form = event.currentTarget; const password = String(new FormData(form).get("password") || ""); setSaving(true); setMessage(null);
    const { error } = await supabase.auth.updateUser({ password }); setSaving(false);
    if (error) setMessage({ type: "error", text: error.message }); else { form.reset(); setMessage({ type: "success", text: "Your password has been changed." }); }
  }

  async function signOut() {
    if (!supabase) return;
    setSaving(true); setMessage(null);
    const { error } = await supabase.auth.signOut({ scope: "global" });
    if (error) { setSaving(false); setMessage({ type: "error", text: error.message }); return; }
    window.location.replace("/portal#member-signin");
  }

  async function recordAttendance(action: "check_in" | "check_out") {
    if (!supabase || !user) return; setSaving(true); setMessage(null); const now = new Date().toISOString();
    const result = action === "check_in" ? await supabase.from("team_attendance").upsert({ user_id: user.id, attendance_date: today(), check_in: now, status: "present" }, { onConflict: "user_id,attendance_date" }) : await supabase.from("team_attendance").update({ check_out: now }).eq("user_id", user.id).eq("attendance_date", today());
    setSaving(false); if (result.error) setMessage({ type: "error", text: result.error.message }); else { setMessage({ type: "success", text: action === "check_in" ? "Attendance marked." : "Check-out recorded." }); await refresh(user); }
  }

  async function submitReport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!supabase || !user) return; const form = event.currentTarget; const values = new FormData(form); setSaving(true); setMessage(null);
    const { error } = await supabase.from("team_reports").insert({ user_id: user.id, report_type: values.get("reportType"), summary: String(values.get("summary") || "").trim(), achievements: String(values.get("achievements") || "").trim() || null, blockers: String(values.get("blockers") || "").trim() || null, next_steps: String(values.get("nextSteps") || "").trim() || null });
    setSaving(false); if (error) setMessage({ type: "error", text: error.message }); else { form.reset(); setMessage({ type: "success", text: "Your report has been submitted." }); await refresh(user); }
  }

  if (loading) return <PortalState title="Opening your workspace" copy="Checking your DevQuest team access…" />;
  if (!isSupabaseConfigured()) return <PortalState title="Portal configuration required" copy="The Supabase connection is not available in this deployment." />;
  if (!user) return <PortalState title="Sign in to the Team Portal" copy="Use the approved account issued by a DevQuest administrator." action={<a href="#member-signin"><KeyRound /> Open portal login</a>} />;
  if (profile?.role !== "team") return <PortalState title="Team member access required" copy={profile?.role === "admin" ? "Administrator accounts can only use the Admin Portal." : "Your account exists, but the DevQuest administrator has not approved team access."} action={profile?.role === "admin" ? <Link href="/portal/admin"><ShieldCheck /> Open Admin Portal</Link> : undefined} />;

  const name = profile.full_name || user.email?.split("@")[0] || "Team member";
  const currentAttendance = attendance.find((entry) => entry.attendance_date === today());
  return <div className="team-portal-shell">
    <aside className="team-portal-sidebar">
      <Link className="team-portal-wordmark" href="/portal"><span>DQ</span><b>Team<br />Portal</b></Link>
      <nav aria-label="Team portal navigation">{navItems.map(({ id, label, icon: Icon }) => <button key={id} className={tab === id ? "active" : ""} onClick={() => { setTab(id); setMessage(null); }} title={label}><Icon /> {label}</button>)}</nav>
      <div className="team-portal-user"><ProfileAvatar name={name} url={profile.avatar_url} /><div><b>{name}</b><small>{profile.role}</small></div></div>
    </aside>
    <main className="team-portal-main">
      <header className="team-portal-topbar"><div><p>{new Intl.DateTimeFormat("en-PK", { weekday: "long", day: "numeric", month: "long" }).format(new Date())}</p><h1>{navItems.find((item) => item.id === tab)?.label}</h1></div><div className="team-portal-account-actions"><div className="team-portal-top-user"><ProfileAvatar name={name} url={profile.avatar_url} /><div><b>{name}</b><small>{user.email}</small></div></div><button className="portal-signout" type="button" onClick={signOut} disabled={saving} aria-label="Sign out of Team Portal">{saving ? <LoaderCircle className="spin" /> : <LogOut />}<span>Sign out</span></button></div></header>
      {message && <div className={`portal-message ${message.type}`}>{message.type === "success" ? <CheckCircle2 /> : <AlertCircle />}{message.text}</div>}
      {tab === "tasks" && <Tasks tasks={tasks} saving={saving} onUpdate={updateTask} />}
      {tab === "about" && <About profile={profile} name={name} saving={saving} avatarSaving={avatarSaving} onSubmit={saveAbout} onAvatarChange={uploadProfileImage} />}
      {tab === "credentials" && <Credentials email={user.email || ""} role={profile.role} saving={saving} onSubmit={changePassword} />}
      {tab === "attendance" && <AttendancePanel entries={attendance} current={currentAttendance} saving={saving} onRecord={recordAttendance} />}
      {tab === "reports" && <Reports reports={reports} saving={saving} onSubmit={submitReport} />}
    </main>
  </div>;
}

function PortalState({ title, copy, action }: { title: string; copy: string; action?: React.ReactNode }) { return <div className="portal-state"><section><Link className="portal-back" href="/portal"><ArrowLeft /> All portals</Link><div className="portal-state-icon"><ShieldCheck /></div><p className="portal-kicker">TEAM PORTAL</p><h1>{title}</h1><p>{copy}</p>{action && <div className="portal-state-action">{action}</div>}</section></div>; }

function PanelHead({ kicker, title }: { kicker: string; title: string }) { return <div className="portal-panel-head"><div><p>{kicker}</p><h2>{title}</h2></div></div>; }
function Tasks({ tasks, saving, onUpdate }: { tasks: Task[]; saving: boolean; onUpdate: (id: string, status: Task["status"]) => void }) { return <div className="portal-work-grid"><section className="portal-panel"><PanelHead kicker="MY ASSIGNMENTS" title="Tasks assigned by administration" /><div className="portal-task-cards">{tasks.map((task) => <article key={task.id}><div className="portal-task-title"><span className={`task-dot ${task.status}`} /><div><h3>{task.title}</h3><p>{task.description || "No additional details."}</p></div><em className={`priority-${task.priority}`}>{task.priority}</em></div><div className="portal-task-meta"><span>{task.assignee_name || "Assigned to you"}</span><span>{formatDate(task.due_date)}</span><select value={task.status} onChange={(e) => onUpdate(task.id, e.target.value as Task["status"])} disabled={saving}><option value="todo">To do</option><option value="in_progress">In progress</option><option value="completed">Completed</option></select></div></article>)}{!tasks.length && <Empty text="No tasks have been assigned to you." />}</div></section></div>; }
function About({ profile, name, saving, avatarSaving, onSubmit, onAvatarChange }: { profile: Profile; name: string; saving: boolean; avatarSaving: boolean; onSubmit: (event: FormEvent<HTMLFormElement>) => void; onAvatarChange: (event: ChangeEvent<HTMLInputElement>) => void }) { return <div className="portal-work-grid"><section className="portal-panel portal-form-panel"><PanelHead kicker="MY PROFILE" title="About me" /><div className="portal-avatar-editor"><ProfileAvatar name={name} url={profile.avatar_url} className="portal-profile-avatar-large" /><div><h3>Profile image</h3><p>This image appears throughout your personal Team Portal.</p><label className="portal-avatar-upload">{avatarSaving ? <LoaderCircle className="spin" /> : <Camera />}{avatarSaving ? "Uploading…" : profile.avatar_url ? "Change image" : "Upload image"}<input type="file" accept="image/jpeg,image/png,image/webp" onChange={onAvatarChange} disabled={avatarSaving} /></label><small>JPG, PNG, or WebP · Maximum 5 MB</small></div></div><form className="portal-inline-form" onSubmit={onSubmit}><div className="portal-form-row"><label>Full name<input name="fullName" defaultValue={profile.full_name || ""} required /></label><label>Department<input name="department" defaultValue={profile.department || ""} /></label><label>Job title<input name="jobTitle" defaultValue={profile.job_title || ""} /></label></div><label>Phone<input name="phone" defaultValue={profile.phone || ""} autoComplete="tel" /></label><label>Short bio<textarea name="bio" rows={5} defaultValue={profile.bio || ""} /></label><button className="portal-primary" disabled={saving}>{saving ? <LoaderCircle className="spin" /> : <UserRound />} Save profile</button></form></section></div>; }
function Credentials({ email, role, saving, onSubmit }: { email: string; role: string; saving: boolean; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) { return <div className="portal-work-grid credentials-layout"><section className="portal-panel"><PanelHead kicker="ACCOUNT DETAILS" title="Portal login" /><dl className="portal-credentials"><div><dt>Email</dt><dd>{email}</dd></div><div><dt>Access role</dt><dd>{role}</dd></div><div><dt>Password</dt><dd>Hidden for your security</dd></div></dl></section><section className="portal-panel"><PanelHead kicker="SECURITY" title="Change password" /><form className="portal-inline-form" onSubmit={onSubmit}><label>New password<input name="password" type="password" minLength={8} required autoComplete="new-password" placeholder="At least 8 characters" /></label><button className="portal-primary" disabled={saving}>{saving ? <LoaderCircle className="spin" /> : <LockKeyhole />} Update password</button></form></section></div>; }
function AttendancePanel({ entries, current, saving, onRecord }: { entries: Attendance[]; current?: Attendance; saving: boolean; onRecord: (action: "check_in" | "check_out") => void }) { return <div className="portal-work-grid attendance-layout"><section className="attendance-clock-card"><p>TODAY · {today()}</p><Clock3 /><h2>{formatTime(new Date().toISOString())}</h2><span>{current?.check_in ? `Checked in ${formatTime(current.check_in)}` : "Ready when you are"}</span><button className="portal-primary" disabled={saving || Boolean(current?.check_out)} onClick={() => onRecord(current?.check_in ? "check_out" : "check_in")}>{saving ? <LoaderCircle className="spin" /> : <CalendarCheck2 />}{current?.check_out ? "Day completed" : current?.check_in ? "Check out" : "Check in"}</button></section><section className="portal-panel"><PanelHead kicker="PERSONAL RECORD" title="Attendance history" /><div className="attendance-table"><div className="attendance-row attendance-header"><span>Date</span><span>In</span><span>Out</span><span>Status</span></div>{entries.map((entry) => <div className="attendance-row" key={entry.id}><span>{formatDate(entry.attendance_date)}</span><span>{formatTime(entry.check_in)}</span><span>{formatTime(entry.check_out)}</span><span className={`attendance-${entry.status}`}>{entry.status}</span></div>)}{!entries.length && <Empty text="No attendance records yet." />}</div></section></div>; }
function Reports({ reports, saving, onSubmit }: { reports: Report[]; saving: boolean; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) { return <div className="portal-work-grid reports-layout"><section className="portal-panel"><PanelHead kicker="PROGRESS UPDATE" title="Submit report" /><form className="portal-report-form" onSubmit={onSubmit}><label>Period<select name="reportType" defaultValue="weekly"><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option></select></label><label>Summary<textarea name="summary" required rows={3} /></label><label>Achievements<textarea name="achievements" rows={2} /></label><label>Blockers<textarea name="blockers" rows={2} /></label><label>Next steps<textarea name="nextSteps" rows={2} /></label><button className="portal-primary" disabled={saving}>{saving ? <LoaderCircle className="spin" /> : <Send />} Submit report</button></form></section><section className="portal-panel"><PanelHead kicker="SUBMISSION HISTORY" title="My reports" /><div className="portal-report-list">{reports.map((report) => <article key={report.id}><span><FileText /></span><div><div><b>{report.report_type} report</b><small>{formatDate(report.submitted_at)}</small></div><p>{report.summary}</p>{report.blockers && <em>Blocker: {report.blockers}</em>}</div></article>)}{!reports.length && <Empty text="No reports submitted yet." />}</div></section></div>; }
function Empty({ text }: { text: string }) { return <div className="portal-empty"><Circle /> {text}</div>; }
