"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { ArrowLeft, Award, BookOpen, FolderLock, LayoutDashboard, LoaderCircle, LogOut, ShieldCheck, Ticket, UserRound, Video } from "lucide-react";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "../../lib/supabase-browser";
import { DashboardModule } from "./modules/dashboard";
import { CoursesModule } from "./modules/courses";
import { WebinarsModule } from "./modules/webinars";
import { TicketsModule } from "./modules/tickets";
import { VaultModule } from "./modules/vault";
import { CertificatesModule } from "./modules/certificates";
import { ProfileModule } from "./modules/profile";

export type StudentTab = "dashboard" | "courses" | "webinars" | "tickets" | "vault" | "certificates" | "profile";

const navItems = [
  { id: "dashboard" as const, label: "Dashboard", icon: LayoutDashboard },
  { id: "courses" as const, label: "Courses", icon: BookOpen },
  { id: "webinars" as const, label: "Webinars", icon: Video },
  { id: "tickets" as const, label: "My Tickets", icon: Ticket },
  { id: "vault" as const, label: "Resource Vault", icon: FolderLock },
  { id: "certificates" as const, label: "Certificates", icon: Award },
  { id: "profile" as const, label: "Profile", icon: UserRound },
];

export function StudentPortal() {
  const [tab, setTab] = useState<StudentTab>("dashboard");
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const supabase = getSupabaseBrowserClient();

  const refresh = useCallback(async (activeUser: User) => {
    if (!supabase) return;
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", activeUser.id)
      .single();
    
    setRole(profile?.role || null);
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
    window.location.replace("/portal#member-signin");
  }

  if (loading) return <PortalState title="Opening your learning space" copy="Checking your DevQuest access…" />;
  if (!isSupabaseConfigured()) return <PortalState title="Portal configuration required" copy="The Supabase connection is not available in this deployment." />;
  if (!user) return <PortalState title="Sign in to the Student Portal" copy="Log in to access your courses, webinars, and certificates." action={<a href="#member-signin"><UserRound /> Open login</a>} />;
  
  if (role !== "student" && role !== "admin") {
    return <PortalState title="Student access required" copy="Your account exists, but you do not have Student access." />;
  }

  const name = user.email?.split("@")[0] || "Student";

  return (
    <div className="team-portal-shell student-portal-shell">
      <aside className="team-portal-sidebar student-sidebar">
        <Link className="team-portal-wordmark" href="/portal">
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
            <small>DevQuest Student</small>
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
          {tab === "tickets" && <TicketsModule />}
          {tab === "vault" && <VaultModule />}
          {tab === "certificates" && <CertificatesModule />}
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
        <Link className="portal-back" href="/portal"><ArrowLeft /> All portals</Link>
        <div className="portal-state-icon"><ShieldCheck /></div>
        <p className="portal-kicker">STUDENT PORTAL</p>
        <h1>{title}</h1>
        <p>{copy}</p>
        {action && <div className="portal-state-action">{action}</div>}
      </section>
    </div>
  ); 
}
