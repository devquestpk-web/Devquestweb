import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export const metadata: Metadata = { title: "About Us", description: "Meet the DevQuest Pakistan leadership and community core team." };

const officials = [
  { name: "Hamid Ali", role: "Founder & CEO", detail: "DevOps Engineer and community visionary", image: "/figma/official-2.png", accent: "cyan" },
  { name: "Muhammad Ryan", role: "Co-Founder", detail: "Community leadership and growth", image: "/figma/official-3.png", accent: "purple" },
  { name: "Rao Taha Javed", role: "Co-Founder & Operations", detail: "Director of Operations and event host", image: "/figma/official-1.png", accent: "green" },
];

const team = [
  ["Muhammad Zahid", "Visual Designing Mentor", "Design"], ["Areesha", "Senior Graphics Designer", "Design"], ["Faraiha Tariq", "Junior Graphics Designer", "Design"],
  ["Mohsin Nawaz", "Senior Administrative Lead", "Administration"], ["Ameema Waheed", "Co-Administrative Lead", "Administration"], ["Ammar Shafiq", "Operations Lead", "Operations"],
  ["Madeeha Talib", "Operations Co-Lead", "Operations"], ["Khadija Faheem", "Social Media Manager", "Social"], ["Anza Tamveel", "Social Media Co-Manager", "Social"],
];

export default function AboutPage() {
  return (
    <div className="dq-about-page">
      <section className="dq-about-hero">
        <div className="dq-shell dq-about-grid"><div><span>Welcome to</span><h1>Team DevQuest<br />About Us!</h1><p>Learn about our mission and the people building an open, practical technology community across Pakistan.</p><div><a className="dq-btn dq-btn-blue" href="#member-signup">Sign Up</a><a className="dq-btn dq-btn-slate" href="#member-signin">Register</a></div></div><div className="dq-about-logo"><Image src="/figma/about-logo.png" alt="DevQuest logo" fill sizes="420px" /></div></div>
      </section>

      <section className="dq-officials dq-shell"><h2>Our Officials</h2><div className="dq-official-grid">{officials.map((person) => <article className={`dq-official-card ${person.accent}`} key={person.name}><div><small>DEVQUEST OFFICIAL</small><h3>{person.role}</h3><p>{person.name}</p><span>{person.detail}</span><Link href="/contact">See More <ArrowUpRight /></Link></div><Image src={person.image} alt={person.name} fill sizes="360px" /></article>)}</div></section>

      <section className="dq-team-section" id="team"><div className="dq-shell"><h2>Our Team</h2><div className="dq-figma-team-grid">{team.map(([name, role, group], index) => <article key={name}><small>{group}</small><h3>{role}</h3><div className={`dq-team-portrait portrait-${index % 3}`}><span>{name.split(" ").map((part) => part[0]).slice(0, 2).join("")}</span></div><strong>{name}</strong><Link href="/contact">Get in touch <ArrowUpRight /></Link></article>)}</div></div></section>

      <section className="dq-about-partners"><div className="dq-shell"><p className="dq-kicker">PARTNERS &amp; SPONSORS</p><h2>Our program is<br />backed by the best.</h2><p>We collaborate with universities and technology partners to build learning experiences with real community value.</p></div><div className="dq-sponsor-row">{Array.from({length: 7},(_, index) => <div key={index}><Image src={`/figma/sponsor-${index + 1}.png`} alt="DevQuest partner" width={248} height={120} /></div>)}</div></section>
    </div>
  );
}
