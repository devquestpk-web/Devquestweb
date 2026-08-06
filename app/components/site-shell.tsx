import Link from "next/link";
import { Facebook, Instagram, Linkedin, Mail, MapPin, Menu, MessageCircle, Phone, Youtube } from "lucide-react";

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className={`dq-brand${compact ? " is-compact" : ""}`} aria-label="DevQuest PK home">
      <span className="dq-brand-mark" aria-hidden="true">
        <i /><i /><i /><b /><b />
      </span>
      <span>DevQuest <strong>PK</strong></span>
    </Link>
  );
}

const navigation = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/services", label: "Services" },
  { href: "/events", label: "Events & Academy" },
  { href: "/community", label: "Community" },
  { href: "/contact", label: "Contact Us" },
];

export function SiteHeader() {
  return (
    <header className="dq-header">
      <div className="dq-shell dq-nav">
        <Brand compact />
        <nav className="dq-desktop-nav" aria-label="Main navigation">
          {navigation.map((item) => <Link key={item.href} href={item.href}>{item.label}</Link>)}
        </nav>
        <a className="dq-login" href="#member-signin">Log In</a>
        <details className="dq-mobile-nav">
          <summary aria-label="Open navigation"><Menu /></summary>
          <nav>
            {navigation.map((item) => <Link key={item.href} href={item.href}>{item.label}</Link>)}
            <a href="#member-signin">Log In</a>
          </nav>
        </details>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <>
      <footer className="dq-footer">
        <div className="dq-shell dq-footer-title"><Brand /><p>Empowering a global community of innovators.</p></div>
        <div className="dq-shell dq-footer-grid">
          <div><h3>Reach us</h3><a href="tel:+923704489589"><Phone /> +92 370 4489589</a><a href="mailto:devquestpk@gmail.com"><Mail /> devquestpk@gmail.com</a><span><MapPin /> Islamabad, Pakistan</span></div>
          <div><h3>Explore</h3><Link href="/about">About</Link><Link href="/services">Services</Link><Link href="/events">Events &amp; Academy</Link><Link href="/contact">Contact</Link></div>
          <div><h3>Community</h3><Link href="/about#team">Our team</Link><Link href="/community#chapters">University chapters</Link><Link href="/community#join">Become an ambassador</Link></div>
          <div><h3>Follow</h3><a href="https://pk.linkedin.com/company/devquest-pk" target="_blank" rel="noreferrer"><Linkedin /> LinkedIn</a><a href="https://www.instagram.com/devquestpk/" target="_blank" rel="noreferrer"><Instagram /> Instagram</a><a href="https://www.facebook.com/DevQuestPKOfficial" target="_blank" rel="noreferrer"><Facebook /> Facebook</a><a href="https://www.youtube.com/@DevQuestPK" target="_blank" rel="noreferrer"><Youtube /> YouTube</a></div>
          <div className="dq-newsletter"><h3>Join our newsletter</h3><p>Updates on events, learning, and community opportunities.</p><a href="mailto:devquestpk@gmail.com?subject=Subscribe%20me%20to%20DevQuest">Subscribe by email</a></div>
        </div>
        <div className="dq-shell dq-footer-bottom"><span>&copy; {new Date().getFullYear()} DevQuest Pakistan</span><span>Learn. Build. Lead.</span></div>
      </footer>
      <a className="floating-contact" href="https://wa.me/923704489589?text=Hello%20DevQuest" target="_blank" rel="noreferrer" aria-label="Chat with DevQuest on WhatsApp"><span>We are here!</span><MessageCircle /></a>
    </>
  );
}
