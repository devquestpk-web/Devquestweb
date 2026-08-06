import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ClipboardCheck, GraduationCap, UsersRound } from "lucide-react";

export const metadata: Metadata = {
  title: "Portals",
  description: "Access the DevQuest student and team portals.",
};

export default function PortalsPage() {
  return (
    <div className="portal-hub">
      <section className="portal-hub-hero dq-shell">
        <p className="portal-kicker">DEVQUEST DIGITAL WORKSPACE</p>
        <h1>One community.<br />Two focused portals.</h1>
        <p>Learning opportunities for students and organized operations for the people building DevQuest.</p>
      </section>

      <section className="portal-choice-grid dq-shell" aria-label="Choose a DevQuest portal">
        <article className="portal-choice portal-choice-student">
          <div className="portal-choice-icon"><GraduationCap /></div>
          <span>Launching soon</span>
          <h2>Student Portal</h2>
          <p>Courses, event registrations, certificates, learning progress, and opportunities—all in one place.</p>
          <Link href="/portal/student">Preview student portal <ArrowRight /></Link>
        </article>

        <article className="portal-choice portal-choice-team">
          <div className="portal-choice-icon"><UsersRound /></div>
          <span>Team workspace</span>
          <h2>Team Portal</h2>
          <p>Manage assignments, record attendance, submit progress reports, and keep the core team aligned.</p>
          <div className="portal-feature-pills"><b><ClipboardCheck /> Tasks</b><b>Attendance</b><b>Reports</b></div>
          <Link href="/portal/team">Open team portal <ArrowRight /></Link>
        </article>
      </section>
    </div>
  );
}
