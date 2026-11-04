"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Award, BookOpen, CalendarClock, CheckCircle2, CircleHelp, GraduationCap, LoaderCircle, Play, Ticket, Video, Zap } from "lucide-react";
import type { StudentTab } from "../student-portal";
import { getSupabaseBrowserClient } from "../../../lib/supabase-browser";

type Course = { id: string; title: string; slug: string; isEnrolled: boolean; thumbnail_url?: string | null };
type Webinar = { id: string; title: string; slug: string; start_time: string; isRegistered: boolean };
type Session = { id: string; title: string; starts_at: string; status: string; enrolled: boolean; joinAvailable: boolean; webinars?: { title?: string } | null; courses?: { title?: string } | null };
type TicketItem = { id?: string; ticket_code?: string; status?: string; issued_at?: string; courses?: { title?: string } | null; webinars?: { title?: string } | null };
type Certificate = { id: string; issued_at?: string; courses?: { title?: string } | null; webinars?: { title?: string } | null };
type StudentDashboardData = {
  name: string;
  studentId: string | null;
  stats: { enrollments: number; tickets: number; certificates: number; completed_lessons: number };
  courses: Course[];
  webinars: Webinar[];
  sessions: Session[];
  tickets: TicketItem[];
  certificates: Certificate[];
};

const emptyData: StudentDashboardData = {
  name: "Student",
  studentId: null,
  stats: { enrollments: 0, tickets: 0, certificates: 0, completed_lessons: 0 },
  courses: [], webinars: [], sessions: [], tickets: [], certificates: [],
};

async function authorizedJson(path: string, token: string) {
  const response = await fetch(path, { headers: { Authorization: `Bearer ${token}` } });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || `Could not load ${path}`);
  return payload;
}

function dateLabel(value: string) {
  return new Intl.DateTimeFormat("en-PK", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: "Asia/Karachi" }).format(new Date(value));
}

function relativeDate(value?: string) {
  if (!value) return "Recently";
  const days = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 86_400_000));
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
}

export function DashboardModule({ setTab }: { setTab: (tab: StudentTab) => void }) {
  const [data, setData] = useState<StudentDashboardData>(emptyData);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [loadedAt, setLoadedAt] = useState(0);

  useEffect(() => {
    let active = true;
    async function load() {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) { if (active) setLoading(false); return; }
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;
        if (!token) { if (active) setLoading(false); return; }
        const results = await Promise.allSettled([
          authorizedJson("/api/student/profile", token),
          authorizedJson("/api/student/courses", token),
          authorizedJson("/api/student/webinars", token),
          authorizedJson("/api/student/sessions", token),
          authorizedJson("/api/student/tickets", token),
          authorizedJson("/api/student/certificates", token),
        ]);
        if (!active) return;
        const [profileResult, courseResult, webinarResult, sessionResult, ticketResult, certificateResult] = results;
        const profileData = profileResult.status === "fulfilled" ? profileResult.value : {};
        const coursesData = courseResult.status === "fulfilled" ? courseResult.value : {};
        const webinarsData = webinarResult.status === "fulfilled" ? webinarResult.value : {};
        const sessionsData = sessionResult.status === "fulfilled" ? sessionResult.value : {};
        const ticketsData = ticketResult.status === "fulfilled" ? ticketResult.value : {};
        const certificatesData = certificateResult.status === "fulfilled" ? certificateResult.value : {};
        const profile = profileData.profile || {};
        const firstFailure = results.find((result) => result.status === "rejected");
        setData({
          name: profile.full_name || sessionData.session?.user?.email?.split("@")[0] || "Student",
          studentId: profile.student_id || null,
          stats: profileData.stats || emptyData.stats,
          courses: (coursesData.courses || []).filter((course: Course) => course.isEnrolled),
          webinars: [...(webinarsData.upcoming || []), ...(webinarsData.past || [])].filter((webinar: Webinar) => webinar.isRegistered),
          sessions: (sessionsData.sessions || []).filter((session: Session) => session.enrolled && session.status !== "cancelled"),
          tickets: ticketsData.tickets || [],
          certificates: certificatesData.certificates || [],
        });
        setLoadedAt(Date.now());
        if (firstFailure?.status === "rejected") setLoadError("Some dashboard details could not be refreshed. Try again in a moment.");
      } catch {
        if (active) setLoadError("We couldn’t load your dashboard right now.");
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => { active = false; };
  }, []);

  const upcomingSessions = data.sessions.filter((session) => new Date(session.starts_at).getTime() >= loadedAt).slice(0, 3);
  const enrollments = [...data.courses.map((course) => ({ id: course.id, title: course.title, kind: "Course", onOpen: () => setTab("courses") })), ...data.webinars.map((webinar) => ({ id: webinar.id, title: webinar.title, kind: "Event", onOpen: () => setTab("webinars") }))].slice(0, 4);
  const recentActivity = [
    ...data.certificates.map((certificate) => ({ id: `certificate-${certificate.id}`, icon: Award, color: "mint", label: `Certificate issued: ${certificate.courses?.title || certificate.webinars?.title || "Program completion"}`, date: certificate.issued_at, tab: "certificates" as StudentTab })),
    ...data.tickets.map((ticket, index) => ({ id: `ticket-${ticket.id || ticket.ticket_code || index}`, icon: Ticket, color: "amber", label: `Support ticket ${ticket.ticket_code || "updated"}${ticket.status ? ` · ${ticket.status}` : ""}`, date: ticket.issued_at, tab: "tickets" as StudentTab })),
  ].sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()).slice(0, 3);

  const stats = [
    { label: "Active enrollments", value: data.stats.enrollments, icon: GraduationCap, color: "blue", tab: "courses" as StudentTab },
    { label: "My tickets", value: data.stats.tickets, icon: Ticket, color: "coral", tab: "tickets" as StudentTab },
    { label: "Certificates", value: data.stats.certificates, icon: Award, color: "violet", tab: "certificates" as StudentTab },
    { label: "Lessons completed", value: data.stats.completed_lessons, icon: BookOpen, color: "sky", tab: "courses" as StudentTab },
  ];

  return (
    <div className="student-dashboard">
      {loadError && <div className="student-dashboard-alert" role="status"><CircleHelp /> {loadError}</div>}
      <section className="student-dashboard-hero">
        <div className="student-dashboard-hero-copy">
          <p>YOUR LEARNING JOURNEY</p>
          <h2>Welcome back to<br /><strong>DevQuest, {data.name}!</strong> <span aria-hidden="true">👋</span></h2>
          <span>Pick up where you left off, find your next session, and keep building your skills.</span>
          <div className="student-dashboard-hero-actions">
            <button type="button" onClick={() => setTab("courses")}><Play /> Browse courses <ArrowRight /></button>
            <button type="button" className="secondary" onClick={() => setTab("sessions")}><CalendarClock /> Upcoming sessions</button>
          </div>
        </div>
        <div className="student-dashboard-hero-art" aria-hidden="true"><div className="student-hero-screen"><span>DQ</span><i>&lt;/&gt;</i></div><div className="student-hero-book book-one" /><div className="student-hero-book book-two" /><div className="student-hero-cap">◆</div></div>
      </section>

      <section className="student-dashboard-stats" aria-label="Learning summary">
        {stats.map(({ label, value, icon: Icon, color, tab: target }) => <button className={`student-summary-card ${color}`} type="button" key={label} onClick={() => setTab(target)}><span><Icon /></span><div><strong>{loading ? <LoaderCircle className="spin" /> : value}</strong><small>{label}</small></div><ArrowRight className="student-summary-arrow" /></button>)}
      </section>

      <div className="student-dashboard-grid">
        <section className="student-dashboard-panel student-upcoming-panel">
          <header><div><span className="panel-icon blue"><CalendarClock /></span><h3>Upcoming sessions</h3></div><button type="button" onClick={() => setTab("sessions")}>View all <ArrowRight /></button></header>
          {loading ? <div className="student-dashboard-loading"><LoaderCircle className="spin" /> Loading your sessions…</div> : upcomingSessions.length ? <div className="student-session-list">{upcomingSessions.map((session) => <article key={session.id}><span className="student-program-icon"><Video /></span><div><b>{session.title}</b><small>{dateLabel(session.starts_at)}</small></div>{session.joinAvailable ? <span className="student-live-badge">Join now</span> : <span className="student-session-status">Scheduled</span>}<button type="button" aria-label={`Open ${session.title}`} onClick={() => setTab("sessions")}><ArrowRight /></button></article>)}</div> : <div className="student-dashboard-empty"><CalendarClock /><div><b>No upcoming sessions yet</b><small>New sessions for your enrolled programs will show up here.</small></div><button type="button" onClick={() => setTab("sessions")}>Browse sessions</button></div>}
        </section>

        <section className="student-dashboard-panel student-enrollments-panel">
          <header><div><span className="panel-icon violet"><BookOpen /></span><h3>My enrollments</h3></div><button type="button" onClick={() => setTab("courses")}>View all <ArrowRight /></button></header>
          {loading ? <div className="student-dashboard-loading"><LoaderCircle className="spin" /> Loading your learning…</div> : enrollments.length ? <div className="student-enrollment-list">{enrollments.map((item) => <button type="button" key={`${item.kind}-${item.id}`} onClick={item.onOpen}><span className="student-program-icon"><BookOpen /></span><span><b>{item.title}</b><small>{item.kind} · Enrolled</small></span><span className="student-enrolled-tag"><CheckCircle2 /> Active</span><ArrowRight /></button>)}</div> : <div className="student-dashboard-empty"><GraduationCap /><div><b>Your learning starts here</b><small>Explore the course and event catalog to find your next program.</small></div><button type="button" onClick={() => setTab("courses")}>Explore courses</button></div>}
        </section>

        <section className="student-dashboard-panel student-activity-panel">
          <header><div><span className="panel-icon mint"><Zap /></span><h3>Recent activity</h3></div><button type="button" onClick={() => setTab("tickets")}>View tickets <ArrowRight /></button></header>
          {recentActivity.length ? <div className="student-activity-list">{recentActivity.map(({ id, icon: Icon, color, label, date, tab: target }) => <button type="button" key={id} onClick={() => setTab(target)}><span className={`student-activity-icon ${color}`}><Icon /></span><b>{label}</b><small>{relativeDate(date)}</small></button>)}</div> : <div className="student-dashboard-empty compact"><Zap /><div><b>Your activity will show here</b><small>Enrollments, certificates, and ticket updates will appear as you use the portal.</small></div></div>}
        </section>

        <section className="student-dashboard-panel student-quick-panel">
          <header><div><span className="panel-icon blue"><Zap /></span><h3>Quick actions</h3></div></header>
          <div className="student-quick-actions"><button type="button" onClick={() => setTab("courses")}><span className="blue"><BookOpen /></span><b>Enroll in a course</b></button><button type="button" onClick={() => setTab("support")}><span className="amber"><Ticket /></span><b>Create a ticket</b></button><button type="button" onClick={() => setTab("certificates")}><span className="mint"><Award /></span><b>My certificates</b></button><button type="button" onClick={() => setTab("profile")}><span className="violet"><UserIcon /></span><b>Update profile</b></button></div>
        </section>
      </div>

      <div className="student-dashboard-id"><GraduationCap /> {data.studentId ? <>DevQuest Student ID <strong>{data.studentId}</strong></> : <>Your profile details help us keep your learning records up to date.</>} <button type="button" onClick={() => setTab("profile")}>Manage profile <ArrowRight /></button></div>
    </div>
  );
}

function UserIcon() { return <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="4" /><path d="M5 21v-2a7 7 0 0 1 14 0v2" /></svg>; }
