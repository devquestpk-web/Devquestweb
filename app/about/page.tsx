import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Github, Globe2, Handshake } from "lucide-react";
import { SponsorMarquee } from "../components/sponsor-marquee";

export const metadata: Metadata = { title: "About Us", description: "Meet the DevQuest Pakistan leadership and community core team." };

const officials = [
  {
    name: "Hamid Ali",
    role: "Founder & CEO",
    detail: "DevOps Engineer, former AWS SBG BZU Lead, and Stanford University Section Leader",
    image: "/figma/founder-hamid-v2.png",
    accent: "cyan",
    imageStyle: {
      objectFit: "contain" as const,
      objectPosition: "right bottom",
      transform: "translate(35px, 25px) scale(1.22)",
      transformOrigin: "right bottom",
    },
  },
  {
    name: "Muhammad Ryan",
    role: "Co-Founder",
    detail: "Community leadership, partnerships, and growth",
    image: "/figma/official-2.png",
    accent: "purple",
    imageStyle: {
      objectFit: "contain" as const,
      objectPosition: "right bottom",
      transform: "translate(-10px, 15px) scale(0.86)",
      transformOrigin: "right bottom",
    },
  },
];

type AboutTeamMember = { name: string; role: string; group: string; image?: string; detail?: string; institution?: string; linkedin?: string; github?: string; portfolio?: string; photoFit?: "cover" | "contain"; photoPosition?: string };

const team: AboutTeamMember[] = [
  { name: "Muhammad Zahid", role: "Graphics Lead / Trainer", group: "Design", image: "/team/muhammad-zahid.jpeg", detail: "Graphics Lead and Trainer at DevQuest PK.", linkedin: "https://www.linkedin.com/in/zahid102/", photoPosition: "center 36%" }, { name: "Areesha Khan", role: "Technical Lead", group: "Technical Team", image: "/team/areesha-khan.jpeg", detail: "Technical Lead at DevQuest PK.", institution: "Sir Syed University of Engineering and Technology · Karachi", linkedin: "https://www.linkedin.com/in/areesha-khan-4124ba282/", photoPosition: "center 28%" }, { name: "Humair Tariq", role: "Technical Co-Lead", group: "Technical Team", image: "/team/humair-tariq.webp", detail: "Technical Co-Lead at DevQuest PK.", linkedin: "https://www.linkedin.com/in/humair-tariq-b4a19b373/", photoPosition: "center 18%" },
  { name: "Mohsin Nawaz", role: "Administrative Lead", group: "Administration", image: "/team/mohsin-nawaz.jpeg", detail: "Software Engineer at Virtual University and Administration Lead at DevQuest PK.", institution: "Virtual University Head Office, Islamabad G-5 · Islamabad", linkedin: "https://www.linkedin.com/in/mohsin-nawaz-a10a57284/", photoPosition: "center 22%" }, { name: "Ameema Waheed", role: "Administrative Co-Lead · Karachi Events Regional Lead", group: "Administration", image: "/team/ameema-waheed.jpeg", detail: "Administration Lead at DevQuest PK.", institution: "Jinnah University for Women · Karachi", linkedin: "https://www.linkedin.com/in/ameema-waheed-566220282/", photoPosition: "center 6%" }, { name: "Ammar Shafique", role: "Operations Lead", group: "Operations", image: "/team/ammar-shafique.jpeg", detail: "Operations Lead at DevQuest PK.", linkedin: "https://www.linkedin.com/in/ammar-shafiq-18830733b/", photoPosition: "center 18%" },
  { name: "Madeeha Talib", role: "Operations Co-Lead", group: "Operations", image: "/team/madeeha-talib.jpeg", detail: "Operations Co-Lead at DevQuest.", institution: "DevQuest · Karachi", github: "https://github.com/Madeeha-Talib", portfolio: "https://madeeha-talib.github.io/Portfolio/", photoFit: "contain", photoPosition: "center" }, { name: "Khadija Faheem", role: "Social Media Manager", group: "Social", image: "/team/khadija-faheem.png", detail: "Social Media Manager at DevQuest PK.", institution: "Jinnah University for Women · Karachi", linkedin: "https://www.linkedin.com/in/khadija-f-b70b4926a/", photoPosition: "center 22%" }, { name: "Anza Tamveel", role: "Social Media Co-Lead / Co-Manager", group: "Social", image: "/team/anza-tamveel.jpeg", detail: "Social Media Co-Lead and Co-Manager at DevQuest PK.", institution: "UET Lahore · Lahore", photoPosition: "center 30%" },
];

export default function AboutPage() {
  return (
    <div className="dq-about-page">
      <section className="dq-about-hero">
        <div className="dq-shell dq-about-grid"><div><span>Welcome to</span><h1>Team DevQuest<br />About Us!</h1><p>We are empowering a global community of innovators by bridging academia and the technology industry through inclusive learning, boundless experimentation, and impactful solutions across Pakistan.</p><div><a className="dq-btn dq-btn-blue" href="#member-signup">Create an account</a><Link className="dq-btn dq-btn-slate" href="/community#join">Join the community</Link></div></div><div className="dq-about-logo"><Image src="/figma/about-logo.png" alt="DevQuest logo" fill sizes="420px" /></div></div>
      </section>

      <section className="dq-officials dq-shell"><h2>Our Officials</h2><div className="dq-official-grid">{officials.map((person) => <article className={`dq-official-card ${person.accent}`} key={person.name}><div><small>DEVQUEST OFFICIAL</small><h3>{person.role}</h3><p>{person.name}</p><span>{person.detail}</span><Link href="/contact">See More <ArrowUpRight /></Link></div><Image src={person.image} alt={person.name} fill sizes="360px" style={person.imageStyle} /></article>)}</div></section>

      <section className="dq-team-section" id="team"><div className="dq-shell"><h2>Our Team</h2><div className="dq-figma-team-grid">{team.map(({ name, role, group, image, detail, institution, linkedin, github, portfolio, photoFit, photoPosition }, index) => <article className={image ? "dq-team-profile-card" : ""} key={name}><small>{group}</small><h3>{role}</h3><div className={`dq-team-portrait portrait-${index % 3}`}>{image ? <Image src={image} alt={name} fill sizes="360px" style={{ objectFit: photoFit || "cover", objectPosition: photoPosition || "center 24%" }} /> : <span>{name.split(" ").map((part) => part[0]).slice(0, 2).join("")}</span>}</div><strong>{name}</strong>{detail && <p className="dq-team-detail">{detail}</p>}{institution && <p className="dq-team-institution">{institution}</p>}<div className="dq-team-links">{linkedin && <Link href={linkedin} target="_blank" rel="noreferrer">View LinkedIn <ArrowUpRight /></Link>}{github && <Link href={github} target="_blank" rel="noreferrer">View GitHub <Github /></Link>}{portfolio && <Link href={portfolio} target="_blank" rel="noreferrer">View portfolio <Globe2 /></Link>}{!linkedin && !github && !portfolio && <Link href="/contact">Get in touch <ArrowUpRight /></Link>}</div></article>)}</div></div></section>

      <section className="dq-about-partners"><div className="dq-shell"><p className="dq-kicker">PARTNERS &amp; SPONSORS</p><h2>Our program is<br />backed by the best.</h2><p>We collaborate with universities and technology partners to build learning experiences with real community value.</p></div><SponsorMarquee /></section>

      {/* Teams in Collaboration CTA — full-bleed photo with left shadow overlay (No fade block) */}
      <section className="dq-tic-cta-section relative overflow-hidden bg-[#060e1f]">
        {/* Full-section background photo */}
        <div className="absolute inset-0 z-0 select-none pointer-events-none overflow-hidden">
          <Image
            src="/figma/mou-signing-group.jpg"
            alt="DevQuest and AWS SBG BZU team at MoU signing ceremony"
            fill
            sizes="100vw"
            className="object-cover object-[80%_30%]"
            priority
          />
        </div>

        {/* Top-left ring orb effect */}
        <div className="absolute -left-[300px] -top-[350px] w-[600px] h-[600px] rounded-full border-[110px] border-[#44d2ff]/15 pointer-events-none z-[5]" />

        {/* Soft left shadow overlay so text is readable over Person 1 without a hard fade block */}
        <div className="hidden md:block absolute inset-0 z-10" style={{ background: "linear-gradient(to right, rgba(6,14,31,0.95) 0%, rgba(6,14,31,0.85) 35%, rgba(6,14,31,0.4) 50%, transparent 65%)" }} />

        {/* Mobile gradient overlay */}
        <div className="block md:hidden absolute inset-0 z-10 bg-gradient-to-t from-[#060e1f] via-[#060e1f]/90 to-[#060e1f]/30" />

        <div className="dq-shell dq-tic-cta-grid relative !z-20" style={{ zIndex: 20 }}>
          <div>
            <p className="dq-kicker"><Handshake aria-hidden="true" /> TEAMS IN COLLABORATION</p>
            <h2>Building a network of<br />campus innovators.</h2>
            <p>DevQuest partners with student bodies, tech societies, and universities across Pakistan to co-create learning experiences, host events, and sign formal Memoranda of Understanding.</p>
            <div>
              <Link className="dq-btn dq-btn-blue" href="/teams-in-collaboration">Explore Partnerships <ArrowUpRight /></Link>
              <Link className="dq-btn dq-btn-slate" href="/contact">Propose a Collaboration</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
