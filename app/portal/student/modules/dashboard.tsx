import { useEffect, useState } from "react";
import { Award, BookOpen, ChevronRight, FolderLock, LayoutDashboard, Ticket, Video, ArrowUpRight, LoaderCircle } from "lucide-react";
import type { StudentTab } from "../student-portal";
import { getSupabaseBrowserClient } from "../../../lib/supabase-browser";

export function DashboardModule({ setTab }: { setTab: (tab: StudentTab) => void }) {
  const [stats, setStats] = useState({ enrollments: 0, tickets: 0, certificates: 0, completed_lessons: 0 });
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
    { label: "Active Enrollments", value: stats.enrollments, icon: BookOpen, bgColor: "bg-blue-500", iconColor: "text-blue-500" },
    { label: "My Tickets", value: stats.tickets, icon: Ticket, bgColor: "bg-amber-500", iconColor: "text-amber-500" },
    { label: "Certificates", value: stats.certificates, icon: Award, bgColor: "bg-purple-500", iconColor: "text-purple-500" },
  ] as const;

  return (
    <div className="flex flex-col gap-6 pt-4 pb-12">
      {/* Welcome Hero Banner */}
      <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#061e3d] via-[#0a2e5c] to-[#145adc] p-8 md:p-12 text-white shadow-xl shadow-blue-900/20">
        {/* Decorative elements */}
        <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-blue-500/20 blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-emerald-500/20 blur-3xl pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="max-w-xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold tracking-wider text-blue-200 backdrop-blur-md border border-white/10 mb-6">
              <LayoutDashboard size={14} /> DASHBOARD
            </span>
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 leading-tight">
              Welcome back to <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-emerald-300">DevQuest.</span>
            </h2>
            <p className="text-blue-100/80 text-lg max-w-md leading-relaxed">
              Continue your learning journey, explore new programs, and track your achievements.
            </p>
          </div>
          <button 
            onClick={() => setTab("courses")}
            className="group inline-flex items-center justify-center gap-2 rounded-full bg-emerald-400 hover:bg-emerald-300 transition-all px-6 py-3.5 text-sm font-bold text-[#061e3d] shadow-lg shadow-emerald-500/30 hover:-translate-y-0.5 active:translate-y-0"
          >
            Browse courses
            <ArrowUpRight size={18} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </button>
        </div>
      </section>
      
      {/* Progress & Stats Grid */}
      {!loading && stats.enrollments > 0 && (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col md:flex-row items-center gap-6 justify-between">
          <div className="flex-1 w-full">
            <div className="flex justify-between items-center mb-2">
              <span className="font-bold text-slate-700 text-sm">Learning Progress</span>
              <span className="text-emerald-600 font-bold text-sm bg-emerald-50 px-2 py-0.5 rounded-full">{stats.completed_lessons} Lessons Completed</span>
            </div>
            <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-emerald-400 rounded-full transition-all duration-1000" 
                style={{ width: `${Math.min((stats.completed_lessons / (stats.enrollments * 5)) * 100, 100)}%` }}
              ></div>
            </div>
            <p className="text-xs text-slate-500 mt-2">Keep up the momentum! You're doing great.</p>
          </div>
          <div className="hidden md:block w-px h-12 bg-slate-100"></div>
          <div className="flex shrink-0 items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-orange-500 font-black text-xl">
              🔥
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">3 Day</p>
              <p className="text-xs font-medium text-slate-500">Streak</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statCards.map(({ label, value, icon: Icon, iconColor }) => (
          <article 
            key={label}
            className="flex items-center gap-5 rounded-3xl bg-white p-6 shadow-sm border border-slate-100 transition-all hover:shadow-md hover:border-blue-100 group"
          >
            <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-slate-50 transition-colors group-hover:bg-blue-50/50 ${iconColor}`}>
              <Icon size={24} strokeWidth={2.5} />
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                {loading ? (
                  <div className="h-9 w-16 bg-slate-200 rounded-lg animate-pulse my-0.5"></div>
                ) : (
                  <strong className="text-3xl font-black text-slate-800 tracking-tight">
                    {value}
                  </strong>
                )}
              </div>
              <p className="text-sm font-medium text-slate-500 tracking-wide">{label}</p>
            </div>
          </article>
        ))}
      </div>

      {/* Rich Empty State for New Users */}
      {!loading && stats.enrollments === 0 && (
        <div className="rounded-3xl border-2 border-dashed border-blue-200 bg-blue-50/50 p-8 text-center flex flex-col items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-blue-600 mb-2">
            <BookOpen size={32} />
          </div>
          <h3 className="text-2xl font-bold text-slate-800">Your journey starts here</h3>
          <p className="text-slate-600 max-w-md">
            You aren't enrolled in any courses yet. Browse our library of premium development courses to kickstart your career.
          </p>
          <button 
            onClick={() => setTab("courses")}
            className="mt-4 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-500 transition-all"
          >
            Explore Courses
          </button>
        </div>
      )}

      {/* Action Bento Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <button 
          onClick={() => setTab("webinars")} 
          className="group text-left relative overflow-hidden rounded-3xl bg-white p-6 shadow-sm border border-slate-100 transition-all hover:shadow-lg hover:-translate-y-1 hover:border-emerald-200"
        >
          <div className="absolute top-0 right-0 p-6 opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-1 group-hover:-translate-y-1">
            <ChevronRight className="text-emerald-500" />
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 mb-5 group-hover:scale-110 transition-transform duration-300">
            <Video size={22} strokeWidth={2.5} />
          </div>
          <span className="block text-xs font-bold tracking-widest text-emerald-600/80 mb-2">LIVE SESSIONS</span>
          <h3 className="text-xl font-bold text-slate-800 mb-2">Upcoming Webinars</h3>
          <p className="text-sm text-slate-500 leading-relaxed pr-6">Join live expert sessions and exclusive masterclasses.</p>
        </button>
        
        <button 
          onClick={() => setTab("vault")} 
          className="group text-left relative overflow-hidden rounded-3xl bg-white p-6 shadow-sm border border-slate-100 transition-all hover:shadow-lg hover:-translate-y-1 hover:border-indigo-200"
        >
          <div className="absolute top-0 right-0 p-6 opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-1 group-hover:-translate-y-1">
            <ChevronRight className="text-indigo-500" />
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 mb-5 group-hover:scale-110 transition-transform duration-300">
            <FolderLock size={22} strokeWidth={2.5} />
          </div>
          <span className="block text-xs font-bold tracking-widest text-indigo-600/80 mb-2">DOWNLOADS</span>
          <h3 className="text-xl font-bold text-slate-800 mb-2">Resource Vault</h3>
          <p className="text-sm text-slate-500 leading-relaxed pr-6">Access presentation slides, source code, and PDFs.</p>
        </button>
        
        <button 
          onClick={() => setTab("profile")} 
          className="group text-left relative overflow-hidden rounded-3xl bg-white p-6 shadow-sm border border-slate-100 transition-all hover:shadow-lg hover:-translate-y-1 hover:border-blue-200"
        >
          <div className="absolute top-0 right-0 p-6 opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-1 group-hover:-translate-y-1">
            <ChevronRight className="text-blue-500" />
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 mb-5 group-hover:scale-110 transition-transform duration-300">
            <LayoutDashboard size={22} strokeWidth={2.5} />
          </div>
          <span className="block text-xs font-bold tracking-widest text-blue-600/80 mb-2">ACCOUNT</span>
          <h3 className="text-xl font-bold text-slate-800 mb-2">Update Profile</h3>
          <p className="text-sm text-slate-500 leading-relaxed pr-6">Keep your tech stack, resume, and details current.</p>
        </button>
      </div>
    </div>
  );
}
