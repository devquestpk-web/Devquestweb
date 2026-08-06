import Link from "next/link";
import { Facebook, Instagram, Linkedin, Mail, MapPin, Phone, Youtube } from "lucide-react";
import { Brand } from "./brand";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="shell footer-grid">
        <div className="footer-brand">
          <Brand />
          <p>Empowering a global community of innovators through learning, collaboration, and technology.</p>
          <div className="social-row">
            <a href="https://pk.linkedin.com/company/devquest-pk" target="_blank" rel="noreferrer" aria-label="LinkedIn"><Linkedin /></a>
            <a href="https://www.instagram.com/devquestpk/" target="_blank" rel="noreferrer" aria-label="Instagram"><Instagram /></a>
            <a href="https://www.facebook.com/DevQuestPKOfficial" target="_blank" rel="noreferrer" aria-label="Facebook"><Facebook /></a>
            <a href="https://www.youtube.com/@DevQuestPK" target="_blank" rel="noreferrer" aria-label="YouTube"><Youtube /></a>
          </div>
        </div>
        <div><h3>Explore</h3><Link href="/services">Services</Link><Link href="/events">Events & Academy</Link><Link href="/community">Community</Link><Link href="/#about">About DevQuest</Link></div>
        <div><h3>Community</h3><Link href="/community#chapters">University chapters</Link><Link href="/community#team">Our team</Link><Link href="/community#join">Become an ambassador</Link><Link href="/events">Upcoming programs</Link></div>
        <div className="footer-contact">
          <h3>Let&apos;s connect</h3>
          <a href="mailto:devquestpk@gmail.com"><Mail /> devquestpk@gmail.com</a>
          <a href="tel:+923704489589"><Phone /> +92 370 4489589</a>
          <span><MapPin /> Pakistan</span>
        </div>
      </div>
      <div className="shell footer-bottom"><span>© {new Date().getFullYear()} DevQuest PK. All rights reserved.</span><span>Learn. Build. Lead.</span></div>
    </footer>
  );
}
