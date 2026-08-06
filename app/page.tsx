import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Blocks, BookOpen, CalendarDays, Code2, GraduationCap, Handshake, Lightbulb, MapPin, Palette, Rocket, Sparkles, Users } from "lucide-react";
import { ContactForm } from "./components/client-widgets";

export const metadata: Metadata = {
  title: "Empowering a Global Community of Innovators",
  description: "DevQuest connects students, developers, universities, and technology partners across Pakistan.",
};

export default function Home() {
  return (
    <>
      <section className="hero">
        <div className="hero-glow hero-glow-one" /><div className="hero-glow hero-glow-two" />
        <div className="shell hero-grid">
          <div className="hero-copy">
            <p className="eyebrow eyebrow-light"><Sparkles /> COMMUNITY • TECHNOLOGY • INNOVATION</p>
            <h1>Empowering a global community of <span>innovators.</span></h1>
            <p className="hero-lead">DevQuest connects students, developers, and technology leaders through practical learning, collaborative events, and impactful solutions.</p>
            <div className="hero-actions">
              <Link className="button button-light" href="/events">Explore events <ArrowRight /></Link>
              <Link className="button button-outline-light" href="/community#join">Join community <ArrowUpRight /></Link>
            </div>
            <div className="hero-stats" aria-label="Community statistics">
              <div><strong>4.3K+</strong><span>community followers</span></div>
              <div><strong>2+</strong><span>years of impact</span></div>
              <div><strong>2</strong><span>university hubs</span></div>
            </div>
          </div>
          <div className="hero-panel-wrap">
            <div className="hero-panel">
              <span className="hero-panel-icon"><Rocket /></span>
              <p className="eyebrow">NEXT EXPERIENCE</p>
              <h2>Innovate Pakistan Tech Series</h2>
              <p>A hybrid series of high-impact campus events and practical virtual webinars.</p>
              <div className="event-mini-meta"><span><CalendarDays /> New sessions coming soon</span><span><MapPin /> Pakistan · Hybrid</span></div>
              <Link className="button button-primary button-wide" href="/events">Discover the series <ArrowUpRight /></Link>
              <div className="hero-panel-links"><Link href="/community">Meet the community</Link><a href="https://wa.me/923704489589?text=Hello%20DevQuest%2C%20please%20share%20upcoming%20event%20details." target="_blank" rel="noreferrer">Ask on WhatsApp</a></div>
            </div>
          </div>
        </div>
      </section>

      <section className="logo-strip"><div className="shell logo-strip-inner"><span>Building learning ecosystems with</span><strong>BZU</strong><i /><strong>MNS-UET Multan</strong><i /><strong>TazQ Solutions</strong></div></section>

      <section className="section section-light" id="about">
        <div className="shell split-intro">
          <div><p className="eyebrow">BUILT FOR MEANINGFUL PROGRESS</p><h2 className="display-heading">Where learning turns into real-world impact.</h2></div>
          <div className="intro-copy"><p>We bring strategy, mentorship, engineering, and community together so emerging technologists can move from curiosity to confident contribution.</p><Link className="text-link" href="/community">Meet DevQuest <ArrowUpRight /></Link></div>
        </div>
        <div className="shell orbit-card">
          <div className="orbit-lines" aria-hidden="true" /><div className="orbit-core"><Sparkles /><strong>Impact</strong></div>
          <div className="orbit-node node-one"><Code2 /><span>Engineering</span></div><div className="orbit-node node-two"><Palette /><span>Design</span></div><div className="orbit-node node-three"><GraduationCap /><span>Learning</span></div><div className="orbit-node node-four"><Handshake /><span>Community</span></div>
          <div className="outcome-card"><strong>Boundless</strong><span>experimentation</span></div>
        </div>
      </section>

      <section className="section service-preview">
        <div className="shell">
          <div className="section-heading-row"><div><p className="eyebrow eyebrow-light">WHAT WE DO</p><h2>One community. Three paths to progress.</h2></div><Link className="button button-outline-light" href="/services">Explore all services <ArrowRight /></Link></div>
          <div className="card-grid three-cols">
            <article className="feature-card"><span><Blocks /></span><p>01</p><h3>Software development</h3><p>Reliable web products and scalable cloud solutions built around real goals.</p><Link href="/services#development">Explore development <ArrowUpRight /></Link></article>
            <article className="feature-card"><span><Palette /></span><p>02</p><h3>UI/UX design</h3><p>Clear, accessible product experiences shaped through research and collaboration.</p><Link href="/services#design">Explore design <ArrowUpRight /></Link></article>
            <article className="feature-card"><span><Users /></span><p>03</p><h3>Talent bridge</h3><p>Connect with emerging developers who have been mentored and evaluated by our network.</p><Link href="/services#talent">Explore talent <ArrowUpRight /></Link></article>
          </div>
        </div>
      </section>

      <section className="section section-light events-preview">
        <div className="shell">
          <div className="section-heading-row dark-heading"><div><p className="eyebrow">EVENTS & ACADEMY</p><h2>Learn with people who are building, too.</h2></div><Link className="text-link" href="/events">View all programs <ArrowRight /></Link></div>
          <div className="event-grid">
            <article className="event-card event-card-featured"><div className="event-visual visual-innovate"><span>INNOVATE<br />PAKISTAN</span><Rocket /></div><div className="event-body"><div className="tags"><span>Flagship series</span><span>Hybrid</span></div><h3>Innovate Pakistan Tech Series</h3><p>High-impact physical events and focused virtual webinars for Pakistan&apos;s next generation of innovators.</p><Link className="text-link" href="/events">Explore the series <ArrowUpRight /></Link></div></article>
            <div className="event-stack"><article className="event-card compact-event"><div className="event-icon"><Lightbulb /></div><div><span>Past highlight</span><h3>TechTrivium</h3><p>Ideas, technology, and community in one energetic experience.</p></div></article><article className="event-card compact-event"><div className="event-icon"><BookOpen /></div><div><span>Community learning</span><h3>Tech In Ramadan</h3><p>Accessible sessions designed to keep learning moving forward.</p></div></article></div>
          </div>
        </div>
      </section>

      <section className="section cta-section">
        <div className="shell cta-grid"><div><p className="eyebrow eyebrow-light">START YOUR QUEST</p><h2>Build skills. Find your people. Create what matters.</h2><p>Join students, developers, mentors, and partners shaping a more collaborative technology ecosystem.</p><div className="hero-actions"><Link className="button button-light" href="/community#join">Join DevQuest <ArrowRight /></Link><Link className="button button-outline-light" href="/contact">Partner with us</Link></div></div><ContactForm compact /></div>
      </section>
    </>
  );
}
