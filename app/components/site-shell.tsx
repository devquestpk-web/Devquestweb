import Link from "next/link";
import { ChevronDown, Facebook, Instagram, Linkedin, Mail, MapPin, Menu, Phone, Youtube } from "lucide-react";

function Brand() {
  return (
    <Link href="/" className="brand" aria-label="DevQuest home">
      <span className="brand-mark" aria-hidden="true">
        <i className="brand-bar brand-bar-one" /><i className="brand-bar brand-bar-two" /><i className="brand-bar brand-bar-three" />
        <i className="brand-dot brand-dot-one" /><i className="brand-dot brand-dot-two" />
      </span>
      <span className="brand-word">DevQuest</span>
    </Link>
  );
}

const navigation = [
  { href: "/", label: "Home" }, { href: "/services", label: "Services" }, { href: "/events", label: "Events" },
  { href: "/community", label: "Community" }, { href: "/#about", label: "About" }, { href: "/contact", label: "Contact" },
];

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="topbar"><div className="shell topbar-inner"><div className="topbar-contact"><a href="tel:+923704489589"><Phone /> +92 370 4489589</a><a href="mailto:devquestpk@gmail.com"><Mail /> devquestpk@gmail.com</a></div><div className="topbar-social" aria-label="Social links"><a href="https://pk.linkedin.com/company/devquest-pk" target="_blank" rel="noreferrer" aria-label="LinkedIn"><Linkedin /></a><a href="https://www.instagram.com/devquestpk/" target="_blank" rel="noreferrer" aria-label="Instagram"><Instagram /></a><a href="https://www.facebook.com/DevQuestPKOfficial" target="_blank" rel="noreferrer" aria-label="Facebook"><Facebook /></a><a href="https://www.youtube.com/@DevQuestPK" target="_blank" rel="noreferrer" aria-label="YouTube"><Youtube /></a></div></div></div>
      <div className="nav-wrap"><div className="shell nav-inner"><Brand /><nav className="desktop-nav" aria-label="Main navigation">{navigation.map((item) => item.label === "Services" ? <div className="nav-dropdown" key={item.href}><Link href={item.href}>Services <ChevronDown /></Link><div className="dropdown-panel"><Link href="/services#development">Software development</Link><Link href="/services#design">UI/UX design</Link><Link href="/services#talent">Talent augmentation</Link></div></div> : <Link key={item.href} href={item.href}>{item.label}</Link>)}</nav><Link className="button button-primary nav-cta" href="/community#join">Join community <span>↗</span></Link><details className="mobile-menu"><summary aria-label="Open navigation"><Menu /></summary><nav aria-label="Mobile navigation">{navigation.map((item) => <Link key={item.href} href={item.href}>{item.label}</Link>)}<Link className="button button-primary" href="/community#join">Join community</Link></nav></details></div></div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer"><div className="shell footer-grid"><div className="footer-brand"><Brand /><p>Empowering a global community of innovators through learning, collaboration, and technology.</p><div className="social-row"><a href="https://pk.linkedin.com/company/devquest-pk" target="_blank" rel="noreferrer" aria-label="LinkedIn"><Linkedin /></a><a href="https://www.instagram.com/devquestpk/" target="_blank" rel="noreferrer" aria-label="Instagram"><Instagram /></a><a href="https://www.facebook.com/DevQuestPKOfficial" target="_blank" rel="noreferrer" aria-label="Facebook"><Facebook /></a><a href="https://www.youtube.com/@DevQuestPK" target="_blank" rel="noreferrer" aria-label="YouTube"><Youtube /></a></div></div><div><h3>Explore</h3><Link href="/services">Services</Link><Link href="/events">Events & Academy</Link><Link href="/community">Community</Link><Link href="/#about">About DevQuest</Link></div><div><h3>Community</h3><Link href="/community#chapters">University chapters</Link><Link href="/community#team">Our team</Link><Link href="/community#join">Become an ambassador</Link><Link href="/events">Upcoming programs</Link></div><div className="footer-contact"><h3>Let&apos;s connect</h3><a href="mailto:devquestpk@gmail.com"><Mail /> devquestpk@gmail.com</a><a href="tel:+923704489589"><Phone /> +92 370 4489589</a><span><MapPin /> Pakistan</span></div></div><div className="shell footer-bottom"><span>© {new Date().getFullYear()} DevQuest PK. All rights reserved.</span><span>Learn. Build. Lead.</span></div></footer>
  );
}
