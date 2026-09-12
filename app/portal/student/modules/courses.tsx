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
