"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, BriefcaseBusiness, CalendarDays, ChevronDown, Facebook, Github, Home, Info, Instagram, Layers3, Linkedin, Mail, MapPin, Megaphone, Menu, MessageCircle, Phone, UserRound, UsersRound, Youtube } from "lucide-react";

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
  { href: "/", label: "Home", icon: Home },
  { href: "/about", label: "About", icon: Info },
  { href: "/services", label: "Services", icon: Layers3 },
  { href: "/events", label: "Events & Academy", icon: CalendarDays },
  { href: "/community", label: "Community", icon: UsersRound, isDropdown: true },
  { href: "/portal", label: "Portals", icon: Layers3 },
  { href: "/careers", label: "Careers", icon: BriefcaseBusiness },
  { href: "/contact", label: "Contact Us", icon: Mail },
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
      <div className="dq-announcement">
        <div className="dq-shell dq-announcement-inner">
          <a href="/events#student-enrollment"><Megaphone /> <span>Upcoming: AWS Cloud Practitioner Prep Series</span><b /> <span>Fri–Sun, 8 PM – 10 PM</span><b /> <strong>Register now <ArrowRight /></strong></a>
          <div className="dq-announcement-meta"><span><MapPin /> MNS-UET Multan</span><span><UsersRound /> Dev Community</span><i /><a href="https://pk.linkedin.com/company/devquest-pk" target="_blank" rel="noreferrer" aria-label="DevQuest PK on LinkedIn"><Linkedin /></a><a href="https://github.com/DevQuestPK" target="_blank" rel="noreferrer" aria-label="DevQuest PK on GitHub"><Github /></a><a href="https://www.youtube.com/@DevQuestPK" target="_blank" rel="noreferrer" aria-label="DevQuest PK on YouTube"><Youtube /></a><a href="https://discord.com" target="_blank" rel="noreferrer" aria-label="DevQuest PK community"><MessageCircle /></a></div>
        </div>
      </div>
      <div className="dq-shell dq-nav-frame">
        <div className="dq-nav">
          <Brand compact />
          <nav className="dq-desktop-nav" aria-label="Main navigation">
          {navigation.map((item) =>
            item.isDropdown ? (
              <div key={item.label} className="dq-dropdown">
                <span className="dq-dropdown-trigger">
                  <item.icon /> {item.label} <ChevronDown />
                </span>
                <div className="dq-dropdown-menu">
                  <Link href="/community">STUDENT CHAPTERS</Link>
                  <Link href="/teams-in-collaboration">PARTNERS</Link>
                </div>
              </div>
            ) : (
              <Link key={item.href} href={item.href} className={pathname === item.href ? "is-active" : ""}><item.icon /> {item.label}</Link>
            )
          )}
          </nav>
          <Link className="dq-member-login" href="/team"><UserRound /> Member Login</Link>
          <a className="dq-login" href="#member-signin">Log In <ArrowRight /></a>
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
              {navigation.map((item) =>
                item.isDropdown ? (
                  <div key={item.label} className="dq-mobile-dropdown">
                    <span className="dq-mobile-dropdown-label">Community</span>
                    <div className="dq-mobile-dropdown-items">
                      <Link href="/community" onClick={() => setIsMobileMenuOpen(false)}>STUDENT CHAPTERS</Link>
                      <Link href="/teams-in-collaboration" onClick={() => setIsMobileMenuOpen(false)}>PARTNERS</Link>
                    </div>
                  </div>
                ) : (
                  <Link key={item.href} href={item.href} onClick={() => setIsMobileMenuOpen(false)}>{item.label}</Link>
                )
              )}
              <Link href="/team" onClick={() => setIsMobileMenuOpen(false)}>Member Login</Link>
              <a href="#member-signin" onClick={() => setIsMobileMenuOpen(false)}>Log In</a>
            </nav>
          )}
          </div>
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
          <div><h3>Community</h3><Link href="/about#team">Our team</Link><Link href="/community#chapters">University chapters</Link><Link href="/teams-in-collaboration">Teams in Collaboration</Link><Link href="/careers#campus-ambassador">Become an ambassador</Link></div>
          <div><h3>Follow</h3><a href="https://pk.linkedin.com/company/devquest-pk" target="_blank" rel="noreferrer"><Linkedin /> LinkedIn</a><a href="https://www.instagram.com/devquestpk/" target="_blank" rel="noreferrer"><Instagram /> Instagram</a><a href="https://www.facebook.com/DevQuestPKOfficial" target="_blank" rel="noreferrer"><Facebook /> Facebook</a><a href="https://www.youtube.com/@DevQuestPK" target="_blank" rel="noreferrer"><Youtube /> YouTube</a></div>
          <div className="dq-newsletter"><h3>Join our newsletter</h3><p>Updates on events, learning, and community opportunities.</p><a href="mailto:hello@devquestpk.com?subject=Subscribe%20me%20to%20DevQuest">Subscribe by email</a></div>
        </div>
        <div className="dq-shell dq-footer-bottom"><span>&copy; {new Date().getFullYear()} DevQuest Pakistan</span><span>Learn. Build. Lead.</span></div>
      </footer>
      <a className="floating-contact" href="https://wa.me/923704489589?text=Hello%20DevQuest" target="_blank" rel="noreferrer" aria-label="Chat with DevQuest on WhatsApp"><span>We are here!</span><MessageCircle /></a>
    </>
  );
}
