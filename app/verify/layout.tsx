export const metadata = {
  title: "Verify Certificate | DevQuest",
  description: "Verify the authenticity of a DevQuest certificate.",
};

export default function VerifyLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="verification-layout" style={{ minHeight: "100vh", background: "#f8f9fc", display: "flex", flexDirection: "column" }}>
      <header style={{ background: "#061e3d", padding: "20px 40px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <a href="/" style={{ color: "white", fontSize: "1.5rem", fontWeight: 900, textDecoration: "none", letterSpacing: "-0.05em" }}>
            DevQuest<span style={{ color: "#469bff" }}>.</span>
          </a>
          <span style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.85rem", letterSpacing: "0.1em", textTransform: "uppercase" }}>Credential Verification</span>
        </div>
      </header>
      <main style={{ flex: 1, padding: "60px 20px" }}>
        {children}
      </main>
      <footer style={{ padding: "40px", textAlign: "center", color: "#637086", fontSize: "0.85rem", borderTop: "1px solid #edf0f5" }}>
        &copy; {new Date().getFullYear()} DevQuest PK. All rights reserved.
      </footer>
    </div>
  );
}
