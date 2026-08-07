import type { Metadata } from "next";
import Link from "next/link";
import { ArrowDown, ArrowUpRight, BadgeCheck, CalendarCheck2, GraduationCap, MessageCircle, Sparkles, Users } from "lucide-react";
import { CareerCards } from "../components/career-cards";
import { AmbassadorForm } from "./ambassador-form";

export const metadata: Metadata = {
  title: "Careers",
  description: "Explore careers and the Campus Ambassador Program with DevQuest PK.",
};

const responsibilities = [
  "Represent DevQuest professionally at your university",
  "Organize workshops, meetups, and awareness campaigns",
  "Connect students with events and learning opportunities",
  "Share campus feedback with the DevQuest core team",
];

export default function CareersPage() {
  return (
    <main className="dq-careers-page">
      <section className="dq-careers-hero">
        <div className="dq-shell dq-careers-hero-grid">
          <div><p className="dq-kicker"><Sparkles /> JOIN THE QUEST</p><h1>Build technology.<br />Grow with <span>purpose.</span></h1></div>
          <div><p>Join a collaborative team creating practical technology, community programs, and opportunities for learners across Pakistan.</p><div className="dq-careers-hero-actions"><Link className="dq-btn dq-btn-blue" href="#open-roles">Explore open roles <ArrowDown /></Link><Link className="dq-btn dq-btn-slate" href="#campus-ambassador">Campus Ambassador <GraduationCap /></Link></div></div>
        </div>
      </section>

      <section className="dq-careers-list" id="open-roles">
        <div className="dq-shell"><div className="dq-careers-heading"><div><p className="dq-kicker">OPEN OPPORTUNITIES</p><h2>Technical Team</h2></div><p>Select a role to review its focus areas, then complete the application form for that specific vacancy and attach your CV.</p></div><CareerCards /></div>
      </section>

      <section className="dq-careers-ambassador" id="campus-ambassador">
        <div className="dq-shell dq-careers-ambassador-grid">
          <div>
            <p className="dq-kicker"><GraduationCap /> STUDENT LEADERSHIP OPPORTUNITY</p>
            <h2>Lead the quest<br />on your <span>campus.</span></h2>
            <p>Represent DevQuest, grow a thriving student technology community, and create opportunities that help your peers learn, build, and lead.</p>
            <Link className="dq-btn dq-btn-blue" href="#ambassador-apply">Apply for the program <ArrowDown /></Link>
          </div>
          <div className="ambassador-hero-panel" aria-label="Campus ambassador program highlights">
            <article><span><Users /></span><div><small>BUILD</small><strong>A stronger campus community</strong></div></article>
            <article><span><CalendarCheck2 /></span><div><small>ORGANIZE</small><strong>Events, workshops, and campaigns</strong></div></article>
            <article><span><GraduationCap /></span><div><small>GROW</small><strong>Leadership and professional experience</strong></div></article>
          </div>
        </div>
      </section>

      <section className="ambassador-application" id="ambassador-apply">
        <div className="dq-shell ambassador-application-grid">
          <aside className="ambassador-guide">
            <p className="eyebrow">BEFORE YOU APPLY</p>
            <h2>Make an impact where you study.</h2>
            <p>We are looking for proactive university students who communicate well, enjoy helping others, and can commit time each week.</p>
            <ul>{responsibilities.map((item) => <li key={item}><BadgeCheck /> <span>{item}</span></li>)}</ul>
            <div className="ambassador-help"><MessageCircle /><div><small>NEED HELP?</small><strong>WhatsApp +92 370 4489589</strong></div></div>
          </aside>
          <AmbassadorForm />
        </div>
      </section>

      <section className="dq-careers-cta"><div className="dq-shell"><p className="dq-kicker">DON&apos;T SEE YOUR ROLE?</p><h2>Show us what you can bring.</h2><p>We welcome thoughtful applications from people who care about technology, learning, and community impact.</p><a className="dq-btn dq-btn-blue" href="mailto:devquestpk@gmail.com?subject=General%20Career%20Application%20-%20DevQuest">Send an open application <ArrowUpRight /></a></div></section>
    </main>
  );
}
