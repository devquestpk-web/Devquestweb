"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
  { href: "/portal", label: "Portals" },
  { href: "/careers", label: "Careers" },
  { href: "/contact", label: "Contact Us" },
];

export function SiteHeader() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const mobileNavRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isMobileMenuOpen) return;

    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!mobileNavRef.current?.contains(event.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsMobileMenuOpen(false);
    };

    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isMobileMenuOpen]);

  return (
    <header className="dq-header">
      <div className="dq-shell dq-nav">
        <Brand compact />
        <nav className="dq-desktop-nav" aria-label="Main navigation">
          {navigation.map((item) => <Link key={item.href} href={item.href}>{item.label}</Link>)}
        </nav>
        <a className="dq-login" href="#member-signin">Log In</a>
        <div className="dq-mobile-nav" ref={mobileNavRef}>
          <button
            type="button"
            aria-label={isMobileMenuOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-navigation"
            onClick={() => setIsMobileMenuOpen((isOpen) => !isOpen)}
          >
            <Menu />
          </button>
          {isMobileMenuOpen && (
            <nav id="mobile-navigation" aria-label="Mobile navigation">
              {navigation.map((item) => <Link key={item.href} href={item.href} onClick={() => setIsMobileMenuOpen(false)}>{item.label}</Link>)}
              <a href="#member-signin" onClick={() => setIsMobileMenuOpen(false)}>Log In</a>
            </nav>
          )}
        </div>
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
          <div><h3>Reach us</h3><a href="tel:+923704489589"><Phone /> +92 370 4489589</a><a href="mailto:hello@devquestpk.com"><Mail /> hello@devquestpk.com</a><span><MapPin /> Multan, Pakistan</span></div>
          <div><h3>Explore</h3><Link href="/about">About</Link><Link href="/services">Services</Link><Link href="/events">Events &amp; Academy</Link><Link href="/portal">Portals</Link><Link href="/careers">Careers</Link><Link href="/application-status">Application status</Link><Link href="/contact">Contact</Link></div>
          <div><h3>Community</h3><Link href="/about#team">Our team</Link><Link href="/community#chapters">University chapters</Link><Link href="/careers#campus-ambassador">Become an ambassador</Link></div>
          <div><h3>Follow</h3><a href="https://pk.linkedin.com/company/devquest-pk" target="_blank" rel="noreferrer"><Linkedin /> LinkedIn</a><a href="https://www.instagram.com/devquestpk/" target="_blank" rel="noreferrer"><Instagram /> Instagram</a><a href="https://www.facebook.com/DevQuestPKOfficial" target="_blank" rel="noreferrer"><Facebook /> Facebook</a><a href="https://www.youtube.com/@DevQuestPK" target="_blank" rel="noreferrer"><Youtube /> YouTube</a></div>
          <div className="dq-newsletter"><h3>Join our newsletter</h3><p>Updates on events, learning, and community opportunities.</p><a href="mailto:hello@devquestpk.com?subject=Subscribe%20me%20to%20DevQuest">Subscribe by email</a></div>
        </div>
        <div className="dq-shell dq-footer-bottom"><span>&copy; {new Date().getFullYear()} DevQuest Pakistan</span><span>Learn. Build. Lead.</span></div>
      </footer>
      <a className="floating-contact" href="https://wa.me/923704489589?text=Hello%20DevQuest" target="_blank" rel="noreferrer" aria-label="Chat with DevQuest on WhatsApp"><span>We are here!</span><MessageCircle /></a>
    </>
  );
}
