import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Github, Globe2 } from "lucide-react";
import { SponsorMarquee } from "../components/sponsor-marquee";

export const metadata: Metadata = { title: "About Us", description: "Meet the DevQuest Pakistan leadership and community core team." };

const officials = [
  { name: "Hamid Ali", role: "Founder & CEO", detail: "DevOps Engineer, former AWS SBG BZU Lead, and Stanford University Section Leader", image: "/figma/founder-hamid-v2.png", accent: "cyan" },
  { name: "Muhammad Ryan", role: "Co-Founder", detail: "Community leadership, partnerships, and growth", image: "/figma/official-2.png", accent: "purple" },
];

type AboutTeamMember = { name: string; role: string; group: string; image?: string; detail?: string; institution?: string; linkedin?: string; github?: string; portfolio?: string; photoFit?: "cover" | "contain"; photoPosition?: string };

const team: AboutTeamMember[] = [
  { name: "Muhammad Zahid", role: "Graphics Lead / Trainer", group: "Design", image: "/team/muhammad-zahid.jpeg", detail: "Graphics Lead and Trainer at DevQuest PK.", linkedin: "https://www.linkedin.com/in/zahid102/", photoPosition: "center 36%" }, { name: "Areesha", role: "Senior Graphics Designer", group: "Design" }, { name: "Faraiha Tariq", role: "Junior Graphics Designer", group: "Design" },
  { name: "Mohsin Nawaz", role: "Administrative Lead", group: "Administration", image: "/team/mohsin-nawaz.jpeg", detail: "Software Engineer at Virtual University and Administration Lead at DevQuest PK.", institution: "Virtual University Head Office, Islamabad G-5 · Islamabad", linkedin: "https://www.linkedin.com/in/mohsin-nawaz-a10a57284/", photoPosition: "center 30%" }, { name: "Ameema Waheed", role: "Administrative Co-Lead · Karachi Events Regional Lead", group: "Administration", image: "/team/ameema-waheed.jpeg", detail: "Administration Lead at DevQuest PK.", institution: "Jinnah University for Women · Karachi", linkedin: "https://www.linkedin.com/in/ameema-waheed-566220282/", photoPosition: "center 22%" }, { name: "Ammar Shafiq", role: "Operations Lead", group: "Operations" },
  { name: "Madeeha Talib", role: "Operations Lead", group: "Operations", image: "/team/madeeha-talib.jpeg", detail: "Operations Lead at DevQuest.", institution: "DevQuest · Karachi", github: "https://github.com/Madeeha-Talib", portfolio: "https://madeeha-talib.github.io/Portfolio/", photoFit: "contain", photoPosition: "center" }, { name: "Khadija Faheem", role: "Social Media Manager", group: "Social" }, { name: "Anza Tamveel", role: "Social Media Co-Lead / Co-Manager", group: "Social", image: "/team/anza-tamveel.jpeg", detail: "Social Media Co-Lead and Co-Manager at DevQuest PK.", institution: "UET Lahore · Lahore", photoPosition: "center 30%" },
];

export default function AboutPage() {
  return (
    <div className="dq-about-page">
      <section className="dq-about-hero">
        <div className="dq-shell dq-about-grid"><div><span>Welcome to</span><h1>Team DevQuest<br />About Us!</h1><p>We are empowering a global community of innovators by bridging academia and the technology industry through inclusive learning, boundless experimentation, and impactful solutions across Pakistan.</p><div><a className="dq-btn dq-btn-blue" href="#member-signup">Create an account</a><Link className="dq-btn dq-btn-slate" href="/community#join">Join the community</Link></div></div><div className="dq-about-logo"><Image src="/figma/about-logo.png" alt="DevQuest logo" fill sizes="420px" /></div></div>
      </section>

      <section className="dq-officials dq-shell"><h2>Our Officials</h2><div className="dq-official-grid">{officials.map((person) => <article className={`dq-official-card ${person.accent}`} key={person.name}><div><small>DEVQUEST OFFICIAL</small><h3>{person.role}</h3><p>{person.name}</p><span>{person.detail}</span><Link href="/contact">See More <ArrowUpRight /></Link></div><Image src={person.image} alt={person.name} fill sizes="360px" /></article>)}</div></section>

      <section className="dq-team-section" id="team"><div className="dq-shell"><h2>Our Team</h2><div className="dq-figma-team-grid">{team.map(({ name, role, group, image, detail, institution, linkedin, github, portfolio, photoFit, photoPosition }, index) => <article className={image ? "dq-team-profile-card" : ""} key={name}><small>{group}</small><h3>{role}</h3><div className={`dq-team-portrait portrait-${index % 3}`}>{image ? <Image src={image} alt={name} fill sizes="360px" style={{ objectFit: photoFit || "cover", objectPosition: photoPosition || "center 24%" }} /> : <span>{name.split(" ").map((part) => part[0]).slice(0, 2).join("")}</span>}</div><strong>{name}</strong>{detail && <p className="dq-team-detail">{detail}</p>}{institution && <p className="dq-team-institution">{institution}</p>}<div className="dq-team-links">{linkedin && <Link href={linkedin} target="_blank" rel="noreferrer">View LinkedIn <ArrowUpRight /></Link>}{github && <Link href={github} target="_blank" rel="noreferrer">View GitHub <Github /></Link>}{portfolio && <Link href={portfolio} target="_blank" rel="noreferrer">View portfolio <Globe2 /></Link>}{!linkedin && !github && !portfolio && <Link href="/contact">Get in touch <ArrowUpRight /></Link>}</div></article>)}</div></div></section>

      <section className="dq-about-partners"><div className="dq-shell"><p className="dq-kicker">PARTNERS &amp; SPONSORS</p><h2>Our program is<br />backed by the best.</h2><p>We collaborate with universities and technology partners to build learning experiences with real community value.</p></div><SponsorMarquee /></section>
    </div>
  );
}
