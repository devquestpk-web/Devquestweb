import { headers } from "next/headers";
import { ShieldAlert, ShieldCheck, Download } from "lucide-react";
import QRCode from "qrcode";

export const runtime = "nodejs";

async function getVerificationData(certCode: string, origin: string) {
  try {
    const res = await fetch(`${origin}/api/verify/${certCode}`, { cache: "no-store" });
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    return null;
  }
}

export default async function VerifyPage({ params }: { params: Promise<{ certCode: string }> }) {
  const { certCode } = await params;
  const headersList = await headers();
  const host = headersList.get("host");
  const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
  const origin = `${protocol}://${host}`;
  
  const data = await getVerificationData(certCode, origin);

  if (!data || !data.verified) {
    return (
      <div className="verification-page" style={{ maxWidth: 600, margin: "0 auto", textAlign: "center" }}>
        <div style={{ width: 80, height: 80, background: "#fef2f2", borderRadius: "50%", display: "grid", placeItems: "center", margin: "0 auto 24px", color: "#ef4444" }}>
          <ShieldAlert size={40} />
        </div>
        <h1 style={{ fontSize: "2rem", color: "#061e3d", marginBottom: 16 }}>Certificate Not Found</h1>
        <p style={{ color: "#637086", fontSize: "1.1rem", marginBottom: 32 }}>We could not verify a certificate with the code <strong>{certCode}</strong>. Please check the code and try again.</p>
        <a href="/" className="portal-secondary" style={{ display: "inline-flex" }}>Return to DevQuest</a>
      </div>
    );
  }

  const cert = data.certificate;
  
  // Generate QR code for the page itself
  const qrDataUrl = await QRCode.toDataURL(`${origin}/verify/${cert.certCode}`, {
    errorCorrectionLevel: "H",
    margin: 1,
    color: { dark: "#061e3d", light: "#ffffff" }
  });

  return (
    <div className="verification-page" style={{ maxWidth: 800, margin: "0 auto" }}>
      <div style={{ background: "white", borderRadius: 16, border: "1px solid #edf0f5", overflow: "hidden", boxShadow: "0 10px 40px rgba(0,0,0,0.05)" }}>
        
        {/* Header Status */}
        <div style={{ background: "#f0fdf4", borderBottom: "1px solid #bbf7d0", padding: "24px 40px", display: "flex", alignItems: "center", gap: 16 }}>
          <ShieldCheck size={32} color="#16a34a" />
          <div>
            <h2 style={{ margin: 0, color: "#166534", fontSize: "1.2rem" }}>Verified Credential</h2>
            <p style={{ margin: "4px 0 0", color: "#15803d", fontSize: "0.9rem" }}>This certificate is authentic and issued by DevQuest PK.</p>
          </div>
        </div>

        {/* Certificate Details */}
        <div style={{ padding: 40, display: "grid", gridTemplateColumns: "1fr 200px", gap: 40 }}>
          <div>
            <div style={{ marginBottom: 32 }}>
              <span style={{ fontSize: "0.85rem", color: "#748299", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 8 }}>Recipient</span>
              <strong style={{ fontSize: "1.8rem", color: "#061e3d" }}>{cert.studentName}</strong>
            </div>
            
            <div style={{ marginBottom: 32 }}>
              <span style={{ fontSize: "0.85rem", color: "#748299", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 8 }}>
                {cert.itemType === "COURSE" ? "Completed Course" : "Attended Webinar"}
              </span>
              <strong style={{ fontSize: "1.4rem", color: "#061e3d" }}>{cert.itemTitle}</strong>
              {cert.instructorName && (
                <p style={{ margin: "8px 0 0", color: "#4a5568" }}>Led by {cert.instructorName}</p>
              )}
            </div>
            
            <div style={{ display: "flex", gap: 40 }}>
              <div>
                <span style={{ fontSize: "0.75rem", color: "#748299", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 4 }}>Issue Date</span>
                <strong style={{ color: "#061e3d" }}>{new Intl.DateTimeFormat("en-PK", { dateStyle: "long" }).format(new Date(cert.issuedAt))}</strong>
              </div>
              <div>
                <span style={{ fontSize: "0.75rem", color: "#748299", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 4 }}>Certificate ID</span>
                <strong style={{ color: "#061e3d" }}>{cert.certCode}</strong>
              </div>
            </div>
          </div>
          
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24, borderLeft: "1px solid #edf0f5", paddingLeft: 40 }}>
            <img src={qrDataUrl} alt="Verification QR" style={{ width: 160, height: 160, display: "block" }} />
            <a href={cert.pdfUrl} target="_blank" rel="noopener noreferrer" className="portal-primary" style={{ width: "100%", justifyContent: "center" }}>
              <Download size={18} style={{ marginRight: 8 }} /> Download PDF
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
