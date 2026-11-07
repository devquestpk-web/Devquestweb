import { useEffect, useState } from "react";
import { Award, Calendar, Circle, Download, Eye, LoaderCircle, Medal, Search, Share2, Star } from "lucide-react";
import { getSupabaseBrowserClient } from "../../../lib/supabase-browser";

export function CertificatesModule({ searchQuery = "" }: { searchQuery?: string }) {
  type Certificate = { id: string; cert_code: string; item_type: "COURSE" | "WEBINAR"; issued_at: string; verification_url: string; courses?: { title?: string } | null; webinars?: { title?: string } | null };
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [message, setMessage] = useState("");
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
    setMessage("Verification link copied.");
  };

  async function downloadCertificate(certificate: Certificate) {
    if (!supabase || downloading) return;
    setDownloading(certificate.id); setMessage("");
    try {
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      if (!token) throw new Error("Please sign in again to download your certificate.");
      const response = await fetch(`/api/student/certificates/${encodeURIComponent(certificate.id)}/download`, { headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok) { const result = await response.json().catch(() => ({})); throw new Error(result.error || "Download failed"); }
      const url = URL.createObjectURL(await response.blob());
      const anchor = document.createElement("a");
      anchor.href = url; anchor.download = `DevQuest-${certificate.cert_code}.pdf`; document.body.appendChild(anchor); anchor.click(); anchor.remove();
      URL.revokeObjectURL(url); setMessage("Certificate downloaded securely.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Download failed"); }
    finally { setDownloading(null); }
  }

  if (loading) {
    return <div style={{ padding: "40px", textAlign: "center" }}><LoaderCircle className="spin" style={{ margin: "0 auto" }} /></div>;
  }

  const query = searchQuery.trim().toLowerCase();
  const visibleCertificates = certificates.filter((cert) => {
    const title = cert.item_type === "COURSE" ? cert.courses?.title : cert.webinars?.title;
    return !query || [title, cert.cert_code, cert.item_type].some((value) => String(value || "").toLowerCase().includes(query));
  });

  return (
    <div className="student-module-page">
      <section className="student-certificate-hero"><div><span>ACHIEVEMENTS</span><h2>Your Certificates</h2><p>Your hard work, participation, and dedication have earned these authenticated credentials. Keep going!</p><div><b><Award />{certificates.length}<small>Total certificates</small></b><b><Calendar />{certificates.length}<small>Programs completed</small></b><b><Star />{certificates.length ? 1 : 0}<small>Achievement</small></b></div></div><div className="student-certificate-art"><Medal /><span>DQ</span></div></section>
      <section className="student-content-card student-certificates-panel">
        <header className="student-section-heading"><div><Award /><span><h3>My Certificates</h3><p>View, verify, and download your earned certificates.</p></span></div><label><Search /><input aria-label="Search certificates" value={searchQuery} readOnly placeholder="Use the search bar above" /></label></header>
        {message && <div className="portal-message" role="status">{message}</div>}
        <div className="certificate-gallery student-certificate-gallery">
          {visibleCertificates.map((cert) => {
            const title = cert.item_type === "COURSE" ? cert.courses?.title : cert.webinars?.title;
            
            return (
              <article className="certificate-card" key={cert.id}>
                <div className="certificate-card-visual student-certificate-preview">
                  <div className="certificate-card-inner"><small>DEVQUEST PK</small><Award /><span>CERTIFICATE</span><h4>{title}</h4></div>
                </div>
                <div className="certificate-card-meta">
                  <h3>{title}</h3>
                  <span className="student-certificate-date">
                    Issued on {new Intl.DateTimeFormat("en-PK", { dateStyle: "long" }).format(new Date(cert.issued_at))}
                  </span>
                  
                  <div style={{ display: "flex", gap: 8 }}>
                    <button type="button" onClick={() => void downloadCertificate(cert)} disabled={Boolean(downloading)} className="portal-primary" style={{ flex: 1, height: 36, padding: 0, justifyContent: "center", fontSize: "0.8rem" }}>
                      {downloading === cert.id ? <LoaderCircle className="spin" size={14} /> : <Download size={14} style={{ marginRight: 6 }} />} Download
                    </button>
                    <button className="portal-secondary" style={{ flex: 1, height: 36, padding: 0, justifyContent: "center", fontSize: "0.8rem" }} onClick={() => window.open(cert.verification_url, "_blank", "noopener,noreferrer")}>
                      <Eye size={14} style={{ marginRight: 6 }} /> Verify
                    </button>
                    <button className="portal-icon-button" type="button" aria-label="Copy verification link" onClick={() => handleCopyLink(cert.verification_url)}><Share2 /></button>
                  </div>
                </div>
              </article>
            );
          })}
          
          {visibleCertificates.length === 0 && (
            <div className="portal-empty" style={{ gridColumn: "1 / -1", padding: 60 }}>
              <Circle /> Complete courses or attend webinars to earn certificates.
            </div>
          )}
        </div>
      </section><footer className="student-achievement-quote"><Medal /><span><strong>“Small steps create big achievements.”</strong><small>Keep learning, keep growing!</small></span></footer>
    </div>
  );
}
