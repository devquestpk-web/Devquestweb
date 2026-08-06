import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { ThemeToggle } from "./components/client-widgets";

export const metadata: Metadata = {
  title: "Your Modern Courses Hub",
  description: "Learn practical technology skills with the DevQuest Pakistan community.",
};

const programs = [
  { icon: "/figma/program-mentorship.svg", title: "Mentorship", copy: "Gain practical insight from experienced mentors and guest speakers who guide your learning path." },
  { icon: "/figma/program-certified.svg", title: "Get Certified", copy: "Build verifiable skills through structured courses, guided projects, and completion milestones." },
  { icon: "/figma/program-career.svg", title: "Career Preparation", copy: "Explore disciplines, strengthen your portfolio, and turn curiosity into confident career direction." },
  { icon: "/figma/program-community.svg", title: "Community", copy: "Meet motivated learners, collaborators, and future teammates across Pakistan." },
];

const sponsors = Array.from({ length: 7 }, (_, index) => `/figma/sponsor-${index + 1}.png`);

export default function Home() {
  return (
    <div className="dq-home">
      <section className="dq-course-hero">
        <div className="dq-orb dq-orb-a" /><div className="dq-orb dq-orb-b" />
        <div className="dq-shell dq-course-grid">
          <div className="dq-course-copy">
            <h1>Your Modern<br />Courses Hub</h1>
            <p>Want to learn premium technology skills online?<br />Join the DevQuest community now.</p>
            <div className="dq-course-actions"><a className="dq-btn dq-btn-blue" href="#member-signup">Sign Up</a><a className="dq-btn dq-btn-slate" href="#member-signin">Register</a></div>
            <strong>Choose Category:</strong>
            <div className="dq-category-grid"><span>Web Development</span><span>Video Editing</span><span>Graphics Designing</span><span>AI / ML</span><span>Cyber Security</span><span>Freelancing</span></div>
          </div>
          <div className="dq-portrait-collage" aria-label="DevQuest learners">
            <div className="dq-portrait p-one"><Image src="/figma/hero-3.png" alt="Technology learner" fill sizes="190px" /></div>
            <div className="dq-portrait p-two"><Image src="/figma/hero-1.png" alt="Student holding books" fill sizes="190px" /></div>
            <div className="dq-portrait p-three"><Image src="/figma/hero-2.png" alt="Student with notebooks" fill sizes="190px" /></div>
            <div className="dq-portrait p-four"><Image src="/figma/hero-4.png" alt="Learner holding a tablet" fill sizes="190px" /></div>
            <i className="dq-dot dot-gold" /><i className="dq-dot dot-blue" />
          </div>
        </div>
        <ThemeToggle />
      </section>

      <section className="dq-program-section">
        <div className="dq-shell">
          <p className="dq-kicker">OUR PROGRAM</p>
          <h2>Launch your experience enhancement<br />through our transformative<br />courses and sessions journey.</h2>
          <div className="dq-program-grid">
            {programs.map((program) => <article key={program.title}><Image src={program.icon} alt="" width={96} height={96} /><h3>{program.title}</h3><p>{program.copy}</p></article>)}
          </div>
        </div>
      </section>

      <section className="dq-sponsors">
        <div className="dq-shell"><p className="dq-kicker">PARTNERS &amp; SPONSORS</p><h2>Our program is<br />backed by the best.</h2><p>We have a dynamic network of companies and universities that support our mission.</p></div>
        <div className="dq-sponsor-row">{sponsors.map((src) => <div key={src}><Image src={src} alt="DevQuest partner" width={248} height={120} /></div>)}</div>
      </section>

      <section className="dq-events-showcase">
        <div className="dq-shell dq-events-head"><div><p className="dq-kicker">DEVELOP RELATIONSHIPS</p><h2>Checkout our<br />Events and Collabs</h2></div><p>Join our highly motivated community of students, developers, mentors, and partners. Meet future collaborators and build relationships that last.</p></div>
        <div className="dq-event-gallery">
          <div><Image src="/figma/event-1.png" alt="DevQuest community event" fill sizes="(max-width: 800px) 90vw, 40vw" /></div>
          <div><Image src="/figma/event-2.png" alt="DevQuest technology gathering" fill sizes="(max-width: 800px) 90vw, 40vw" /></div>
          <div><Image src="/figma/event-1.png" alt="DevQuest participants" fill sizes="(max-width: 800px) 90vw, 40vw" /></div>
          <div><Image src="/figma/event-2.png" alt="DevQuest collaboration" fill sizes="(max-width: 800px) 90vw, 40vw" /></div>
        </div>
        <div className="dq-shell dq-event-cta"><Link href="/events">Explore the academy <ArrowUpRight /></Link><a href="https://wa.me/923704489589" target="_blank" rel="noreferrer">Join the community <ArrowUpRight /></a></div>
      </section>
    </div>
  );
}
