import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpRight,
  CheckCircle2,
  GraduationCap,
  Handshake,
  MapPin,
  Users,
  Building2,
  Rocket,
  Mail,
} from "lucide-react";
import { PartnerCard, type PartnerData } from "../components/partner-card";

export const metadata: Metadata = {
  title: "Teams in Collaboration",
  description:
    "DevQuest partners with student bodies, tech societies, and universities across Pakistan through formal MoUs and active collaborations to co-create impactful learning experiences.",
};

/* ─── Partner / Hub data ─────────────────────────────────────────────────── */
const partners: PartnerData[] = [
  {
    name: "AWS Student Builder Group",
    organization: "Bahauddin Zakariya University",
    location: "Multan, Punjab",
    mouStatus: "signed",
    focusTags: ["Cloud", "AWS", "Events", "Certification"],
    image: "/figma/aws-sbg-bzu-logo.png",
    role: "University Chapter · MoU Signed",
  },
  {
    name: "GC-CSS MNS-UET",
    organization: "MNS University of Engineering & Technology",
    location: "Multan, Punjab",
    mouStatus: "informal",
    focusTags: ["Engineering", "Community", "Workshops"],
    image: "/partners/gc-css-mnsuet.jpg",
    role: "General Committee of Computer Science Students",
  },
  {
    name: "Devsinc Multan",
    organization: "Devsinc",
    location: "Multan, Punjab",
    mouStatus: "informal",
    focusTags: ["Software", "Talent Bridge", "Internships"],
    image: "/partners/devsinc-multan.jpg",
    role: "Industry Partner",
  },
  {
    name: "Project Soch",
    organization: "Project Soch Pakistan",
    location: "Pakistan-wide",
    mouStatus: "informal",
    focusTags: ["Social Impact", "Community", "Youth"],
    image: "/partners/project-soch.jpg",
    role: "Community Partner",
  },
];

/* ─── Metrics ────────────────────────────────────────────────────────────── */
const metrics = [
  { value: "1", label: "Formal MoU Signed" },
  { value: "2", label: "Active University Hubs" },
  { value: "5+", label: "Partner Organisations" },
  { value: "5.5K+", label: "Community Reached" },
];

/* ─── Spotlight bullet points ────────────────────────────────────────────── */
const spotlightPoints = [
  "First formal MoU with AWS Student Builder Group at BZU Multan",
  "Joint event co-organisation and speaker exchange programme",
  "Certified learning pathway access for BZU students",
  "DevQuest mentors embedded in campus community activities",
];

export default function TeamsInCollaborationPage() {
  return (
    <div className="dq-tic-page">

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="dq-tic-hero">
        <div className="dq-shell dq-tic-hero-grid">

          {/* Copy column */}
          <div>
            <p className="dq-kicker">
              <Handshake aria-hidden="true" /> TEAMS IN COLLABORATION
            </p>
            <h1>
              Where Pakistani<br />
              campuses build<br />
              together.
            </h1>
            <p>
              DevQuest is formalising a network of university chapters, student societies, and industry partners — signing MoUs, co-hosting events, and embedding mentors directly into campus ecosystems.
            </p>
            <div className="dq-tic-hero-actions">
              <Link className="dq-btn dq-btn-blue" href="#hubs">
                See Active Hubs <ArrowUpRight aria-hidden="true" />
              </Link>
              <Link className="dq-btn dq-btn-slate" href="/contact">
                Propose a Partnership
              </Link>
            </div>
          </div>

        </div>
      </section>

      {/* ── Metrics strip ────────────────────────────────────────────────── */}
      <section className="dq-tic-metrics" aria-label="Teams in Collaboration statistics">
        <div className="dq-shell dq-tic-metrics-inner">
          {metrics.map(({ value, label }) => (
            <div className="dq-tic-metric" key={label}>
              <strong>{value}</strong>
              <span>{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── AWS SBG BZU MoU Spotlight ─────────────────────────────────────── */}
      <section className="dq-tic-spotlight-section" id="spotlight" aria-labelledby="spotlight-heading">
        <div className="dq-shell dq-tic-spotlight-grid">

          {/* Copy */}
          <div>
            <p className="dq-kicker">FEATURED PARTNERSHIP</p>
            <h2 id="spotlight-heading">
              AWS Student Builder<br />
              Group · BZU Multan
            </h2>
            <p>
              DevQuest signed its first formal Memorandum of Understanding with the AWS Student Builder Group at Bahauddin Zakariya University — establishing a shared mission to grow cloud literacy, deliver certified learning, and co-host community events across Multan.
            </p>

            <ul className="dq-tic-spotlight-list">
              {spotlightPoints.map((point) => (
                <li key={point}>
                  <CheckCircle2 aria-hidden="true" />
                  {point}
                </li>
              ))}
            </ul>

            <Link className="dq-btn dq-btn-blue" href="/community#chapters">
              Visit BZU Chapter <ArrowUpRight aria-hidden="true" />
            </Link>
          </div>

          {/* Photo frame */}
          <div className="dq-tic-spotlight-frame" aria-label="AWS SBG BZU MoU signing photos">
            <div className="dq-tic-spotlight-img">
              <Image
                src="/figma/mou-signing-group.jpg"
                alt="Four DevQuest and AWS SBG BZU members posing with the signed MoU document"
                fill
                sizes="(max-width: 900px) 100vw, 600px"
                style={{ objectPosition: "center 35%" }}
              />
              <div className="dq-tic-spotlight-stamp">
                <CheckCircle2 aria-hidden="true" />
                MoU Signed · AWS SBG BZU · Multan
              </div>
            </div>
            <div className="dq-tic-spotlight-img">
              <Image
                src="/figma/mou-signing-1on1.jpg"
                alt="MoU document being signed at the table by DevQuest and BZU representatives"
                fill
                sizes="(max-width: 900px) 100vw, 600px"
                style={{ objectPosition: "center 30%" }}
              />
            </div>
          </div>

        </div>
      </section>

      {/* ── Campus Hubs Grid ─────────────────────────────────────────────── */}
      <section className="dq-tic-hubs-section" id="hubs" aria-labelledby="hubs-heading">
        <div className="dq-shell">

          {/* Section header */}
          <div className="dq-section-heading">
            <div>
              <p className="dq-kicker">ACTIVE PARTNERSHIPS</p>
              <h2 id="hubs-heading">
                Our network of<br />campus hubs.
              </h2>
            </div>
            <Link href="/contact">
              Become a partner <ArrowUpRight aria-hidden="true" />
            </Link>
          </div>

          {/* Grid */}
          <div className="dq-tic-hub-grid">
            {partners.map((partner) => (
              <PartnerCard key={partner.name} partner={partner} />
            ))}

            {/* Invite card — reuses the chapter invite gradient */}
            <Link href="/contact" className="dq-tic-invite-card" aria-label="Invite your university to collaborate with DevQuest">
              <span className="dq-tic-invite-arrow" aria-hidden="true">
                <ArrowUpRight />
              </span>
              <GraduationCap className="dq-tic-invite-card-icon" aria-hidden="true" />
              <small>YOUR INSTITUTION</small>
              <h3>Is your company next?</h3>
              <p>
                We are actively inviting student societies, university chapters, and organisations to formalise their partnership with DevQuest.
              </p>
            </Link>
          </div>

        </div>
      </section>

      {/* ── Why Partner — value props ─────────────────────────────────────── */}
      <section className="dq-chapter-section" aria-labelledby="why-heading">
        <div className="dq-shell">
          <div className="dq-section-heading">
            <div>
              <p className="dq-kicker">WHY PARTNER WITH DEVQUEST</p>
              <h2 id="why-heading">
                What a collaboration<br />unlocks for you.
              </h2>
            </div>
          </div>

          <div className="dq-chapter-grid">
            <article>
              <Users className="chapter-icon" aria-hidden="true" />
              <small>COMMUNITY ACCESS</small>
              <h3>5,500+ community reach</h3>
              <p>Tap into DevQuest's growing network across social channels, events, and university programmes nationwide.</p>
            </article>

            <article>
              <Rocket className="chapter-icon" aria-hidden="true" />
              <small>CO-HOSTED EVENTS</small>
              <h3>Joint event programmes</h3>
              <p>Co-design hackathons, workshops, and webinars with DevQuest's operations and logistics backbone already in place.</p>
            </article>

            <article>
              <Building2 className="chapter-icon" aria-hidden="true" />
              <small>FORMAL RECOGNITION</small>
              <h3>Signed MoU &amp; visibility</h3>
              <p>Formalise the relationship through a signed MoU and receive feature placement on DevQuest platforms and social media.</p>
            </article>

            <article>
              <GraduationCap className="chapter-icon" aria-hidden="true" />
              <small>LEARNING PATHWAYS</small>
              <h3>Certified learning access</h3>
              <p>Unlock DevQuest's structured learning pathways and certified courses for your student members at priority access.</p>
            </article>

            <article>
              <Handshake className="chapter-icon" aria-hidden="true" />
              <small>MENTORSHIP NETWORK</small>
              <h3>Embedded mentors</h3>
              <p>Get DevQuest mentors — including industry professionals and AWS-certified engineers — engaged with your campus community.</p>
            </article>

            {/* Invite CTA card */}
            <Link href="/contact" className="chapter-invite dq-chapter-grid" aria-label="Contact DevQuest to start a collaboration">
              <Mail className="chapter-icon" aria-hidden="true" />
              <small>REACH OUT</small>
              <h3>Start the conversation</h3>
              <p>Fill out our contact form or email us directly. We respond to all partnership enquiries within 48 hours.</p>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Inquiry Banner ────────────────────────────────────────────────── */}
      <section className="dq-tic-inquiry" aria-labelledby="inquiry-heading">
        <div className="dq-shell">
          <p className="dq-kicker">PARTNER WITH DEVQUEST</p>
          <h2 id="inquiry-heading">
            Ready to formalise<br />your collaboration?
          </h2>
          <p>
            Whether you represent a university, student society, tech company, or NGO — DevQuest is ready to build something meaningful together. Reach out and let's start with a conversation.
          </p>
          <div className="dq-tic-btn-row">
            <Link className="dq-btn dq-btn-blue" href="/contact">
              Send an Enquiry <Mail aria-hidden="true" />
            </Link>
            <a
              className="dq-btn dq-btn-slate"
              href="https://wa.me/923704489589?text=Hello%20DevQuest%2C%20I%20would%20like%20to%20discuss%20a%20collaboration%20or%20partnership."
              target="_blank"
              rel="noreferrer"
            >
              WhatsApp Us <ArrowUpRight aria-hidden="true" />
            </a>
          </div>
        </div>
      </section>

    </div>
  );
}
