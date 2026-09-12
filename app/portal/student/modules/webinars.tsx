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
