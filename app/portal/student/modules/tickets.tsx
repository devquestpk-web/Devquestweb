import { useEffect, useState } from "react";
import { Award, Circle, Download, ExternalLink, LoaderCircle, Share2 } from "lucide-react";
import { getSupabaseBrowserClient } from "../../../lib/supabase-browser";

export function CertificatesModule() {
  const [certificates, setCertificates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = getSupabaseBrowserClient();

  useEffect(() => {
    async function load() {
      if (!supabase) return;
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return;
        
        const response = await fetch("/api/student/certificates", {
          headers: { Authorization: `Bearer ${session.access_token}` }
        });
        const data = await response.json();
        
        if (data.certificates) {
          setCertificates(data.certificates);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [supabase]);

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    alert("Verification link copied to clipboard");
  };

  if (loading) {
    return <div style={{ padding: "40px", textAlign: "center" }}><LoaderCircle className="spin" style={{ margin: "0 auto" }} /></div>;
  }

  return (
    <div className="portal-work-grid" style={{ gridTemplateColumns: '1fr' }}>
      <section className="portal-panel">
        <div className="portal-panel-head" style={{ marginBottom: 24 }}>
          <div>
            <p>ACHIEVEMENTS</p>
            <h2>My Certificates</h2>
          </div>
        </div>
        
        <div className="certificate-gallery">
          {certificates.map((cert) => {
            const title = cert.item_type === "COURSE" ? cert.courses?.title : cert.webinars?.title;
            
            return (
              <article className="certificate-card" key={cert.id}>
                <div className="certificate-card-visual">
                  <div className="certificate-card-inner">
                    <Award size={48} color="#469bff" opacity={0.2} style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)" }} />
                    <h4 style={{ textAlign: "center", margin: 0, fontSize: "0.85rem", color: "#071427" }}>{title}</h4>
                  </div>
                </div>
                <div className="certificate-card-meta">
                  <h3>{title}</h3>
                  <span style={{ display: "block", fontSize: "0.75rem", color: "#748299", margin: "4px 0 16px" }}>
                    Issued on {new Intl.DateTimeFormat("en-PK", { dateStyle: "long" }).format(new Date(cert.issued_at))}
                  </span>
                  
                  <div style={{ display: "flex", gap: 8 }}>
                    <a href={cert.pdf_url} target="_blank" rel="noopener noreferrer" className="portal-primary" style={{ flex: 1, height: 36, padding: 0, justifyContent: "center", fontSize: "0.8rem" }}>
                      <Download size={14} style={{ marginRight: 6 }} /> PDF
                    </a>
                    <button className="portal-secondary" style={{ flex: 1, height: 36, padding: 0, justifyContent: "center", fontSize: "0.8rem" }} onClick={() => handleCopyLink(cert.verification_url)}>
                      <Share2 size={14} style={{ marginRight: 6 }} /> Link
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
          
          {certificates.length === 0 && (
            <div className="portal-empty" style={{ gridColumn: "1 / -1", padding: 60 }}>
              <Circle /> Complete courses or attend webinars to earn certificates.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
import { useEffect, useState } from "react";
import { ArrowLeft, BookOpenCheck, CheckCircle2, Circle, GraduationCap, LoaderCircle, PlayCircle, ShieldCheck } from "lucide-react";
import { getSupabaseBrowserClient } from "../../../lib/supabase-browser";

export function CoursesModule() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const supabase = getSupabaseBrowserClient();

  useEffect(() => {
    async function load() {
      if (!supabase) return;
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return;
        
        const response = await fetch("/api/student/courses", {
          headers: { Authorization: `Bearer ${session.access_token}` }
        });
        const data = await response.json();
        
        if (data.courses) {
          setCourses(data.courses);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [supabase]);

  if (loading) {
    return <div style={{ padding: "40px", textAlign: "center" }}><LoaderCircle className="spin" style={{ margin: "0 auto" }} /></div>;
  }

  if (selectedSlug) {
    return <CourseDetail slug={selectedSlug} onBack={() => setSelectedSlug(null)} supabase={supabase!} />;
  }

  return (
    <div className="portal-work-grid" style={{ gridTemplateColumns: '1fr' }}>
      <section className="portal-panel">
        <div className="portal-panel-head">
          <div>
            <p>LEARNING PATHS</p>
            <h2>Course Catalog</h2>
          </div>
        </div>
        
        <div className="course-catalog-grid">
          {courses.map((course) => (
            <article className="course-card" key={course.id} onClick={() => setSelectedSlug(course.slug)}>
              <div className="course-card-thumb" style={{ backgroundImage: course.thumbnail_url ? `url(${course.thumbnail_url})` : 'linear-gradient(135deg, #10213b, #15335c)' }}>
                <span className="course-price-badge">{course.price === 0 ? "Free" : `Rs ${course.price}`}</span>
              </div>
              <div className="course-card-content">
                <h3>{course.title}</h3>
                <p>{course.description}</p>
                <div className="course-card-meta">
                  <span>{course.instructor_name || "DevQuest Team"}</span>
                  {course.isEnrolled ? (
                    <span className="enrolled-badge"><CheckCircle2 size={14} /> Enrolled</span>
                  ) : (
                    <span className="available-badge">Available</span>
                  )}
                </div>
              </div>
            </article>
          ))}
          
          {courses.length === 0 && (
            <div className="portal-empty" style={{ gridColumn: "1 / -1" }}>
              <Circle /> No courses published yet.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function CourseDetail({ slug, onBack, supabase }: { slug: string, onBack: () => void, supabase: any }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [activeLesson, setActiveLesson] = useState<any>(null);

  const load = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(`/api/student/courses/${slug}`, {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      const result = await response.json();
      if (result.course) {
        setData(result);
        if (result.isEnrolled && result.lessons?.length > 0) {
          // Find first uncompleted lesson
          const firstUnfinished = result.lessons.find((l: any) => !result.progress[l.id]);
          setActiveLesson(firstUnfinished || result.lessons[0]);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [slug, supabase]);

  const handleEnroll = async () => {
    setEnrolling(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch("/api/student/checkout", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}` 
        },
        body: JSON.stringify({ itemType: "COURSE", courseId: data.course.id })
      });
      const result = await response.json();
      if (result.success) {
        alert(`Successfully enrolled! Your ticket code is ${result.ticketCode}`);
        load();
      } else {
        alert(result.error || "Enrollment failed");
      }
    } catch (e) {
      alert("Checkout error");
    } finally {
      setEnrolling(false);
    }
  };

  const markComplete = async (lessonId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch("/api/student/progress", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}` 
        },
        body: JSON.stringify({ lessonId })
      });
      const result = await response.json();
      if (result.success) {
        if (result.courseCompleted) {
          alert("Congratulations! You have completed the course and your certificate is generating.");
        }
        load();
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading || !data) return <div style={{ padding: "40px", textAlign: "center" }}><LoaderCircle className="spin" style={{ margin: "0 auto" }} /></div>;

  const { course, isEnrolled, lessons, progress } = data;

  if (isEnrolled && activeLesson) {
    return (
      <div className="course-player">
        <div className="course-player-main">
          <button className="portal-mini-action" onClick={onBack} style={{ marginBottom: 16 }}><ArrowLeft /> Back to catalog</button>
          <h2>{activeLesson.title}</h2>
          
          <div className="video-container">
            {activeLesson.video_url ? (
              <iframe 
                src={activeLesson.video_url} 
                frameBorder="0" 
                allow="autoplay; fullscreen" 
                allowFullScreen
                style={{ width: "100%", aspectRatio: "16/9", borderRadius: 12, background: "#030a14" }}
              />
            ) : (
              <div style={{ width: "100%", aspectRatio: "16/9", borderRadius: 12, background: "#030a14", display: "grid", placeItems: "center", color: "#555" }}>
                Video unavailable
              </div>
            )}
          </div>
          
          <div className="player-actions" style={{ marginTop: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ margin: 0 }}>{course.title}</h3>
            {!progress[activeLesson.id] ? (
              <button className="portal-primary" onClick={() => markComplete(activeLesson.id)}><CheckCircle2 /> Mark as completed</button>
            ) : (
              <span style={{ color: "#26a86d", display: "flex", alignItems: "center", gap: 6, fontSize: "0.8rem", fontWeight: 700 }}><CheckCircle2 size={18} /> Completed</span>
            )}
          </div>
        </div>
        
        <aside className="lesson-sidebar">
          <h3>Course Content</h3>
          <div className="lesson-list">
            {lessons.map((lesson: any) => {
              const isFinished = progress[lesson.id];
              const isActive = activeLesson.id === lesson.id;
              
              return (
                <button 
                  key={lesson.id} 
                  className={`lesson-item ${isActive ? 'active' : ''} ${isFinished ? 'finished' : ''}`}
                  onClick={() => setActiveLesson(lesson)}
                >
                  <div className="lesson-item-icon">
                    {isFinished ? <CheckCircle2 size={16} color="#26a86d" /> : <PlayCircle size={16} />}
                  </div>
                  <span>{lesson.title}</span>
                </button>
              );
            })}
          </div>
        </aside>
      </div>
    );
  }

  return (
    <div className="portal-work-grid" style={{ gridTemplateColumns: 'minmax(0, 1.4fr) minmax(260px, .6fr)' }}>
      <section className="portal-panel">
        <button className="portal-mini-action" onClick={onBack} style={{ marginBottom: 24, border: 0, padding: 0, background: "transparent" }}><ArrowLeft /> Back</button>
        <div className="portal-panel-head">
          <div>
            <p>COURSE DETAIL</p>
            <h2>{course.title}</h2>
          </div>
        </div>
        <p style={{ color: "#637086", lineHeight: 1.6, marginTop: 16 }}>{course.description}</p>
        
        <h3 style={{ marginTop: 40, fontSize: "1.2rem", marginBottom: 16 }}>Syllabus</h3>
        <div className="portal-task-cards">
          {lessons?.map((lesson: any) => (
            <article key={lesson.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px" }}>
              <PlayCircle size={18} color="#748299" />
              <div>
                <h4 style={{ margin: 0, fontSize: "0.9rem" }}>{lesson.title}</h4>
                <p style={{ margin: "4px 0 0", fontSize: "0.75rem", color: "#748299" }}>{lesson.duration ? `${Math.floor(lesson.duration / 60)} mins` : "Video lesson"}</p>
              </div>
            </article>
          ))}
          {!lessons?.length && <div className="portal-empty"><Circle /> Syllabus is being finalized.</div>}
        </div>
      </section>

      <aside style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <section className="portal-panel" style={{ padding: "32px 24px", textAlign: "center" }}>
          <div style={{ width: 64, height: 64, background: "#e8f0ff", borderRadius: 16, display: "grid", placeItems: "center", margin: "0 auto 20px", color: "#1c64de" }}>
            <BookOpenCheck size={28} />
          </div>
          <h2 style={{ fontSize: "2rem", margin: "0 0 8px" }}>{course.price === 0 ? "Free" : `Rs ${course.price}`}</h2>
          <p style={{ color: "#748299", fontSize: "0.8rem", marginBottom: 24 }}>Full lifetime access</p>
          
          <button 
            className="portal-primary" 
            style={{ width: "100%", height: 52, fontSize: "0.9rem" }}
            onClick={handleEnroll}
            disabled={enrolling || isEnrolled}
          >
            {enrolling ? <LoaderCircle className="spin" /> : <ShieldCheck />}
            {isEnrolled ? "Already Enrolled" : "Enroll Now"}
          </button>
        </section>

        {course.instructor_name && (
          <section className="portal-panel" style={{ padding: 24 }}>
            <h3 style={{ fontSize: "0.8rem", color: "#748299", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12 }}>Instructor</h3>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#dfe8f6", display: "grid", placeItems: "center", color: "#2b67df", fontWeight: 700 }}>
                {course.instructor_name.charAt(0)}
              </div>
              <div>
                <strong style={{ display: "block", fontSize: "0.9rem" }}>{course.instructor_name}</strong>
                <span style={{ color: "#748299", fontSize: "0.75rem" }}>{course.instructor_title || "Instructor"}</span>
              </div>
            </div>
          </section>
        )}
      </aside>
    </div>
  );
}
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
import { useEffect, useState } from "react";
import { LoaderCircle, Save } from "lucide-react";
import { getSupabaseBrowserClient } from "../../../lib/supabase-browser";

export function ProfileModule() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    bio: "",
    phone: "",
    city: "",
    github_url: "",
    linkedin_url: "",
    discord_handle: "",
    skills_input: "",
  });
  
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
        
        if (data.profile) {
          setProfile(data.profile);
          setFormData({
            full_name: data.profile.full_name || "",
            bio: data.profile.bio || "",
            phone: data.profile.phone || "",
            city: data.profile.city || "",
            github_url: data.profile.github_url || "",
            linkedin_url: data.profile.linkedin_url || "",
            discord_handle: data.profile.discord_handle || "",
            skills_input: (data.profile.skills || []).join(", "),
          });
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [supabase]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const skillsArray = formData.skills_input.split(",").map(s => s.trim()).filter(s => s.length > 0);
      
      const { data: { session } } = await supabase!.auth.getSession();
      const response = await fetch("/api/student/profile", {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.access_token}` 
        },
        body: JSON.stringify({
          ...formData,
          skills: skillsArray
        })
      });
      
      const result = await response.json();
      if (response.ok) {
        alert("Profile updated successfully!");
      } else {
        alert(result.error || "Update failed");
      }
    } catch (err) {
      alert("Error updating profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={{ padding: "40px", textAlign: "center" }}><LoaderCircle className="spin" style={{ margin: "0 auto" }} /></div>;
  }

  return (
    <div className="portal-work-grid" style={{ gridTemplateColumns: 'minmax(0, 1.4fr) minmax(260px, .6fr)' }}>
      <section className="portal-panel">
        <div className="portal-panel-head" style={{ marginBottom: 24 }}>
          <div>
            <p>ACCOUNT SETTINGS</p>
            <h2>Student Profile</h2>
          </div>
        </div>
        
        <form onSubmit={handleSave} className="portal-form">
          <div className="portal-form-group">
            <label>Full Name</label>
            <input type="text" name="full_name" value={formData.full_name} onChange={handleChange} required />
          </div>
          
          <div className="portal-form-group">
            <label>Bio</label>
            <textarea name="bio" value={formData.bio} onChange={handleChange} placeholder="Tell us about your learning goals..." rows={3} />
          </div>
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div className="portal-form-group">
              <label>Phone Number</label>
              <input type="text" name="phone" value={formData.phone} onChange={handleChange} />
            </div>
            <div className="portal-form-group">
              <label>City</label>
              <input type="text" name="city" value={formData.city} onChange={handleChange} />
            </div>
          </div>
          
          <div className="portal-form-group" style={{ marginTop: 24 }}>
            <label>Tech Stack / Skills (comma separated)</label>
            <input type="text" name="skills_input" value={formData.skills_input} onChange={handleChange} placeholder="React, Python, UI Design..." />
          </div>
          
          <h3 style={{ fontSize: "1.1rem", marginTop: 32, marginBottom: 16, paddingBottom: 12, borderBottom: "1px solid #edf0f5" }}>Social Links</h3>
          
          <div className="portal-form-group">
            <label>GitHub URL</label>
            <input type="url" name="github_url" value={formData.github_url} onChange={handleChange} placeholder="https://github.com/username" />
          </div>
          
          <div className="portal-form-group">
            <label>LinkedIn URL</label>
            <input type="url" name="linkedin_url" value={formData.linkedin_url} onChange={handleChange} placeholder="https://linkedin.com/in/username" />
          </div>
          
          <div className="portal-form-group">
            <label>Discord Handle</label>
            <input type="text" name="discord_handle" value={formData.discord_handle} onChange={handleChange} placeholder="username#1234" />
          </div>
          
          <div className="portal-form-actions" style={{ marginTop: 32 }}>
            <button type="submit" className="portal-primary" disabled={saving}>
              {saving ? <LoaderCircle className="spin" /> : <Save />} Save Changes
            </button>
          </div>
        </form>
      </section>

      <aside style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <section className="portal-panel" style={{ padding: 24, textAlign: "center" }}>
          <div style={{ width: 90, height: 90, borderRadius: "50%", background: "#1c64de", color: "white", display: "grid", placeItems: "center", margin: "0 auto 16px", fontSize: "2rem", fontWeight: 700 }}>
            {formData.full_name?.charAt(0) || "S"}
          </div>
          <h3 style={{ margin: "0 0 4px", fontSize: "1.1rem" }}>{formData.full_name || "Student"}</h3>
          <p style={{ margin: 0, color: "#748299", fontSize: "0.85rem" }}>{formData.city || "Pakistan"}</p>
          
          {formData.skills_input && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center", marginTop: 24 }}>
              {formData.skills_input.split(",").map((s, i) => s.trim() ? (
                <span key={i} style={{ padding: "4px 10px", background: "#f0f4f8", color: "#4a5568", fontSize: "0.75rem", borderRadius: 12 }}>{s.trim()}</span>
              ) : null)}
            </div>
          )}
        </section>
      </aside>
    </div>
  );
}
import { useEffect, useState } from "react";
import { ArrowLeft, Calendar, Circle, LoaderCircle, MapPin, QrCode, Ticket } from "lucide-react";
import { getSupabaseBrowserClient } from "../../../lib/supabase-browser";

export function TicketsModule() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicketCode, setSelectedTicketCode] = useState<string | null>(null);
  const supabase = getSupabaseBrowserClient();

  useEffect(() => {
    async function load() {
      if (!supabase) return;
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return;
        
        const response = await fetch("/api/student/tickets", {
          headers: { Authorization: `Bearer ${session.access_token}` }
        });
        const data = await response.json();
        
        if (data.tickets) {
          setTickets(data.tickets);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [supabase]);

  if (loading) {
    return <div style={{ padding: "40px", textAlign: "center" }}><LoaderCircle className="spin" style={{ margin: "0 auto" }} /></div>;
  }

  if (selectedTicketCode) {
    return <TicketDetail ticketCode={selectedTicketCode} onBack={() => setSelectedTicketCode(null)} supabase={supabase!} />;
  }

  return (
    <div className="portal-work-grid" style={{ gridTemplateColumns: '1fr' }}>
      <section className="portal-panel">
        <div className="portal-panel-head">
          <div>
            <p>ACCESS PASSES</p>
            <h2>My Tickets</h2>
          </div>
        </div>
        
        <div className="ticket-passbook">
          {tickets.map((ticket) => {
            const title = ticket.item_type === "COURSE" ? ticket.courses?.title : ticket.webinars?.title;
            const isWebinar = ticket.item_type === "WEBINAR";
            
            return (
              <article className="ticket-card" key={ticket.id} onClick={() => setSelectedTicketCode(ticket.ticket_code)}>
                <div className="ticket-card-stub">
                  <QrCode size={40} color="#fff" style={{ opacity: 0.5 }} />
                  <span style={{ transform: "rotate(-90deg)", whiteSpace: "nowrap", fontSize: "0.7rem", color: "#fff", fontWeight: 700, marginTop: 20 }}>TAP TO VIEW</span>
                </div>
                <div className="ticket-card-main">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <span className="ticket-type-badge">{ticket.item_type}</span>
                    <span style={{ fontSize: "0.75rem", color: "#637086", fontWeight: 700 }}>{ticket.ticket_code}</span>
                  </div>
                  <h3>{title}</h3>
                  {isWebinar && ticket.webinars && (
                    <div className="ticket-meta" style={{ marginTop: 16 }}>
                      <span><Calendar size={14} /> {new Intl.DateTimeFormat("en-PK", { dateStyle: "medium" }).format(new Date(ticket.webinars.start_time))}</span>
                      <span><MapPin size={14} /> {ticket.webinars.venue}</span>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
          
          {tickets.length === 0 && (
            <div className="portal-empty" style={{ gridColumn: "1 / -1" }}>
              <Circle /> You have no tickets yet. Enroll in a course or webinar.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function TicketDetail({ ticketCode, onBack, supabase }: { ticketCode: string, onBack: () => void, supabase: any }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const response = await fetch(`/api/student/tickets/${ticketCode}`, {
          headers: { Authorization: `Bearer ${session.access_token}` }
        });
        const result = await response.json();
        if (result.ticket) setData(result);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [ticketCode, supabase]);

  if (loading || !data) return <div style={{ padding: "40px", textAlign: "center" }}><LoaderCircle className="spin" style={{ margin: "0 auto" }} /></div>;

  const { ticket, qrDataUrl } = data;
  const title = ticket.item_type === "COURSE" ? ticket.courses?.title : ticket.webinars?.title;
  const isWebinar = ticket.item_type === "WEBINAR";

  return (
    <div className="portal-work-grid" style={{ gridTemplateColumns: 'minmax(0, 1fr) minmax(320px, 1fr)', maxWidth: 900, margin: "0 auto" }}>
      <section className="portal-panel" style={{ background: "linear-gradient(135deg, #071427, #0d284a)", color: "white", padding: 40, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        <button className="portal-mini-action" onClick={onBack} style={{ color: "rgba(255,255,255,0.7)", alignSelf: "flex-start", marginBottom: 40, border: 0, padding: 0, background: "transparent" }}><ArrowLeft /> Back</button>
        
        <div>
          <span style={{ padding: "4px 8px", background: "rgba(255,255,255,0.1)", borderRadius: 4, fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.05em" }}>{ticket.item_type} PASS</span>
          <h2 style={{ fontSize: "2.4rem", margin: "16px 0", lineHeight: 1.1 }}>{title}</h2>
          
          {isWebinar && ticket.webinars && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 32 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, color: "rgba(255,255,255,0.8)" }}>
                <Calendar size={18} color="#469bff" />
                <span>{new Intl.DateTimeFormat("en-PK", { dateStyle: "full", timeStyle: "short" }).format(new Date(ticket.webinars.start_time))}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, color: "rgba(255,255,255,0.8)" }}>
                <MapPin size={18} color="#469bff" />
                <span>{ticket.webinars.venue}</span>
              </div>
            </div>
          )}
        </div>
        
        <div style={{ marginTop: 60, borderTop: "1px dashed rgba(255,255,255,0.2)", paddingTop: 24, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <span style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.5)", display: "block", marginBottom: 4 }}>TICKET CODE</span>
            <strong style={{ fontSize: "1.2rem", letterSpacing: "0.1em" }}>{ticket.ticket_code}</strong>
          </div>
          <Ticket size={24} color="rgba(255,255,255,0.2)" />
        </div>
      </section>

      <section className="portal-panel" style={{ padding: 40, display: "grid", placeItems: "center" }}>
        <div style={{ textAlign: "center" }}>
          <h3 style={{ fontSize: "1.2rem", margin: "0 0 8px" }}>Scan to check in</h3>
          <p style={{ color: "#748299", fontSize: "0.85rem", marginBottom: 32 }}>Present this QR code at the venue or use it for digital verification.</p>
          
          <div style={{ background: "white", padding: 16, borderRadius: 16, border: "1px solid #edf0f5", display: "inline-block" }}>
            {qrDataUrl ? (
              <img src={qrDataUrl} alt="Ticket QR Code" style={{ width: 220, height: 220, display: "block" }} />
            ) : (
              <div style={{ width: 220, height: 220, background: "#f8f9fc", display: "grid", placeItems: "center", color: "#a5b4cc" }}>
                <QrCode size={48} />
              </div>
            )}
          </div>
          
          <div style={{ marginTop: 32, padding: "12px 16px", background: "#f8f9fc", borderRadius: 8, fontSize: "0.85rem", color: "#637086" }}>
            <strong>Status:</strong> {ticket.is_checked_in ? <span style={{ color: "#16a34a" }}>Checked In</span> : "Valid"}
          </div>
        </div>
      </section>
    </div>
  );
}
import { useEffect, useState } from "react";
import { Circle, Download, FileText, FolderArchive, LoaderCircle } from "lucide-react";
import { getSupabaseBrowserClient } from "../../../lib/supabase-browser";

export function VaultModule() {
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = getSupabaseBrowserClient();

  useEffect(() => {
    async function load() {
      if (!supabase) return;
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return;
        
        const response = await fetch("/api/student/vault", {
          headers: { Authorization: `Bearer ${session.access_token}` }
        });
        const data = await response.json();
        
        if (data.resources) {
          setResources(data.resources);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [supabase]);

  const handleDownload = async (resourceId: string, title: string) => {
    try {
      const { data: { session } } = await supabase!.auth.getSession();
      const response = await fetch(`/api/student/vault/${resourceId}`, {
        headers: { Authorization: `Bearer ${session?.access_token}` }
      });
      const data = await response.json();
      
      if (data.downloadUrl) {
        // Trigger download
        const a = document.createElement("a");
        a.href = data.downloadUrl;
        a.download = title;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else {
        alert(data.error || "Could not generate download link");
      }
    } catch (e) {
      alert("Download failed");
    }
  };

  if (loading) {
    return <div style={{ padding: "40px", textAlign: "center" }}><LoaderCircle className="spin" style={{ margin: "0 auto" }} /></div>;
  }

  return (
    <div className="portal-work-grid" style={{ gridTemplateColumns: '1fr' }}>
      <section className="portal-panel">
        <div className="portal-panel-head" style={{ marginBottom: 24 }}>
          <div>
            <p>DOWNLOADS</p>
            <h2>Resource Vault</h2>
          </div>
        </div>
        
        <p style={{ color: "#637086", marginBottom: 32 }}>Access source code, slides, and reference materials for courses and webinars you're enrolled in.</p>
        
        <div className="vault-resource-list">
          {resources.map((resource) => (
            <article className="vault-item" key={resource.id}>
              <div className="vault-item-icon">
                {resource.file_type.includes("ZIP") ? <FolderArchive size={20} color="#748299" /> : <FileText size={20} color="#748299" />}
              </div>
              <div className="vault-item-content">
                <h3>{resource.title}</h3>
                <span className="vault-item-meta">{resource.source_title} • {resource.item_type}</span>
              </div>
              <button className="portal-secondary" onClick={() => handleDownload(resource.id, resource.title)}>
                <Download size={16} /> Download
              </button>
            </article>
          ))}
          
          {resources.length === 0 && (
            <div className="portal-empty" style={{ gridColumn: "1 / -1", padding: 60 }}>
              <Circle /> No resources available for your current enrollments.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
import { useEffect, useState } from "react";
import { ArrowLeft, Calendar, Circle, ExternalLink, LoaderCircle, MapPin, ShieldCheck, Ticket } from "lucide-react";
import { getSupabaseBrowserClient } from "../../../lib/supabase-browser";

export function WebinarsModule() {
  const [data, setData] = useState<{ upcoming: any[], past: any[] }>({ upcoming: [], past: [] });
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const supabase = getSupabaseBrowserClient();

  useEffect(() => {
    async function load() {
      if (!supabase) return;
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return;
        
        const response = await fetch("/api/student/webinars", {
          headers: { Authorization: `Bearer ${session.access_token}` }
        });
        const result = await response.json();
        
        if (result.upcoming) {
          setData(result);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [supabase]);

  if (loading) {
    return <div style={{ padding: "40px", textAlign: "center" }}><LoaderCircle className="spin" style={{ margin: "0 auto" }} /></div>;
  }

  if (selectedSlug) {
    return <WebinarDetail slug={selectedSlug} onBack={() => setSelectedSlug(null)} supabase={supabase!} />;
  }

  const list = tab === "upcoming" ? data.upcoming : data.past;

  return (
    <div className="portal-work-grid" style={{ gridTemplateColumns: '1fr' }}>
      <section className="portal-panel">
        <div className="portal-panel-head" style={{ marginBottom: 24 }}>
          <div>
            <p>LIVE SESSIONS</p>
            <h2>Webinars & Events</h2>
          </div>
        </div>

        <div className="auth-tabs" style={{ maxWidth: 320, margin: "0 0 24px" }}>
          <button className={tab === "upcoming" ? "active" : ""} onClick={() => setTab("upcoming")}>Upcoming ({data.upcoming.length})</button>
          <button className={tab === "past" ? "active" : ""} onClick={() => setTab("past")}>Past recorded ({data.past.length})</button>
        </div>
        
        <div className="webinar-catalog">
          {list.map((webinar) => (
            <article className="webinar-card" key={webinar.id} onClick={() => setSelectedSlug(webinar.slug)}>
              <div className="webinar-card-content">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                  <span className={`venue-badge ${webinar.venue.toLowerCase()}`}>{webinar.venue}</span>
                  {webinar.isRegistered && <span className="registered-badge">Registered</span>}
                </div>
                <h3>{webinar.title}</h3>
                
                <div className="webinar-meta">
                  <span><Calendar size={14} /> {new Intl.DateTimeFormat("en-PK", { dateStyle: "medium", timeStyle: "short" }).format(new Date(webinar.start_time))}</span>
                  <span><MapPin size={14} /> {webinar.venue}</span>
                </div>
                
                <p style={{ marginTop: 12, fontSize: "0.8rem", color: "#637086" }}>
                  Speaker: <strong>{webinar.speaker_name}</strong>
                </p>
              </div>
            </article>
          ))}
          
          {list.length === 0 && (
            <div className="portal-empty" style={{ gridColumn: "1 / -1" }}>
              <Circle /> No {tab} webinars found.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function WebinarDetail({ slug, onBack, supabase }: { slug: string, onBack: () => void, supabase: any }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);

  const load = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(`/api/student/webinars/${slug}`, {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      const result = await response.json();
      if (result.webinar) setData(result);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [slug, supabase]);

  const handleRegister = async () => {
    setRegistering(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch("/api/student/checkout", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}` 
        },
        body: JSON.stringify({ itemType: "WEBINAR", webinarId: data.webinar.id })
      });
      const result = await response.json();
      if (result.success) {
        alert(`Successfully registered! Your ticket code is ${result.ticketCode}`);
        load();
      } else {
        alert(result.error || "Registration failed");
      }
    } catch (e) {
      alert("Checkout error");
    } finally {
      setRegistering(false);
    }
  };

  if (loading || !data) return <div style={{ padding: "40px", textAlign: "center" }}><LoaderCircle className="spin" style={{ margin: "0 auto" }} /></div>;

  const { webinar, isRegistered } = data;
  const isPast = new Date(webinar.start_time).getTime() <= new Date().getTime();

  return (
    <div className="portal-work-grid" style={{ gridTemplateColumns: 'minmax(0, 1.4fr) minmax(260px, .6fr)' }}>
      <section className="portal-panel">
        <button className="portal-mini-action" onClick={onBack} style={{ marginBottom: 24, border: 0, padding: 0, background: "transparent" }}><ArrowLeft /> Back</button>
        <div className="portal-panel-head">
          <div>
            <p>{webinar.venue.toUpperCase()} EVENT</p>
            <h2>{webinar.title}</h2>
          </div>
        </div>
        
        <div style={{ display: "flex", gap: 24, marginTop: 24, paddingBottom: 24, borderBottom: "1px solid #edf0f5" }}>
          <div>
            <span style={{ display: "block", fontSize: "0.75rem", color: "#748299", marginBottom: 4 }}>Date & Time</span>
            <strong>{new Intl.DateTimeFormat("en-PK", { dateStyle: "full", timeStyle: "short" }).format(new Date(webinar.start_time))}</strong>
          </div>
          <div>
            <span style={{ display: "block", fontSize: "0.75rem", color: "#748299", marginBottom: 4 }}>Format</span>
            <strong>{webinar.venue}</strong>
          </div>
        </div>
        
        <p style={{ color: "#637086", lineHeight: 1.6, marginTop: 24 }}>{webinar.description}</p>
        
        {isRegistered && webinar.meeting_link && !isPast && (
          <div style={{ marginTop: 32, padding: 24, background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 12 }}>
            <h3 style={{ margin: "0 0 12px", color: "#166534", fontSize: "1rem" }}>You're registered</h3>
            <p style={{ margin: "0 0 16px", color: "#15803d", fontSize: "0.85rem" }}>Join the session using the link below at the scheduled time.</p>
            <a href={webinar.meeting_link} target="_blank" rel="noopener noreferrer" className="portal-primary" style={{ background: "#16a34a", color: "white" }}>
              Join Meeting <ExternalLink size={16} style={{ marginLeft: 6 }} />
            </a>
          </div>
        )}
      </section>

      <aside style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <section className="portal-panel" style={{ padding: "32px 24px", textAlign: "center" }}>
          <div style={{ width: 64, height: 64, background: "#fff5d7", borderRadius: 16, display: "grid", placeItems: "center", margin: "0 auto 20px", color: "#a87400" }}>
            <Ticket size={28} />
          </div>
          <h2 style={{ fontSize: "2rem", margin: "0 0 8px" }}>{webinar.price === 0 ? "Free" : `Rs ${webinar.price}`}</h2>
          
          <button 
            className="portal-primary" 
            style={{ width: "100%", height: 52, fontSize: "0.9rem", marginTop: 20 }}
            onClick={handleRegister}
            disabled={registering || isRegistered || isPast}
          >
            {registering ? <LoaderCircle className="spin" /> : <ShieldCheck />}
            {isRegistered ? "Ticket Claimed" : isPast ? "Event Ended" : "Claim Ticket"}
          </button>
          
          {webinar.max_seats && !isPast && (
            <p style={{ color: "#748299", fontSize: "0.75rem", marginTop: 16 }}>Limited to {webinar.max_seats} seats</p>
          )}
        </section>

        {webinar.speaker_name && (
          <section className="portal-panel" style={{ padding: 24 }}>
            <h3 style={{ fontSize: "0.8rem", color: "#748299", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12 }}>Speaker</h3>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#dfe8f6", display: "grid", placeItems: "center", color: "#2b67df", fontWeight: 700 }}>
                {webinar.speaker_name.charAt(0)}
              </div>
              <div>
                <strong style={{ display: "block", fontSize: "0.9rem" }}>{webinar.speaker_name}</strong>
                <span style={{ color: "#748299", fontSize: "0.75rem" }}>{webinar.speaker_title || "Guest Speaker"}</span>
              </div>
            </div>
          </section>
        )}
      </aside>
    </div>
  );
}
