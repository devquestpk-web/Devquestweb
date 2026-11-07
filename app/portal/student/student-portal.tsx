"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { ArrowLeft, Award, Bell, BookOpen, CalendarClock, FolderLock, LayoutDashboard, LifeBuoy, LoaderCircle, LogOut, Menu, Search, ShieldCheck, Ticket, UserRound, Video, X } from "lucide-react";
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
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [portalSearch, setPortalSearch] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
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

  useEffect(() => {
    const shortcut = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") { event.preventDefault(); searchRef.current?.focus(); }
    };
    window.addEventListener("keydown", shortcut); return () => window.removeEventListener("keydown", shortcut);
  }, []);

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
      {mobileNavOpen && <button className="student-nav-backdrop" type="button" aria-label="Close navigation" onClick={() => setMobileNavOpen(false)} />}
      <aside className={`team-portal-sidebar student-sidebar${mobileNavOpen ? " is-open" : ""}`}>
        <Link className="team-portal-wordmark" href="/">
          <span>DQ</span><b>Student<br />Portal</b>
        </Link>
        <button className="student-nav-close" type="button" aria-label="Close navigation" onClick={() => setMobileNavOpen(false)}><X /></button>
        <nav aria-label="Student portal navigation">
          {navItems.map(({ id, label, icon: Icon }) => (
            <button key={id} className={tab === id ? "active" : ""} onClick={() => { setTab(id); setPortalSearch(""); setMobileNavOpen(false); }} title={label}>
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
          <button className="student-nav-open" type="button" aria-label="Open navigation" onClick={() => setMobileNavOpen(true)}><Menu /></button>
          <div className="student-page-heading">
            <p>LEARNING & OPPORTUNITIES</p>
            <h1>{navItems.find((item) => item.id === tab)?.label}</h1>
          </div>
          <label className="student-global-search"><Search /><input ref={searchRef} value={portalSearch} onChange={(event) => setPortalSearch(event.target.value)} placeholder={`Search ${tab === "tickets" ? "tickets or codes" : tab === "certificates" ? "certificates" : tab === "webinars" ? "webinars or topics" : "courses, sessions, or resources"}...`} aria-label="Search current portal page" /><kbd>Ctrl + K</kbd></label>
          <div className="team-portal-account-actions">
            <button className="student-notification-button" type="button" aria-label="Notifications"><Bell /><span /></button>
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
          {tab === "webinars" && <WebinarsModule searchQuery={portalSearch} />}
          {tab === "sessions" && <SessionsModule />}
          {tab === "tickets" && <TicketsModule searchQuery={portalSearch} />}
          {tab === "vault" && <VaultModule />}
          {tab === "certificates" && <CertificatesModule searchQuery={portalSearch} />}
          {tab === "support" && <SupportModule searchQuery={portalSearch} />}
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
