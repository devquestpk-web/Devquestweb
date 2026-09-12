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
