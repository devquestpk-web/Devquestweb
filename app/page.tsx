import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Blocks,
  CalendarDays,
  Code2,
  GraduationCap,
  Handshake,
  MapPin,
  Palette,
  Rocket,
  Sparkles,
  Users,
} from "lucide-react";
import { ContactForm, ThemeToggle } from "./components/client-widgets";
import { SponsorMarquee } from "./components/sponsor-marquee";
import { CareerCards } from "./components/career-cards";

export const metadata: Metadata = {
  title: "Empowering a Global Community of Innovators",
  description:
    "DevQuest bridges academia and the global technology industry through learning, events, collaboration, and impactful digital solutions.",
};

const programs = [
  { icon: "/figma/program-mentorship.svg", title: "Mentorship", copy: "Gain practical insight from experienced mentors and guest speakers who guide your learning path." },
  { icon: "/figma/program-certified.svg", title: "Get Certified", copy: "Build verifiable skills through structured courses, guided projects, and completion milestones." },
  { icon: "/figma/program-career.svg", title: "Career Preparation", copy: "Strengthen your portfolio and turn curiosity into confident career direction." },
  { icon: "/figma/program-community.svg", title: "Community", copy: "Meet motivated learners, collaborators, and future teammates across Pakistan." },
];

const services = [
  { icon: Blocks, number: "01", title: "Software Development", copy: "Reliable web products, cloud platforms, and APIs designed around real business goals.", href: "/services#development" },
  { icon: Palette, number: "02", title: "UI/UX Design", copy: "Clear, accessible digital experiences shaped through research, prototyping, and collaboration.", href: "/services#design" },
  { icon: Users, number: "03", title: "Talent Bridge", copy: "Connect with emerging developers who have been mentored and evaluated by our network.", href: "/services#talent" },
];

const eventImages = [
  { src: "/events/mlsa-presentation.jpg", alt: "DevQuest presentation about empowering a global community", position: "center 58%" },
  { src: "/events/mlsa-devquest-award.jpg", alt: "DevQuest appreciation award displayed beside the DevQuest logo", position: "center" },
  { src: "/events/mlsa-award-ceremony-1.jpg", alt: "DevQuest team members receiving an award at the MLSA counselling event", position: "center 38%" },
  { src: "/events/mlsa-award-ceremony-2.jpg", alt: "DevQuest representatives at the MLSA award ceremony", position: "center 38%" },
  { src: "/events/mlsa-community-group-1.jpg", alt: "DevQuest and MLSA community members at Garrison Library", position: "center 56%" },
  { src: "/events/mlsa-community-group-2.jpg", alt: "DevQuest and MLSA participants gathered after the community event", position: "center 54%" },
  { src: "/events/mlsa-organizing-team.jpg", alt: "DevQuest and MLSA organizing team group photo", position: "center 56%" },
  { src: "/events/mlsa-devquest-team.jpg", alt: "DevQuest team members standing behind a laptop displaying the DevQuest logo", position: "center 42%" },
  { src: "/figma/event-1.png", alt: "DevQuest community event", position: "center" },
  { src: "/figma/event-2.png", alt: "DevQuest technology gathering", position: "center" },
];

const universities = [
  "BZU",
  "MNS-UET",
  "NFC",
  "IET",
  "NUST",
  "FAST",
  "Air University",
  "Bahria University",
  "Superior University",
  "GIKI",
  "SMIU Karachi",
  "Sir Syed University",
];

export default function Home() {
  const joinLink = "https://wa.me/923704489589?text=Hello%20DevQuest%2C%20I%20would%20like%20to%20join%20the%20community.";

  return (
    <div className="dq-home">
      <section className="dq-course-hero">
        <div className="dq-orb dq-orb-a" /><div className="dq-orb dq-orb-b" />
        <div className="dq-shell dq-course-grid">
          <div className="dq-course-copy">
            <p className="dq-hero-kicker"><Sparkles /> COMMUNITY · TECHNOLOGY · INNOVATION</p>
            <h1>Bridging Academia<br />{" "}and the Global<br />{" "}Tech Industry.</h1>
            <p>DevQuest empowers students, early-career developers, and technology enthusiasts through practical learning, collaborative events, and impactful solutions.</p>
            <div className="dq-course-actions"><Link className="dq-btn dq-btn-blue" href="/services">Explore Services <ArrowRight /></Link><a className="dq-btn dq-btn-slate" href={joinLink} target="_blank" rel="noreferrer">Join Community <ArrowUpRight /></a></div>
            <div className="dq-hero-stats" aria-label="DevQuest community statistics">
              <div><strong>4.3K+</strong><span>community followers</span></div>
              <div><strong>2+</strong><span>years of impact</span></div>
              <div><strong>2</strong><span>university hubs</span></div>
            </div>
            <strong>Explore learning paths:</strong>
            <div className="dq-category-grid"><span>Web Development</span><span>Video Editing</span><span>Graphics Designing</span><span>AI / ML</span><span>Cyber Security</span><span>Freelancing</span></div>
          </div>
          <div className="dq-portrait-collage" aria-label="DevQuest learners">
            <div className="dq-portrait p-one"><Image src="/figma/hero-community-member-navy.png" alt="DevQuest community member" fill sizes="190px" /></div>
            <div className="dq-portrait p-two"><Image src="/figma/founder-hamid-v2.png" alt="Hamid Ali, Founder and CEO of DevQuest" fill sizes="190px" /></div>
            <div className="dq-portrait p-three"><Image src="/figma/hero-2.png" alt="Student with notebooks" fill sizes="190px" /></div>
            <div className="dq-portrait p-four"><Image src="/figma/hero-4.png" alt="Learner holding a tablet" fill sizes="190px" /></div>
            <i className="dq-dot dot-gold" /><i className="dq-dot dot-blue" />
            <article className="dq-next-event"><span><Rocket /></span><small>NEXT EXPERIENCE</small><strong>Innovate Pakistan Tech Series</strong><p><CalendarDays /> New sessions coming soon</p><p><MapPin /> Pakistan · Hybrid</p><Link href="/events">View the series <ArrowUpRight /></Link></article>
          </div>
        </div>
        <ThemeToggle />
      </section>

      <section className="dq-network-strip" aria-label="DevQuest university network">
        <div className="dq-shell dq-network-layout">
          <span className="dq-network-label">BUILDING LEARNING ECOSYSTEMS WITH</span>
          <div className="dq-university-marquee">
            <div className="dq-university-track">
              <div className="dq-university-set">{universities.map((university) => <strong key={university}>{university}</strong>)}</div>
              <div className="dq-university-set" aria-hidden="true">{universities.map((university) => <strong key={`copy-${university}`}>{university}</strong>)}</div>
            </div>
          </div>
        </div>
      </section>

      <section className="dq-impact-section" id="about">
        <div className="dq-shell dq-impact-grid">
          <div><p className="dq-kicker">BUILT FOR MEANINGFUL PROGRESS</p><h2>Where learning turns into real-world impact.</h2><p>We bring strategy, mentorship, engineering, and community together so emerging technologists can move from curiosity to confident contribution.</p><Link href="/about">Meet DevQuest <ArrowUpRight /></Link></div>
          <div className="dq-impact-orbit"><div className="dq-impact-core"><Sparkles /><strong>Impact</strong></div><span className="impact-node impact-a"><Code2 /> Engineering</span><span className="impact-node impact-b"><Palette /> Design</span><span className="impact-node impact-c"><GraduationCap /> Learning</span><span className="impact-node impact-d"><Handshake /> Community</span><div className="impact-outcome"><strong>Boundless</strong><span>experimentation</span></div></div>
        </div>
      </section>

      <section className="dq-services-preview">
        <div className="dq-shell"><div className="dq-section-heading"><div><p className="dq-kicker">WHAT WE DO</p><h2>One community.<br />Three paths to progress.</h2></div><Link href="/services">Explore all services <ArrowRight /></Link></div><div className="dq-service-grid">{services.map(({ icon: Icon, number, title, copy, href }) => <article key={title}><span><Icon /></span><small>{number}</small><h3>{title}</h3><p>{copy}</p><Link href={href}>Explore <ArrowUpRight /></Link></article>)}</div></div>
      </section>

      <section className="dq-program-section">
        <div className="dq-shell">
          <p className="dq-kicker">OUR ACADEMY</p>
          <h2>Launch your experience through<br />transformative courses,<br />sessions, and mentorship.</h2>
          <div className="dq-program-grid">{programs.map((program) => <article key={program.title}><Image src={program.icon} alt="" width={96} height={96} /><h3>{program.title}</h3><p>{program.copy}</p></article>)}</div>
          <div className="dq-inline-cta"><Link href="/events">Explore Events &amp; Academy <ArrowRight /></Link></div>
        </div>
      </section>

      <section className="dq-events-showcase">
        <div className="dq-shell dq-events-head"><div><p className="dq-kicker">DEVELOP RELATIONSHIPS</p><h2>Events that move<br />the community forward.</h2></div><p>Innovate Pakistan combines high-impact physical events and virtual webinars. Past experiences include TechTrivium, E-Course Farewell, and Tech In Ramadan—most foundational community events are free.</p></div>
        <div className="dq-event-gallery" aria-label="Highlights from DevQuest events">
          <div className="dq-event-track">
            <div className="dq-event-set">{eventImages.map((event, index) => <div key={`event-${index}`}><Image src={event.src} alt={event.alt} fill sizes="(max-width: 800px) 82vw, 32vw" style={{ objectPosition: event.position }} /></div>)}</div>
            <div className="dq-event-set" aria-hidden="true">{eventImages.map((event, index) => <div key={`event-copy-${index}`}><Image src={event.src} alt="" fill sizes="(max-width: 800px) 82vw, 32vw" style={{ objectPosition: event.position }} /></div>)}</div>
          </div>
        </div>
        <div className="dq-shell dq-event-cta"><Link href="/events">Explore the academy <ArrowUpRight /></Link><a href="https://wa.me/923704489589?text=Hello%20DevQuest%2C%20please%20share%20upcoming%20event%20details." target="_blank" rel="noreferrer">Register on WhatsApp <ArrowUpRight /></a></div>
      </section>

      <section className="dq-sponsors">
        <div className="dq-shell"><p className="dq-kicker">PARTNERS &amp; SPONSORS</p><h2>Our program is<br />backed by the best.</h2><p>We have a dynamic network of companies and universities that support our mission.</p></div>
        <SponsorMarquee />
      </section>

      <section className="dq-careers-home">
        <div className="dq-shell"><div className="dq-careers-heading"><div><p className="dq-kicker">CAREERS AT DEVQUEST</p><h2>Join our<br />Technical Team.</h2></div><p>Work with a growing technology community where engineering, design, cloud, AI, and partnerships come together.</p></div><CareerCards preview /></div>
      </section>

      <section className="dq-home-cta"><div className="dq-shell dq-home-cta-grid"><div><p className="dq-kicker">START YOUR QUEST</p><h2>Build skills. Find your people. Create what matters.</h2><p>Join students, developers, mentors, universities, and partners shaping a more collaborative technology ecosystem.</p><div><a className="dq-btn dq-btn-blue" href="#member-signup">Create an account</a><Link className="dq-btn dq-btn-slate" href="/contact">Partner with us</Link></div></div><ContactForm compact /></div></section>
    </div>
  );
}
