import Link from "next/link";
import Image from "next/image";
import PartnerCard, { Partner } from "../components/partner-card";

const partners: Partner[] = [
  { id: "devsinc", name: "Devsinc Multan", organization: "Devsinc", location: "Multan", mouStatus: "signed", focusTags: ["Mentorship", "Workshops"], image: "/partners/devsinc-multan.jpg", logoFit: "contain" },
  { id: "mlsa", name: "Microsoft Learn Student Ambassadors", organization: "MLSA", location: "National", mouStatus: "in-progress", focusTags: ["Campus Ambassadors", "Outreach"], image: "/partners/mlsa.jpeg", logoFit: "contain" },
  { id: "mnsuet", name: "MNS-UET Multan", organization: "MNS-UET", location: "Multan", mouStatus: "signed", focusTags: ["University Hub", "Research"], image: "/partners/mnsuet.jpg", logoFit: "contain" },
];

export default function TeamsInCollaborationPage() {
  return (
    <div className="dq-about-page">
      <section className="dq-about-hero">
        <div className="dq-shell dq-about-grid">
          <div>
            <span>Collaboration</span>
            <h1>Teams in Collaboration</h1>
            <p>Explore student teams, campus hubs, and industry partners collaborating with DevQuest to run sustained programs, MoUs, and local initiatives.</p>
            <div style={{ marginTop: 28 }}>
              <Link className="dq-btn dq-btn-blue" href="/portal">Join a Portal</Link>
              <Link className="dq-btn dq-btn-slate" href="/contact">Contact partnerships</Link>
            </div>
          </div>
          <div className="dq-about-logo">
            <Image src="/figma/about-logo.png" alt="Teams" fill sizes="420px" />
          </div>
        </div>
      </section>

      <section className="dq-shell" style={{ padding: "60px 0" }}>
        <div className="dq-hero-stats">
          <div><strong>45+</strong><span>Active teams</span></div>
          <div><strong>18</strong><span>University hubs</span></div>
          <div><strong>12</strong><span>Signed MoUs</span></div>
        </div>
      </section>

      <section className="dq-shell" style={{ marginTop: 28 }}>
        <h2>Featured MoU Spotlight</h2>
        <div style={{ marginTop: 18 }}>
          <article className="dq-mou-spotlight">
            <div className="mou-grid">
              <div className="mou-image" aria-hidden="false">
                <span className="mou-badge">MoU Partnership</span>
                <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                  <Image src="/partners/bzu-mou.jpg" alt="AWS SBG BZU partnership MoU signing" fill sizes="(max-width: 760px) 420px, 720px" style={{ objectFit: 'cover', objectPosition: 'center' }} />
                </div>
              </div>
              <div className="mou-content">
                <div className="eyebrow">SPOTLIGHT</div>
                <h3>AWS SBG BZU Partnership</h3>
                <p>Working with AWS SBG at BZU to deliver campus-focused cloud skill-building, project mentorship, and joint events.</p>
                <Link href="/partnerships/aws" className="mou-cta">Learn more <span aria-hidden="true">→</span></Link>
              </div>
            </div>
          </article>
        </div>
      </section>

      <section className="dq-program-section">
        <div className="dq-shell">
          <p className="dq-kicker">CAMPUS HUBS</p>
          <h2>Campus Hubs &amp; Team Network</h2>
          <div className="dq-program-grid" style={{ marginTop: 28 }}>
            {partners.map((p) => (
              <PartnerCard key={p.id} partner={p} />
            ))}
          </div>
        </div>
      </section>

      <section className="dq-home-cta">
        <div className="dq-shell dq-home-cta-grid">
          <div>
            <p className="dq-kicker">INQUIRE</p>
            <h2>Want your team featured?</h2>
            <p>Submit your campus or partner details and we'll reach out about collaboration and MoU opportunities.</p>
            <div style={{ marginTop: 28 }}>
              <Link className="dq-btn dq-btn-blue" href="/contact">Submit an Inquiry</Link>
            </div>
          </div>
          <div>
            <div className="portal-panel">
              <div className="eyebrow">GET IN TOUCH</div>
              <h2>Partner Inquiries</h2>
              <p>We welcome proposals from campus teams, student chapters, and corporate partners.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
