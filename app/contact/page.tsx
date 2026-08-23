import type { Metadata } from "next";
import { Instagram, Linkedin, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { FigmaContactForm } from "../components/client-widgets";

export const metadata: Metadata = { title: "Contact Us", description: "Contact DevQuest Pakistan for community, academy, event, and partnership enquiries." };

export default function ContactPage() {
  return (
    <div className="dq-contact-page">
      <section className="dq-contact-intro dq-shell"><h1>Contact Us</h1><p>Any question or remarks? Just write us a message!</p></section>
      <section className="dq-shell dq-contact-card">
        <aside className="dq-contact-info">
          <h2>Contact Information</h2><p>Say something to start a live chat!</p>
          <div className="dq-contact-lines"><a href="tel:+923704489589"><Phone /> +92 370 448 9589</a><a href="mailto:hello@devquestpk.com"><Mail /> hello@devquestpk.com</a><span><MapPin /> Multan, Pakistan</span></div>
          <div className="dq-contact-social"><a href="https://pk.linkedin.com/company/devquest-pk" target="_blank" rel="noreferrer" aria-label="LinkedIn"><Linkedin /></a><a href="https://www.instagram.com/devquestpk/" target="_blank" rel="noreferrer" aria-label="Instagram"><Instagram /></a><a href="https://wa.me/923704489589" target="_blank" rel="noreferrer" aria-label="WhatsApp"><MessageCircle /></a></div>
          <i className="contact-circle one" /><i className="contact-circle two" />
        </aside>
        <FigmaContactForm />
      </section>
    </div>
  );
}
