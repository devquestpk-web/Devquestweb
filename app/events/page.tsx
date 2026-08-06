import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, BookOpen, CalendarDays, Clock3, Globe2, GraduationCap, Lightbulb, MapPin, Rocket, Sparkles, Trophy, Users } from "lucide-react";

export const metadata: Metadata = { title: "Events & Academy", description: "Explore DevQuest workshops, webinars, campus events, and technology learning programs." };

const highlights = [
  { icon: Lightbulb, type: "Ideas & community", title: "TechTrivium", copy: "A high-energy technology experience connecting ideas, challenges, and curious minds." },
  { icon: GraduationCap, type: "Learning milestone", title: "E-Course Farewell", copy: "Celebrating progress, persistence, and the people who completed a shared learning journey." },
  { icon: BookOpen, type: "Accessible learning", title: "Tech In Ramadan", copy: "Focused virtual sessions keeping community learning active throughout Ramadan." },
];

export default function EventsPage() {
  const whatsapp = "https://wa.me/923704489589?text=Hello%20DevQuest%2C%20I%20want%20to%20register%20for%20an%20upcoming%20event.";
  return (
    <>
      <section className="page-hero events-hero"><div className="page-hero-shape" /><div className="shell page-hero-grid"><div><p className="eyebrow eyebrow-light"><Sparkles /> EVENTS & ACADEMY</p><h1>Learn together. Build what comes <span>next.</span></h1><p>Practical sessions, campus experiences, and community-led programs for students and early-career developers across Pakistan.</p><div className="hero-actions"><a className="button button-light" href={whatsapp} target="_blank" rel="noreferrer">Get event updates <ArrowRight /></a><a className="button button-outline-light" href="#highlights">Explore highlights</a></div></div><div className="event-ticket"><div className="ticket-top"><span>FEATURED SERIES</span><Rocket /></div><h2>Innovate Pakistan</h2><p>Technology experiences made to spark useful ideas and real collaboration.</p><div className="ticket-meta"><span><Globe2 /> Hybrid format</span><span><Users /> Open community</span><span><CalendarDays /> New dates soon</span></div><div className="ticket-code">DEVQUEST / 2026</div></div></div></section>

      <section className="section section-light"><div className="shell featured-program"><div className="program-visual"><div className="program-ring ring-one" /><div className="program-ring ring-two" /><Rocket /><strong>INNOVATE<br />PAKISTAN</strong></div><div className="program-copy"><p className="eyebrow">FLAGSHIP HYBRID SERIES</p><h2>Big ideas belong in the room.</h2><p>Innovate Pakistan brings physical gatherings and virtual webinars into one accessible series—connecting students with practical topics, experienced voices, and new collaborators.</p><div className="program-meta"><span><MapPin /> Campus + online</span><span><Clock3 /> Focused sessions</span><span><Trophy /> Participation opportunities</span></div><a className="button button-primary" href={whatsapp} target="_blank" rel="noreferrer">Ask about the next session <ArrowUpRight /></a></div></div></section>

      <section className="section events-dark" id="highlights"><div className="shell"><div className="section-heading-row"><div><p className="eyebrow eyebrow-light">PAST HIGHLIGHTS</p><h2>Moments that moved the community forward.</h2></div><p className="heading-copy light-copy">Foundational events are usually free, keeping practical learning open to more people.</p></div><div className="card-grid three-cols">{highlights.map(({ icon: Icon, type, title, copy }) => <article className="history-card" key={title}><div className="history-visual"><Icon /></div><span>{type}</span><h3>{title}</h3><p>{copy}</p></article>)}</div></div></section>

      <section className="section section-light"><div className="shell"><div className="center-heading dark-heading"><p className="eyebrow">BOOTCAMP TRACKS</p><h2>Start with the fundamentals.</h2><p>Short, approachable learning paths designed to turn theory into confident practice.</p></div><div className="track-grid"><article><span>FOUNDATION</span><CodeBadge label="01" /><h3>Next.js Basics</h3><p>Modern web fundamentals and practical application structure.</p><a href={whatsapp} target="_blank" rel="noreferrer">Register interest <ArrowRight /></a></article><article><span>FOUNDATION</span><CodeBadge label="02" /><h3>Git Foundations</h3><p>Version control, collaboration, and cleaner development workflows.</p><a href={whatsapp} target="_blank" rel="noreferrer">Register interest <ArrowRight /></a></article><article><span>INTERMEDIATE</span><CodeBadge label="03" /><h3>Backend Design</h3><p>APIs, databases, security, and dependable system thinking.</p><a href={whatsapp} target="_blank" rel="noreferrer">Register interest <ArrowRight /></a></article></div></div></section>

      <section className="mini-cta"><div className="shell"><div><p className="eyebrow eyebrow-light">BRING DEVQUEST TO YOUR CAMPUS</p><h2>Let&apos;s create a meaningful learning experience.</h2></div><Link className="button button-light" href="/contact">Become a campus partner <ArrowUpRight /></Link></div></section>
    </>
  );
}

function CodeBadge({ label }: { label: string }) { return <div className="code-badge"><span>&lt;/&gt;</span><small>{label}</small></div>; }
