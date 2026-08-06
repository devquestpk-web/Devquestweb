import type { Metadata } from "next";
import Link from "next/link";
import { ArrowDown, ArrowUpRight, Sparkles } from "lucide-react";
import { CareerCards } from "../components/career-cards";

export const metadata: Metadata = {
  title: "Careers",
  description: "Explore technical and business career opportunities with DevQuest PK.",
};

export default function CareersPage() {
  return (
    <main className="dq-careers-page">
      <section className="dq-careers-hero">
        <div className="dq-shell dq-careers-hero-grid">
          <div><p className="dq-kicker"><Sparkles /> JOIN THE QUEST</p><h1>Build technology.<br />Grow with <span>purpose.</span></h1></div>
          <div><p>Join a collaborative team creating practical technology, community programs, and opportunities for learners across Pakistan.</p><Link className="dq-btn dq-btn-blue" href="#open-roles">Explore open roles <ArrowDown /></Link></div>
        </div>
      </section>
      <section className="dq-careers-list" id="open-roles">
        <div className="dq-shell"><div className="dq-careers-heading"><div><p className="dq-kicker">OPEN OPPORTUNITIES</p><h2>Technical Team</h2></div><p>Select a role to review its focus areas, then send your CV and a short introduction to the DevQuest official email.</p></div><CareerCards /></div>
      </section>
      <section className="dq-careers-cta"><div className="dq-shell"><p className="dq-kicker">DON&apos;T SEE YOUR ROLE?</p><h2>Show us what you can bring.</h2><p>We welcome thoughtful applications from people who care about technology, learning, and community impact.</p><a className="dq-btn dq-btn-blue" href="mailto:devquestpk@gmail.com?subject=General Career Application — DevQuest">Send an open application <ArrowUpRight /></a></div></section>
    </main>
  );
}
