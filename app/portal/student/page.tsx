import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, BellRing, BookOpenCheck, CalendarDays, GraduationCap, Trophy } from "lucide-react";

export const metadata: Metadata = {
  title: "Student Portal — Coming Soon",
  description: "The DevQuest Student Portal is coming soon.",
};

export default function StudentPortalPage() {
  return (
    <div className="student-coming-soon">
      <div className="student-orbit student-orbit-one" />
      <div className="student-orbit student-orbit-two" />
      <section className="student-coming-card">
        <Link className="portal-back" href="/portal"><ArrowLeft /> All portals</Link>
        <div className="student-coming-icon"><GraduationCap /></div>
        <p className="portal-kicker">STUDENT PORTAL</p>
        <h1>Your next learning space is taking shape.</h1>
        <p className="student-coming-copy">Soon, every DevQuest learner will have one place to discover programs, track progress, join events, and celebrate achievements.</p>
        <div className="student-coming-features">
          <span><BookOpenCheck /> Learning paths</span>
          <span><CalendarDays /> Events</span>
          <span><Trophy /> Certificates</span>
        </div>
        <a className="dq-btn dq-btn-blue" href="mailto:devquestpk@gmail.com?subject=Student%20Portal%20Early%20Access"><BellRing /> Notify me at launch</a>
      </section>
    </div>
  );
}
