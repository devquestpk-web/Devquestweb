"use client";

import Image from "next/image";
import { FormEvent, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "../lib/supabase-browser";
import { AlertCircle, CheckCircle2, LoaderCircle, LockKeyhole, LogIn, LogOut, Mail, ShieldCheck, UserPlus, UserRound, X } from "lucide-react";
import { deliverWebsiteForm } from "../lib/form-delivery";

const getSupabase = getSupabaseBrowserClient;

export function ThemeToggle() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  useEffect(() => {
    const saved = window.localStorage.getItem("devquest-theme") === "light" ? "light" : "dark";
    document.documentElement.dataset.theme = saved;
    queueMicrotask(() => setTheme(saved));
  }, []);
  function choose(next: "dark" | "light") { setTheme(next); document.documentElement.dataset.theme = next; window.localStorage.setItem("devquest-theme", next); }
  return <div className="dq-theme-toggle" aria-label="Color theme"><button className={theme === "dark" ? "active" : ""} onClick={() => choose("dark")} type="button">Dark</button><button className={theme === "light" ? "active" : ""} onClick={() => choose("light")} type="button">Light</button></div>;
}

type DeliveryState = "idle" | "sending" | "sent" | "error";

function DeliveryMessage({ state, error }: { state: DeliveryState; error: string }) {
  if (state === "sent") return <div className="form-delivery-status success" role="status"><CheckCircle2 /> Thank you. Your message has been emailed to DevQuest.</div>;
  if (state === "error") return <div className="form-delivery-status error" role="alert"><AlertCircle /> {error}</div>;
  return null;
}

export function ContactForm({ compact = false }: { compact?: boolean }) {
  const [state, setState] = useState<DeliveryState>("idle");
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setState("sending");
    setError("");
    try {
      await deliverWebsiteForm("contact", {
        name: String(data.get("name") || ""),
        email: String(data.get("email") || ""),
        enquiry: String(data.get("scope") || "General enquiry"),
      }, String(data.get("website") || ""));
      form.reset();
      setState("sent");
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "We could not send your form. Please try again.");
      setState("error");
    }
  }
  return <form className={`contact-form ${compact ? "contact-form-compact" : ""}`} onSubmit={submit}><p className="eyebrow">START A CONVERSATION</p><h2>{compact ? "Tell us what you are building." : "Let's build something meaningful."}</h2><label><span>Your name</span><input name="name" required placeholder="Full name" autoComplete="name" /></label><label><span>Work email</span><input name="email" type="email" required placeholder="you@company.com" autoComplete="email" /></label><label><span>What can we help with?</span><textarea name="scope" required placeholder="Tell us about your project, partnership, event, or idea." rows={compact ? 3 : 4} /></label><input className="form-honeypot" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" /><div className="privacy-note"><ShieldCheck /> Your details go directly to devquestpk@gmail.com.</div><DeliveryMessage state={state} error={error} /><button className="button button-primary button-wide" type="submit" disabled={state === "sending"}>{state === "sending" ? "Sending..." : state === "sent" ? "Message sent" : "Send enquiry"}</button></form>;
}

export function FigmaContactForm() {
  const [state, setState] = useState<DeliveryState>("idle");
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setState("sending");
    setError("");
    try {
      await deliverWebsiteForm("contact", {
        name: `${data.get("firstName") || ""} ${data.get("lastName") || ""}`.trim(),
        email: String(data.get("email") || ""),
        phone: String(data.get("phone") || "Not provided"),
        companyOrUniversity: String(data.get("company") || "Not provided"),
        estimatedBudget: String(data.get("budget") || "Not selected"),
        enquiryType: String(data.get("subject") || "General Inquiry"),
        enquiryDetails: String(data.get("message") || ""),
      }, String(data.get("website") || ""));
      form.reset();
      setState("sent");
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "We could not send your form. Please try again.");
      setState("error");
    }
  }
  return <form className="dq-contact-form" onSubmit={submit}><div className="dq-form-pair"><label>First Name<input name="firstName" required autoComplete="given-name" /></label><label>Last Name<input name="lastName" required autoComplete="family-name" /></label></div><div className="dq-form-pair"><label>Business Email<input name="email" type="email" required autoComplete="email" /></label><label>Phone Number<input name="phone" type="tel" placeholder="+92" autoComplete="tel" /></label></div><div className="dq-form-pair"><label>Company or University<input name="company" autoComplete="organization" /></label><label>Estimated Budget<select name="budget" defaultValue=""><option value="" disabled>Select a range</option><option>Community / free event</option><option>Under PKR 100,000</option><option>PKR 100,000–500,000</option><option>PKR 500,000+</option><option>Let&apos;s discuss</option></select></label></div><fieldset><legend>How can we help?</legend><label><input type="radio" name="subject" value="General Inquiry" defaultChecked /> General</label><label><input type="radio" name="subject" value="Software Development" /> Development</label><label><input type="radio" name="subject" value="UI/UX Design" /> UI/UX</label><label><input type="radio" name="subject" value="Talent Augmentation" /> Talent</label><label><input type="radio" name="subject" value="Academy or Event" /> Academy</label><label><input type="radio" name="subject" value="Partnership" /> Partnership</label></fieldset><label>Project or Enquiry Details<textarea name="message" required rows={4} placeholder="Tell us about your project, event, partnership, or community idea..." /></label><input className="form-honeypot" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" /><DeliveryMessage state={state} error={error} /><button type="submit" disabled={state === "sending"}>{state === "sending" ? "Sending..." : state === "sent" ? "Message sent" : "Send Message"}</button></form>;
}

type Mode = "signin" | "signup";
export function AuthDock() {
  const [open, setOpen] = useState(false); const [mode, setMode] = useState<Mode>("signin"); const [user, setUser] = useState<User | null>(null); const [loading, setLoading] = useState(true); const [working, setWorking] = useState(false); const [message, setMessage] = useState<{type: "error" | "success"; text: string} | null>(null);
  useEffect(() => { const syncHash = () => { if (window.location.hash === "#member-signup") { setMode("signup"); setOpen(true); } if (window.location.hash === "#member-signin" || window.location.hash === "#member-access") { setMode("signin"); setOpen(true); } }; syncHash(); window.addEventListener("hashchange", syncHash); return () => window.removeEventListener("hashchange", syncHash); }, []);
  useEffect(() => { const supabase = getSupabase(); if (!supabase) { queueMicrotask(() => setLoading(false)); return; } supabase.auth.getSession().then(({ data }) => { setUser(data.session?.user ?? null); setLoading(false); }); const { data } = supabase.auth.onAuthStateChange((_event, session) => { setUser(session?.user ?? null); setLoading(false); }); return () => data.subscription.unsubscribe(); }, []);
  function close() { setOpen(false); if (window.location.hash.startsWith("#member-")) history.replaceState(null, "", `${window.location.pathname}${window.location.search}`); }
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setMessage(null); const supabase = getSupabase(); if (!supabase) { setMessage({ type: "error", text: "Add the DevQuest Supabase URL and public anon key to activate member access." }); return; } const data = new FormData(event.currentTarget); const email = String(data.get("email") || "").trim(); const password = String(data.get("password") || ""); const fullName = String(data.get("fullName") || "").trim(); setWorking(true); if (mode === "signin") { const { error } = await supabase.auth.signInWithPassword({ email, password }); setWorking(false); setMessage(error ? { type: "error", text: error.message } : { type: "success", text: "Welcome back to DevQuest." }); return; } const { data: created, error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName } } }); setWorking(false); setMessage(error ? { type: "error", text: error.message } : { type: "success", text: created.session ? "Your DevQuest account is ready." : "Check your email to confirm your DevQuest account." }); }
  async function signOut() { const supabase = getSupabase(); if (!supabase) return; setWorking(true); const { error } = await supabase.auth.signOut(); setWorking(false); if (error) setMessage({ type: "error", text: error.message }); else { setUser(null); setMessage({ type: "success", text: "You are signed out." }); } }
  const name = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Member";
  return <div className={`auth-dock ${open ? "is-open" : ""}`}>{open && <><button className="auth-backdrop" onClick={close} aria-label="Close account dialog" /><section className={`auth-popup auth-${mode}`} role="dialog" aria-modal="true" aria-label="DevQuest member access"><button className="auth-close" type="button" onClick={close} aria-label="Close member access"><X /></button><div className="auth-main"><div className="auth-logo"><Image src="/figma/auth-logo.png" alt="DevQuest" width={126} height={56} /></div><div className="auth-popup-head"><div><small>DEVQUEST COMMUNITY</small><h2>{user ? `Welcome, ${name}` : mode === "signin" ? "Sign in to your account" : "Welcome to DevQuest Community"}</h2>{!user && <p>{mode === "signin" ? "New here? Create your DevQuest account." : "Already a member? Sign in to continue."}</p>}</div></div>{loading ? <div className="auth-loading"><LoaderCircle className="spin" /> Checking your session...</div> : user ? <div className="auth-account"><div className="auth-user-row"><span>{name.slice(0, 2).toUpperCase()}</span><div><strong>{name}</strong><small>{user.email}</small></div></div><p>Your DevQuest session is active on this device.</p>{message && <Status {...message} />}<button className="dq-btn dq-btn-slate" type="button" onClick={signOut} disabled={working}>{working ? <LoaderCircle className="spin" /> : <LogOut />} Sign out</button></div> : <><div className="auth-tabs"><button type="button" className={mode === "signin" ? "active" : ""} onClick={() => { setMode("signin"); setMessage(null); }}><LogIn /> Sign in</button><button type="button" className={mode === "signup" ? "active" : ""} onClick={() => { setMode("signup"); setMessage(null); }}><UserPlus /> Create account</button></div><form className="auth-form" onSubmit={submit}>{mode === "signup" && <label><span>Full name</span><div><UserRound /><input name="fullName" required placeholder="Your name" autoComplete="name" /></div></label>}<label><span>Email address</span><div><Mail /><input name="email" type="email" required placeholder="you@example.com" autoComplete="email" /></div></label><label><span>Password</span><div><LockKeyhole /><input name="password" type="password" required minLength={8} placeholder="Use 8 or more characters" autoComplete={mode === "signin" ? "current-password" : "new-password"} /></div></label>{mode === "signup" && <div className="auth-requirements"><span>8+ characters</span><span>Upper &amp; lowercase</span><span>One number</span></div>}{message && <Status {...message} />}<button className="auth-submit" type="submit" disabled={working}>{working ? <><LoaderCircle className="spin" /> Please wait</> : mode === "signin" ? <>Sign In <LogIn /></> : <>Create an account <UserPlus /></>}</button></form><p className="auth-note">Authentication is controlled by DevQuest through its own Supabase project. No ChatGPT login is used.</p></>}</div>{mode === "signup" && !user && <aside className="auth-art"><Image src="/figma/signup-art.png" alt="Abstract three-dimensional blocks" fill sizes="50vw" /></aside>}</section></>}<button className="auth-trigger" type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open}>{user ? <span>{name.slice(0, 2).toUpperCase()}</span> : <UserRound />}<strong>{user ? "My account" : "Member access"}</strong></button></div>;
}

function Status({ type, text }: {type: "error" | "success"; text: string}) { return <div className={`auth-status ${type}`}>{type === "success" ? <CheckCircle2 /> : <AlertCircle />}{text}</div>; }
