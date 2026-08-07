"use client";

import Image from "next/image";
import { FormEvent, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "../lib/supabase-browser";
import { AlertCircle, ArrowLeft, BriefcaseBusiness, CheckCircle2, ChevronRight, GraduationCap, LoaderCircle, LockKeyhole, LogIn, LogOut, Mail, ShieldCheck, UserRound, UsersRound, X } from "lucide-react";
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

type PortalRole = "team" | "admin";

export function AuthDock() {
  const [open, setOpen] = useState(false);
  const [portalRole, setPortalRole] = useState<PortalRole | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState<{type: "error" | "success"; text: string} | null>(null);

  useEffect(() => {
    const syncHash = () => {
      if (["#member-signup", "#member-signin", "#member-access"].includes(window.location.hash)) {
        setPortalRole(null);
        setMessage(null);
        setOpen(true);
      }
    };
    syncHash();
    window.addEventListener("hashchange", syncHash);
    return () => window.removeEventListener("hashchange", syncHash);
  }, []);
  useEffect(() => { const supabase = getSupabase(); if (!supabase) { queueMicrotask(() => setLoading(false)); return; } supabase.auth.getSession().then(({ data }) => { setUser(data.session?.user ?? null); setLoading(false); }); const { data } = supabase.auth.onAuthStateChange((_event, session) => { setUser(session?.user ?? null); setLoading(false); }); return () => data.subscription.unsubscribe(); }, []);
  function close() { setOpen(false); if (window.location.hash.startsWith("#member-")) history.replaceState(null, "", `${window.location.pathname}${window.location.search}`); }
  function chooseRole(role: "student" | "services" | PortalRole) {
    if (role === "student" || role === "services") { window.location.assign(`/portal/${role}`); return; }
    setPortalRole(role); setMessage(null);
  }
  function toggleAccess() { setOpen((value) => { if (!value) { setPortalRole(null); setMessage(null); } return !value; }); }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    const supabase = getSupabase();
    if (!supabase) { setMessage({ type: "error", text: "The DevQuest portal database connection still needs to be activated." }); return; }
    if (!portalRole) { setMessage({ type: "error", text: "Select a portal before signing in." }); return; }

    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") || "").trim();
    const password = String(data.get("password") || "");
    setWorking(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setWorking(false);
    if (error) { setMessage({ type: "error", text: error.message }); return; }
    window.location.assign(portalRole === "admin" ? "/portal/admin" : "/portal/team");
  }
  async function signOut() { const supabase = getSupabase(); if (!supabase) return; setWorking(true); const { error } = await supabase.auth.signOut(); setWorking(false); if (error) setMessage({ type: "error", text: error.message }); else { setUser(null); setMessage({ type: "success", text: "You are signed out." }); } }
  const name = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Member";

  return <div className={`auth-dock ${open ? "is-open" : ""}`}>
    {open && <>
      <button className="auth-backdrop" onClick={close} aria-label="Close account dialog" />
      <section className={`auth-popup auth-${portalRole ? "signin" : "role"}`} role="dialog" aria-modal="true" aria-label="DevQuest portal access">
        <button className="auth-close" type="button" onClick={close} aria-label="Close portal access"><X /></button>
        <div className="auth-main">
          <div className="auth-logo"><Image src="/figma/auth-logo.png" alt="DevQuest" width={126} height={56} /></div>
          {loading ? <div className="auth-loading"><LoaderCircle className="spin" /> Checking your session...</div> : user ? <>
            <div className="auth-popup-head"><div><small>DEVQUEST PORTALS</small><h2>Welcome, {name}</h2><p>Choose the portal you want to open.</p></div></div>
            <div className="auth-account"><div className="auth-user-row"><span>{name.slice(0, 2).toUpperCase()}</span><div><strong>{name}</strong><small>{user.email}</small></div></div><div className="auth-account-portals"><a href="/portal/team"><UsersRound /> Team Portal <ChevronRight /></a><a href="/portal/admin"><ShieldCheck /> Admin Portal <ChevronRight /></a><a href="/portal/services"><BriefcaseBusiness /> Services Portal <ChevronRight /></a><a href="/portal/student"><GraduationCap /> Student Portal <ChevronRight /></a></div>{message && <Status {...message} />}<button className="dq-btn dq-btn-slate" type="button" onClick={signOut} disabled={working}>{working ? <LoaderCircle className="spin" /> : <LogOut />} Sign out</button></div>
          </> : !portalRole ? <>
            <div className="auth-popup-head"><div><small>DEVQUEST PORTALS</small><h2>Choose your portal</h2><p>Select your role to continue to the correct workspace.</p></div></div>
            <div className="auth-role-grid">
              <button type="button" onClick={() => chooseRole("student")}><span><GraduationCap /></span><div><b>Student Portal</b><small>Learning, events, certificates, and opportunities</small></div><ChevronRight /></button>
              <button type="button" onClick={() => chooseRole("team")}><span><UsersRound /></span><div><b>Team Portal</b><small>Tasks, attendance, and progress reports</small></div><ChevronRight /></button>
              <button type="button" onClick={() => chooseRole("services")}><span><BriefcaseBusiness /></span><div><b>Services Portal</b><small>Client projects and delivery — coming soon</small></div><ChevronRight /></button>
              <button type="button" onClick={() => chooseRole("admin")}><span><ShieldCheck /></span><div><b>Admin Portal</b><small>Accounts, assignments, attendance, and reports</small></div><ChevronRight /></button>
            </div>
          </> : <>
            <button className="auth-role-back" type="button" onClick={() => { setPortalRole(null); setMessage(null); }}><ArrowLeft /> Change role</button>
            <div className="auth-popup-head"><div><small>{portalRole === "admin" ? "ADMIN PORTAL" : "TEAM PORTAL"}</small><h2>Sign in to the {portalRole} portal</h2><p>{portalRole === "admin" ? "Use your approved DevQuest administrator account." : "Use your approved DevQuest team account."}</p></div></div>
            <form className="auth-form" onSubmit={submit}>
              <label><span>Email address</span><div><Mail /><input name="email" type="email" required placeholder={portalRole === "admin" ? "admin@devquest.pk" : "team@devquest.pk"} autoComplete="email" /></div></label>
              <label><span>Password</span><div><LockKeyhole /><input name="password" type="password" required minLength={8} placeholder="Use 8 or more characters" autoComplete="current-password" /></div></label>
              {message && <Status {...message} />}
              <button className="auth-submit" type="submit" disabled={working}>{working ? <><LoaderCircle className="spin" /> Please wait</> : <>Open {portalRole === "admin" ? "Admin" : "Team"} Portal <LogIn /></>}</button>
            </form>
            <p className="auth-team-note"><ShieldCheck /> Portal accounts are issued and controlled by DevQuest administrators.</p>
          </>}
        </div>
      </section>
    </>}
    <button className="auth-trigger" type="button" onClick={toggleAccess} aria-expanded={open}>{user ? <span>{name.slice(0, 2).toUpperCase()}</span> : <UserRound />}<strong>{user ? "My account" : "Portal access"}</strong></button>
  </div>;
}

function Status({ type, text }: {type: "error" | "success"; text: string}) { return <div className={`auth-status ${type}`}>{type === "success" ? <CheckCircle2 /> : <AlertCircle />}{text}</div>; }
