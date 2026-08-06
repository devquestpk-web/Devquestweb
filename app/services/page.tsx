import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Blocks, Check, Cloud, Code2, Compass, Layers3, Palette, Search, ShieldCheck, Sparkles, Users } from "lucide-react";

export const metadata: Metadata = { title: "Services", description: "Software development, UI/UX design, and talent augmentation from DevQuest PK." };

const services = [
  { id: "development", number: "01", icon: Code2, title: "Software development", copy: "From focused web applications to scalable platforms, we build reliable technology around the way people actually work.", items: ["Product strategy & technical discovery", "Responsive web applications", "Cloud and API architecture", "Quality assurance & long-term support"] },
  { id: "design", number: "02", icon: Palette, title: "UI/UX design", copy: "We turn complex ideas into clear, accessible experiences through collaborative research, prototyping, and interface design.", items: ["Experience audits & user research", "Information architecture", "Wireframes & interactive prototypes", "Design systems & developer handoff"] },
  { id: "talent", number: "03", icon: Users, title: "Talent augmentation", copy: "Access motivated emerging developers supported by the learning, mentoring, and evaluation strength of the DevQuest community.", items: ["Role and skill mapping", "Talent screening", "Flexible project engagement", "Mentor-supported onboarding"] },
];

export default function ServicesPage() {
  return (
    <>
      <section className="page-hero"><div className="page-hero-shape" /><div className="shell page-hero-grid"><div><p className="eyebrow eyebrow-light"><Sparkles /> SERVICES</p><h1>Technology built around <span>real goals.</span></h1><p>Strategy, design, engineering, and talent—brought together to turn ambitious ideas into dependable digital experiences.</p><div className="hero-actions"><Link className="button button-light" href="/contact">Start a project <ArrowRight /></Link><Link className="button button-outline-light" href="#process">How we work</Link></div></div><div className="page-hero-art"><div className="art-card art-card-main"><Compass /><span>Strategy</span></div><div className="art-card art-one"><Code2 /> Engineering</div><div className="art-card art-two"><Palette /> Design</div><div className="art-card art-three"><Cloud /> Cloud</div></div></div></section>

      <section className="section section-light"><div className="shell"><div className="section-heading-row dark-heading"><div><p className="eyebrow">CAPABILITIES</p><h2>Built to move from idea to impact.</h2></div><p className="heading-copy">Choose one focused capability or bring us in across the full journey.</p></div><div className="services-list">{services.map(({ id, number, icon: Icon, title, copy, items }) => <article className="service-row" id={id} key={id}><div className="service-number">{number}</div><div className="service-icon"><Icon /></div><div className="service-copy"><h2>{title}</h2><p>{copy}</p><Link className="text-link" href="/contact">Discuss your needs <ArrowUpRight /></Link></div><ul>{items.map(item => <li key={item}><Check /> {item}</li>)}</ul></article>)}</div></div></section>

      <section className="section process-section" id="process"><div className="shell"><div className="center-heading"><p className="eyebrow eyebrow-light">OUR PROCESS</p><h2>Clarity at every step.</h2><p>Small feedback loops, visible progress, and decisions tied to outcomes.</p></div><div className="process-grid"><article><span><Search /></span><small>01</small><h3>Discover</h3><p>Understand the challenge, audience, and measures of success.</p></article><article><span><Layers3 /></span><small>02</small><h3>Shape</h3><p>Define the experience, architecture, and clearest delivery path.</p></article><article><span><Blocks /></span><small>03</small><h3>Build</h3><p>Create in focused stages with frequent reviews and quality checks.</p></article><article><span><ShieldCheck /></span><small>04</small><h3>Grow</h3><p>Launch confidently, learn from use, and improve what matters.</p></article></div></div></section>

      <section className="section section-light"><div className="shell talent-bridge"><div><p className="eyebrow">THE TALENT BRIDGE</p><h2>From promising learner to project-ready contributor.</h2><p>DevQuest helps emerging technologists develop practical skills, collaborate in real settings, and connect with meaningful opportunities.</p><Link className="button button-primary" href="/community#join">Join the talent network <ArrowRight /></Link></div><div className="bridge-flow"><div><strong>01</strong><span>Discover</span></div><i /><div><strong>02</strong><span>Train</span></div><i /><div><strong>03</strong><span>Evaluate</span></div><i /><div><strong>04</strong><span>Connect</span></div></div></div></section>

      <section className="mini-cta"><div className="shell"><div><p className="eyebrow eyebrow-light">HAVE A PROJECT IN MIND?</p><h2>Let&apos;s find the clearest next step.</h2></div><Link className="button button-light" href="/contact">Book a conversation <ArrowUpRight /></Link></div></section>
    </>
  );
}
