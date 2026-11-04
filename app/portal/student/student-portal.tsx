"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { ArrowLeft, Award, BookOpen, CalendarClock, FolderLock, LayoutDashboard, LifeBuoy, LoaderCircle, LogOut, ShieldCheck, Ticket, UserRound, Video } from "lucide-react";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "../../lib/supabase-browser";
import { DashboardModule } from "./modules/dashboard";
import { CoursesModule } from "./modules/courses";
import { WebinarsModule } from "./modules/webinars";
import { TicketsModule } from "./modules/tickets";
import { VaultModule } from "./modules/vault";
import { CertificatesModule } from "./modules/certificates";
import { ProfileModule } from "./modules/profile";
import { SessionsModule } from "./modules/sessions";
import { SupportModule } from "./modules/support";

export type StudentTab = "dashboard" | "courses" | "webinars" | "sessions" | "tickets" | "vault" | "certificates" | "support" | "profile";

const navItems = [
  { id: "dashboard" as const, label: "Dashboard", icon: LayoutDashboard },
  { id: "courses" as const, label: "Courses", icon: BookOpen },
  { id: "webinars" as const, label: "Webinars", icon: Video },
  { id: "sessions" as const, label: "My Sessions", icon: CalendarClock },
  { id: "tickets" as const, label: "My Tickets", icon: Ticket },
  { id: "vault" as const, label: "Resource Vault", icon: FolderLock },
  { id: "certificates" as const, label: "Certificates", icon: Award },
  { id: "support" as const, label: "Support", icon: LifeBuoy },
  { id: "profile" as const, label: "Profile", icon: UserRound },
];

export function StudentPortal() {
  const [tab, setTab] = useState<StudentTab>("dashboard");
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(true);
  const [studentName, setStudentName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const supabase = getSupabaseBrowserClient();

  const refresh = useCallback(async (activeUser: User) => {
    if (!supabase) return;
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, is_active, full_name, student_id")
      .eq("id", activeUser.id)
      .single();
    
    setRole(profile?.role || null);
    setIsActive(profile?.is_active !== false);
    setStudentName(profile?.full_name || "");
    setStudentId(profile?.student_id || "");
  }, [supabase]);

  useEffect(() => {
    if (!supabase) { queueMicrotask(() => setLoading(false)); return; }
    supabase.auth.getSession().then(async ({ data }) => { 
      const active = data.session?.user ?? null; 
      setUser(active); 
      if (active) await refresh(active); 
      setLoading(false); 
    });
    
    const { data } = supabase.auth.onAuthStateChange((_event, session) => { 
      const active = session?.user ?? null; 
      setUser(active); 
      if (active) void refresh(active); 
      else setRole(null); 
    });
    
    return () => data.subscription.unsubscribe();
  }, [refresh, supabase]);

  async function signOut() {
    if (!supabase) return;
    setSaving(true);
    await supabase.auth.signOut({ scope: "global" });
    window.location.replace("/#member-signin");
  }

  if (loading) return <PortalState title="Opening your learning space" copy="Checking your DevQuest access…" />;
  if (!isSupabaseConfigured()) return <PortalState title="Portal configuration required" copy="The Supabase connection is not available in this deployment." />;
  if (!user) return <PortalState title="Sign in to the Student Portal" copy="Log in to access your courses, webinars, and certificates." action={<a href="#member-signin"><UserRound /> Open login</a>} />;
  
  if (!isActive || (role !== "student" && role !== "admin")) {
    return <PortalState title="Student access required" copy="Your account exists, but you do not have Student access." />;
  }

  const name = studentName || user.email?.split("@")[0] || "Student";

  return (
    <div className="team-portal-shell student-portal-shell">
      <aside className="team-portal-sidebar student-sidebar">
        <Link className="team-portal-wordmark" href="/">
          <span>DQ</span><b>Student<br />Portal</b>
        </Link>
        <nav aria-label="Student portal navigation">
          {navItems.map(({ id, label, icon: Icon }) => (
            <button key={id} className={tab === id ? "active" : ""} onClick={() => setTab(id)} title={label}>
              <Icon /> {label}
            </button>
          ))}
        </nav>
        <div className="team-portal-user">
          <span className="student-avatar-placeholder">ST</span>
          <div>
            <b>{name}</b>
            <small>{studentId || "DevQuest Student"}</small>
          </div>
        </div>
      </aside>
      <main className="team-portal-main">
        <header className="team-portal-topbar">
          <div>
            <p>LEARNING & OPPORTUNITIES</p>
            <h1>{navItems.find((item) => item.id === tab)?.label}</h1>
          </div>
          <div className="team-portal-account-actions">
            <div className="team-portal-top-user">
              <span className="student-avatar-placeholder">ST</span>
              <div>
                <b>{name}</b>
                <small>{user.email}</small>
              </div>
            </div>
            <button className="portal-signout" type="button" onClick={signOut} disabled={saving} aria-label="Sign out">
              {saving ? <LoaderCircle className="spin" /> : <LogOut />}
              <span>Sign out</span>
            </button>
          </div>
        </header>
        
        <div className="student-portal-content">
          {tab === "dashboard" && <DashboardModule setTab={setTab} />}
          {tab === "courses" && <CoursesModule />}
          {tab === "webinars" && <WebinarsModule />}
          {tab === "sessions" && <SessionsModule />}
          {tab === "tickets" && <TicketsModule />}
          {tab === "vault" && <VaultModule />}
          {tab === "certificates" && <CertificatesModule />}
          {tab === "support" && <SupportModule />}
          {tab === "profile" && <ProfileModule />}
        </div>
      </main>
    </div>
  );
}

function PortalState({ title, copy, action }: { title: string; copy: string; action?: React.ReactNode }) { 
  return (
    <div className="portal-state">
      <section>
        <Link className="portal-back" href="/"><ArrowLeft /> Back to website</Link>
        <div className="portal-state-icon"><ShieldCheck /></div>
        <p className="portal-kicker">STUDENT PORTAL</p>
        <h1>{title}</h1>
        <p>{copy}</p>
        {action && <div className="portal-state-action">{action}</div>}
      </section>
    </div>
  ); 
}
