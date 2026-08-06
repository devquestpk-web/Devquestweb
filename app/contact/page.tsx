import type { Metadata } from "next";
import { Clock3, Mail, MapPin, MessageCircle, Phone, Sparkles } from "lucide-react";
import { ContactForm } from "../components/contact-form";

export const metadata: Metadata = { title: "Contact", description: "Contact DevQuest PK for projects, partnerships, events, and community opportunities." };

export default function ContactPage() {
  return (
    <>
      <section className="page-hero contact-page-hero"><div className="page-hero-shape" /><div className="shell contact-hero-copy"><p className="eyebrow eyebrow-light"><Sparkles /> LET&apos;S CONNECT</p><h1>A clear conversation is a great place to <span>start.</span></h1><p>Tell us about your project, partnership, event, or community idea. We&apos;ll help you find the right next step.</p></div></section>
      <section className="section section-light contact-page-section"><div className="shell contact-layout"><div className="contact-details"><p className="eyebrow">CONTACT DEVQUEST</p><h2>Choose the channel that works for you.</h2><p>For quick community and event questions, WhatsApp is usually fastest. For detailed partnerships and project briefs, email works best.</p><div className="contact-methods"><a href="mailto:devquestpk@gmail.com"><span><Mail /></span><div><small>EMAIL</small><strong>devquestpk@gmail.com</strong></div></a><a href="https://wa.me/923704489589" target="_blank" rel="noreferrer"><span><MessageCircle /></span><div><small>WHATSAPP</small><strong>+92 370 4489589</strong></div></a><div><span><MapPin /></span><div><small>COMMUNITY</small><strong>Pakistan</strong></div></div><div><span><Clock3 /></span><div><small>RESPONSE TIME</small><strong>Within 1–2 working days</strong></div></div></div></div><ContactForm /></div></section>
    </>
  );
}
