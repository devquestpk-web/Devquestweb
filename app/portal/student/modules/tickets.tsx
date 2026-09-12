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
