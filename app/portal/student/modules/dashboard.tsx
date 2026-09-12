import { useEffect, useState } from "react";
import { Award, BookOpen, ChevronRight, FolderLock, LayoutDashboard, Ticket, Video } from "lucide-react";
import type { StudentTab } from "../student-portal";
import { getSupabaseBrowserClient } from "../../../lib/supabase-browser";

export function DashboardModule({ setTab }: { setTab: (tab: StudentTab) => void }) {
  const [stats, setStats] = useState({ enrollments: 0, tickets: 0, certificates: 0 });
  const [loading, setLoading] = useState(true);
  const supabase = getSupabaseBrowserClient();

  useEffect(() => {
    async function load() {
      if (!supabase) return;
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return;
        
        const response = await fetch("/api/student/profile", {
          headers: { Authorization: `Bearer ${session.access_token}` }
        });
        const data = await response.json();
        
        if (data.stats) {
          setStats(data.stats);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [supabase]);

  const statCards = [
    { label: "Active Enrollments", value: stats.enrollments, icon: BookOpen, tone: "blue" },
    { label: "My Tickets", value: stats.tickets, icon: Ticket, tone: "gold" },
    { label: "Certificates", value: stats.certificates, icon: Award, tone: "purple" },
  ] as const;

  return (
    <div className="portal-dashboard">
      <section className="portal-welcome">
        <div>
          <p>DASHBOARD</p>
          <h2>Welcome back to DevQuest.</h2>
          <span>Continue your learning journey, explore new programs, and track your achievements.</span>
        </div>
        <button onClick={() => setTab("courses")}>Browse courses</button>
      </section>
      
      <div className="portal-stat-grid">
        {statCards.map(({ label, value, icon: Icon, tone }) => (
          <article className={`portal-stat ${tone}`} key={label}>
            <span><Icon /></span>
            <div>
              <strong>{loading ? "-" : value}</strong>
              <p>{label}</p>
            </div>
          </article>
        ))}
      </div>

      <div className="portal-work-grid dashboard-actions" style={{ marginTop: 24, gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <article className="portal-panel" onClick={() => setTab("webinars")} style={{ cursor: "pointer" }}>
          <div className="portal-panel-head">
            <div>
              <p>LIVE SESSIONS</p>
              <h2 style={{ fontSize: "1.1rem" }}>Upcoming Webinars</h2>
            </div>
            <Video size={18} color="#315fba" />
          </div>
          <p style={{ fontSize: "0.75rem", color: "#637086", marginTop: 12 }}>Join live expert sessions and masterclasses.</p>
        </article>
        
        <article className="portal-panel" onClick={() => setTab("vault")} style={{ cursor: "pointer" }}>
          <div className="portal-panel-head">
            <div>
              <p>DOWNLOADS</p>
              <h2 style={{ fontSize: "1.1rem" }}>Resource Vault</h2>
            </div>
            <FolderLock size={18} color="#315fba" />
          </div>
          <p style={{ fontSize: "0.75rem", color: "#637086", marginTop: 12 }}>Access slides, source code, and PDFs.</p>
        </article>
        
        <article className="portal-panel" onClick={() => setTab("profile")} style={{ cursor: "pointer" }}>
          <div className="portal-panel-head">
            <div>
              <p>ACCOUNT</p>
              <h2 style={{ fontSize: "1.1rem" }}>Update Profile</h2>
            </div>
            <ChevronRight size={18} color="#315fba" />
          </div>
          <p style={{ fontSize: "0.75rem", color: "#637086", marginTop: 12 }}>Keep your tech stack and details current.</p>
        </article>
      </div>
    </div>
  );
}
