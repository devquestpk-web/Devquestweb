"use client";

import { FormEvent, useState } from "react";
import { ArrowUpRight, CheckCircle2, Mail, ShieldCheck } from "lucide-react";

export function ContactForm({ compact = false }: { compact?: boolean }) {
  const [sent, setSent] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") || "");
    const email = String(form.get("email") || "");
    const scope = String(form.get("scope") || "General enquiry");
    const subject = encodeURIComponent(`DevQuest enquiry from ${name}`);
    const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\nProject / message:\n${scope}`);
    setSent(true);
    window.location.href = `mailto:devquestpk@gmail.com?subject=${subject}&body=${body}`;
  }

  return (
    <form className={`contact-form ${compact ? "contact-form-compact" : ""}`} onSubmit={handleSubmit}>
      {!compact && <span className="form-icon"><Mail /></span>}
      <p className="eyebrow">NO-OBLIGATION DISCOVERY CALL</p>
      <h2>{compact ? "Start a conversation." : "Let’s build something meaningful."}</h2>
      <p className="form-copy">Share a few details and we&apos;ll help you identify the clearest next step.</p>
      <label><span>Your name</span><input name="name" required placeholder="Full name" autoComplete="name" /></label>
      <label><span>Work email</span><input name="email" type="email" required placeholder="you@company.com" autoComplete="email" /></label>
      {!compact && <label><span>What can we help with?</span><textarea name="scope" required placeholder="Tell us about your project, partnership, or idea." rows={4} /></label>}
      <div className="privacy-note"><ShieldCheck /> Your details stay private. No spam.</div>
      <button className="button button-primary button-wide" type="submit">
        {sent ? <><CheckCircle2 /> Opening your email</> : <>Send enquiry <ArrowUpRight /></>}
      </button>
    </form>
  );
}
