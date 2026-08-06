import type { Metadata } from "next";
import Link from "next/link";
import { ArrowDown, BadgeCheck, CalendarCheck2, GraduationCap, MessageCircle, Users } from "lucide-react";
import { AmbassadorForm } from "./ambassador-form";

export const metadata: Metadata = {
  title: "Campus Ambassador Application",
  description: "Apply to represent DevQuest PK, build a technology community, and create meaningful opportunities at your campus.",
};

const responsibilities = [
  "Represent DevQuest professionally at your university",
  "Organize workshops, meetups, and awareness campaigns",
  "Connect students with events and learning opportunities",
  "Share campus feedback with the DevQuest core team",
];

export default function AmbassadorPage() {
  return (
    <>
      <section className="ambassador-hero">
        <div className="dq-shell ambassador-hero-grid">
          <div>
            <p className="eyebrow eyebrow-light"><GraduationCap /> CAMPUS AMBASSADOR PROGRAM</p>
            <h1>Lead the quest<br />on your <span>campus.</span></h1>
            <p>Represent DevQuest, grow a thriving student technology community, and create opportunities that help your peers learn, build, and lead.</p>
            <Link className="button button-light" href="#apply">Start your application <ArrowDown /></Link>
          </div>
          <div className="ambassador-hero-panel" aria-label="Campus ambassador program highlights">
            <article><span><Users /></span><div><small>BUILD</small><strong>A stronger campus community</strong></div></article>
            <article><span><CalendarCheck2 /></span><div><small>CREATE</small><strong>Events with real student value</strong></div></article>
            <article><span><BadgeCheck /></span><div><small>GROW</small><strong>Leadership and professional skills</strong></div></article>
          </div>
        </div>
      </section>

      <section className="ambassador-application" id="apply">
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
    </>
  );
}
