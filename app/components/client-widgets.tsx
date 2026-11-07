"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "../lib/supabase-browser";
import { AlertCircle, ArrowLeft, ArrowRight, Award, BookOpen, BriefcaseBusiness, CalendarDays, CheckCircle2, ChevronRight, Eye, EyeOff, GraduationCap, LoaderCircle, LockKeyhole, LogOut, Mail, MapPin, ShieldCheck, UserRound, UsersRound, X } from "lucide-react";
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
  if (state === "sent") return <div className="form-delivery-status success" role="status"><CheckCircle2 /> Thank you. Your message has been received by DevQuest.</div>;
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
  return <form className={`contact-form ${compact ? "contact-form-compact" : ""}`} onSubmit={submit}><p className="eyebrow">START A CONVERSATION</p><h2>{compact ? "Tell us what you are building." : "Let's build something meaningful."}</h2><label><span>Your name</span><input name="name" required placeholder="Full name" autoComplete="name" /></label><label><span>Work email</span><input name="email" type="email" required placeholder="you@company.com" autoComplete="email" /></label><label><span>What can we help with?</span><textarea name="scope" required placeholder="Tell us about your project, partnership, event, or idea." rows={compact ? 3 : 4} /></label><input className="form-honeypot" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" /><div className="privacy-note"><ShieldCheck /> Your details go directly to hello@devquestpk.com.</div><DeliveryMessage state={state} error={error} /><button className="button button-primary button-wide" type="submit" disabled={state === "sending"}>{state === "sending" ? "Sending..." : state === "sent" ? "Message sent" : "Send enquiry"}</button></form>;
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

type PortalRole = "team" | "admin" | "student" | "services";

export function AuthDock() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [portalRole, setPortalRole] = useState<PortalRole | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [accountRole, setAccountRole] = useState<"team" | "admin" | "student" | null>(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState<{type: "error" | "success"; text: string} | null>(null);
  const [studentSignup, setStudentSignup] = useState(false);
  const [confirmationEmail, setConfirmationEmail] = useState("");
  const [confirmationSent, setConfirmationSent] = useState(false);
  const [resendingConfirmation, setResendingConfirmation] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [loginEmail, setLoginEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!resendCooldown) return;
    const timer = window.setTimeout(() => setResendCooldown((seconds) => Math.max(0, seconds - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [resendCooldown]);

  useEffect(() => {
    const syncHash = () => {
      if (["#student-enrollment", "#member-signup", "#member-signin", "#member-access", "#team-login", "#admin-login"].includes(window.location.hash)) {
        const enrollment = ["#student-enrollment", "#member-signup"].includes(window.location.hash);
        const directRole = window.location.hash === "#team-login" ? "team" : window.location.hash === "#admin-login" ? "admin" : window.location.hash === "#member-signin" ? "student" : null;
        setPortalRole(enrollment ? "student" : directRole);
        setStudentSignup(enrollment);
        setMessage(null); setConfirmationSent(false); setConfirmationEmail(""); setResendCooldown(0);
        setOpen(true);
      }
    };
    syncHash();
    window.addEventListener("hashchange", syncHash);
    return () => window.removeEventListener("hashchange", syncHash);
  }, []);
  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) { queueMicrotask(() => setLoading(false)); return; }
    const syncAccount = async (activeUser: User | null) => {
      setUser(activeUser);
      if (!activeUser) { setAccountRole(null); setLoading(false); return; }
      const { data } = await supabase.from("profiles").select("role, is_active").eq("id", activeUser.id).single();
      setAccountRole(data?.is_active !== false && (data?.role === "team" || data?.role === "admin" || data?.role === "student") ? data.role : null);
      setLoading(false);
    };
    supabase.auth.getSession().then(({ data }) => void syncAccount(data.session?.user ?? null));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => { void syncAccount(session?.user ?? null); });
    return () => data.subscription.unsubscribe();
  }, []);
  function close() { setOpen(false); if (window.location.hash.startsWith("#member-") || window.location.hash === "#student-enrollment" || window.location.hash === "#team-login" || window.location.hash === "#admin-login") history.replaceState(null, "", `${window.location.pathname}${window.location.search}`); }
  function chooseRole(role: PortalRole) {
    if (role === "services") { window.location.assign(`/portal/${role}`); return; }
    // Now student is also handled by the auth modal
    setPortalRole(role); setStudentSignup(false); setMessage(null);
  }
  function clearConfirmationState() { setConfirmationSent(false); setConfirmationEmail(""); setResendCooldown(0); }
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
    
    // For student role, if they don't exist yet, we could auto-signup here since it's a public portal,
    // but for now, we'll keep the strict login flow and assume they sign up elsewhere or we handle it in auth.
    // Let's modify to allow signup if student role is selected.
    let loginData, loginError;
    if (portalRole === "student" && studentSignup) {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email, password, options: { emailRedirectTo: `${window.location.origin}/portal/student`, data: { role: "student", full_name: String(data.get("fullName") || "").trim(), phone: String(data.get("phone") || "").trim(), city: String(data.get("city") || "").trim(), university: String(data.get("university") || "").trim(), degree: String(data.get("degree") || "").trim(), semester: String(data.get("semester") || "").trim() } }
      });
      if (signUpError) { setWorking(false); setMessage({ type: "error", text: signUpError.message }); return; }
      if (!signUpData.session) { setWorking(false); setConfirmationEmail(email); setConfirmationSent(true); setResendCooldown(60); setMessage({ type: "success", text: "Your student account has been created. We sent a confirmation email." }); return; }
      loginData = signUpData; loginError = signUpError;
    } else {
      const res = await supabase.auth.signInWithPassword({ email, password });
      loginData = res.data; loginError = res.error;
    }

    if (loginError) { setWorking(false); setMessage({ type: "error", text: loginError.message }); return; }
    
    const { data: profile } = await supabase.from("profiles").select("role, is_active").eq("id", loginData.user?.id).single();
    
    // If student, we might allow if they just signed up and trigger set default to student. 
    // This depends on the Supabase triggers. We'll enforce role match for team/admin.
    if (profile?.is_active === false || profile?.role !== portalRole) {
      await supabase.auth.signOut();
      setWorking(false);
      setMessage({ type: "error", text: profile?.is_active === false ? "This portal account has been disabled." : `This account does not have ${portalRole} portal access.` });
      return;
    }
    
    setWorking(false);
    window.location.assign(portalRole === "admin" ? "/admin" : portalRole === "team" ? "/team" : "/portal/student");
  }

  async function signInWithGoogle() {
    const supabase = getSupabase();
    if (!supabase) return;
    setWorking(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/portal/student`
      }
    });
    if (error) {
      setWorking(false);
      setMessage({ type: "error", text: error.message });
    }
  }

  async function resendConfirmationEmail() {
    const supabase = getSupabase();
    if (!supabase || !confirmationEmail || resendCooldown > 0) return;
    setResendingConfirmation(true); setMessage(null);
    const { error } = await supabase.auth.resend({ type: "signup", email: confirmationEmail, options: { emailRedirectTo: `${window.location.origin}/portal/student` } });
    setResendingConfirmation(false);
    if (error) { setMessage({ type: "error", text: error.message }); return; }
    setResendCooldown(60);
    setMessage({ type: "success", text: "A new confirmation email has been sent." });
  }

  async function resetStudentPassword() {
    const supabase = getSupabase();
    if (!supabase) return;
    if (!loginEmail.trim()) { setMessage({ type: "error", text: "Enter your email address first, then select password recovery." }); return; }
    setWorking(true); setMessage(null);
    const recoveryPath = portalRole === "admin" ? "/admin" : portalRole === "team" ? "/team" : "/portal/student";
    const { error } = await supabase.auth.resetPasswordForEmail(loginEmail.trim(), { redirectTo: `${window.location.origin}${recoveryPath}` });
    setWorking(false);
    setMessage(error ? { type: "error", text: error.message } : { type: "success", text: "Password recovery instructions have been sent to your email." });
  }

  async function signOut() { const supabase = getSupabase(); if (!supabase) return; setWorking(true); const { error } = await supabase.auth.signOut({ scope: "global" }); if (error) { setWorking(false); setMessage({ type: "error", text: error.message }); return; } window.location.replace("/#member-signin"); }
  const name = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Member";
  const isPortalWorkspace = pathname === "/admin" || pathname === "/team" || pathname.startsWith("/portal/");
  if (isPortalWorkspace && user) return null;

  return <div className={`auth-dock ${open ? "is-open" : ""}`}>
    {open && <>
      <button className="auth-backdrop" onClick={close} aria-label="Close account dialog" />
      <section className={`auth-popup auth-${portalRole ? "signin" : "role"} ${portalRole === "student" && studentSignup ? "auth-student-signup" : ""} ${(portalRole === "student" || portalRole === "admin" || portalRole === "team") && !studentSignup && !user ? `auth-student-login ${portalRole === "admin" ? "auth-admin-login" : portalRole === "team" ? "auth-team-login" : ""}` : ""}`} role="dialog" aria-modal="true" aria-label="DevQuest portal access">
        <button className="auth-close" type="button" onClick={close} aria-label="Close portal access"><X /></button>
        {portalRole === "student" && !studentSignup && !user && !loading && <aside className="student-login-showcase" aria-label="Student Portal benefits">
          <div className="student-login-brand"><Image src="/figma/auth-logo.png" alt="DevQuest PK" width={158} height={64} /><span>Student Portal</span></div>
          <div className="student-login-copy"><p>WELCOME TO</p><h2>Welcome to<br /><strong>Student Portal</strong></h2><span>Access your courses, sessions, certificates, and track your learning progress.</span></div>
          <div className="student-login-benefits"><article><i><BookOpen /></i><div><b>My Courses</b><small>Access enrolled courses and learning material.</small></div></article><article><i><CalendarDays /></i><div><b>My Sessions</b><small>Join live sessions, webinars, and events.</small></div></article><article><i><Award /></i><div><b>My Certificates</b><small>View and download your achievements.</small></div></article></div>
          <div className="student-login-illustration" aria-hidden="true"><span><GraduationCap /></span><i /><b>DQ</b><em><BookOpen /></em></div>
        </aside>}
        {portalRole === "admin" && !user && !loading && <aside className="student-login-showcase admin-login-showcase" aria-label="Admin Portal benefits">
          <div className="student-login-brand"><Image src="/figma/auth-logo.png" alt="DevQuest PK" width={158} height={64} /><span>Admin Portal</span></div>
          <div className="student-login-copy"><p>DEVQUEST OPERATIONS</p><h2>Manage, Track &amp;<br /><strong>Grow Your Programs</strong></h2><span>A centralized portal for administrators to manage students, events, certificates, and more.</span></div>
          <div className="student-login-benefits"><article><i><UsersRound /></i><div><b>Student Management</b><small>Keep student records and progress in one place.</small></div></article><article><i><CalendarDays /></i><div><b>Event &amp; Session Control</b><small>Create, schedule, and track sessions and webinars.</small></div></article><article><i><Award /></i><div><b>Certificates &amp; Reports</b><small>Verify, issue certificates, and generate detailed reports.</small></div></article></div>
          <div className="student-login-illustration admin-login-illustration" aria-hidden="true"><span><ShieldCheck /></span><i /><b>DQ</b><em><Award /></em></div>
        </aside>}
        {portalRole === "team" && !user && !loading && <aside className="student-login-showcase team-login-showcase" aria-label="Team Portal benefits">
          <div className="student-login-brand"><Image src="/figma/auth-logo.png" alt="DevQuest PK" width={158} height={64} /><span>Team Portal</span></div>
          <div className="student-login-copy"><p>DEVQUEST COLLABORATION</p><h2>Welcome to<br /><strong>Team Portal</strong></h2><span>A dedicated workspace for DevQuest PK team members to collaborate, manage events, and run operations together.</span></div>
          <div className="student-login-benefits"><article><i><UsersRound /></i><div><b>Team Collaboration</b><small>Work together, assign tasks, and stay aligned.</small></div></article><article><i><CalendarDays /></i><div><b>Event Operations</b><small>Manage sessions, attendees, and deliverables.</small></div></article><article><i><ShieldCheck /></i><div><b>Role-based Access</b><small>Secure access with team-specific permissions.</small></div></article></div>
          <div className="team-login-collage" aria-hidden="true"><Image src="/team/humair-tariq.webp" alt="" width={180} height={220} /><Image src="/team/mohsin-nawaz.jpeg" alt="" width={180} height={220} /><Image src="/team/anza-tamveel.jpeg" alt="" width={180} height={220} /><span>DevQuest PK</span></div>
        </aside>}
        <div className="auth-main">
          <div className="auth-logo"><Image src="/figma/auth-logo.png" alt="DevQuest" width={126} height={56} /></div>
          {loading ? <div className="auth-loading"><LoaderCircle className="spin" /> Checking your session...</div> : user ? <>
            <div className="auth-popup-head"><div><small>{accountRole === "admin" ? "ADMIN ACCOUNT" : accountRole === "team" ? "TEAM ACCOUNT" : "STUDENT ACCOUNT"}</small><h2>Welcome, {name}</h2><p>Your account opens only its assigned DevQuest portal.</p></div></div>
            <div className="auth-account">
              <div className="auth-user-row"><span>{name.slice(0, 2).toUpperCase()}</span><div><strong>{name}</strong><small>{user.email}</small></div></div>
              <div className="auth-account-portals auth-account-portals-single">
                {accountRole === "admin" && <a href="/admin"><ShieldCheck /> Admin Portal <ChevronRight /></a>}
                {accountRole === "team" && <a href="/team"><UsersRound /> My Team Portal <ChevronRight /></a>}
                {accountRole === "student" && <a href="/portal/student"><GraduationCap /> My Student Portal <ChevronRight /></a>}
                {!accountRole && <p className="auth-account-warning">This account has no active portal role. Contact the DevQuest administrator.</p>}
              </div>
              {message && <Status {...message} />}
              <button className="dq-btn dq-btn-slate" type="button" onClick={signOut} disabled={working}>{working ? <LoaderCircle className="spin" /> : <LogOut />} Sign out</button>
            </div>
          </> : !portalRole ? <>
            <div className="auth-popup-head"><div><small>DEVQUEST PORTALS</small><h2>Choose your portal</h2><p>Select your role to continue to the correct workspace.</p></div></div>
            <div className="auth-role-grid">
              <button type="button" onClick={() => chooseRole("student")}><span><GraduationCap /></span><div><b>Student</b><small>Learning, events, certificates, and opportunities</small></div><ChevronRight /></button>
              <button type="button" onClick={() => chooseRole("services")}><span><BriefcaseBusiness /></span><div><b>Services</b><small>Client projects and delivery — coming soon</small></div><ChevronRight /></button>
            </div>
          </> : <>
            <button className="auth-role-back" type="button" onClick={() => { setPortalRole(null); setStudentSignup(false); setMessage(null); clearConfirmationState(); }}><ArrowLeft /> Change role</button>
            <div className="auth-popup-head"><div><small>{portalRole === "admin" ? "ADMIN PORTAL" : portalRole === "team" ? "TEAM PORTAL" : "STUDENT PORTAL"}</small><h2>{portalRole === "student" && studentSignup ? "Create your student account" : portalRole === "admin" ? "Sign in to your account" : portalRole === "team" ? "Sign in to your team account" : "Sign in to your student account"}</h2><p>{portalRole === "admin" ? "Use your approved DevQuest administrator account." : portalRole === "team" ? "Access the DevQuest PK team workspace." : studentSignup ? "Register once to access learning, events, certificates, and support." : "Access your learning and event dashboard."}</p></div></div>
            <form className={`auth-form ${portalRole === "student" && studentSignup ? "auth-enrollment-form" : ""}`} onSubmit={submit}>
              {portalRole === "student" && (
                <div className="auth-mode-row">
                  <button type="button" className="auth-mode-switch" onClick={() => { setStudentSignup((value) => !value); setMessage(null); clearConfirmationState(); }}>{studentSignup ? "Already have an account? Sign in" : "New student? Create an account"}</button>
                </div>
              )}
              {portalRole === "student" && studentSignup && <><label><span>Full name</span><div><UserRound /><input name="fullName" required autoComplete="name" placeholder="Your full name" /></div></label><label><span>Phone number</span><div><UserRound /><input name="phone" required autoComplete="tel" placeholder="+92 300 0000000" /></div></label><label><span>City</span><div><MapPin /><input name="city" autoComplete="address-level2" placeholder="Your city" /></div></label><label><span>Semester</span><div><GraduationCap /><input name="semester" placeholder="e.g. 6th semester" /></div></label><label><span>University / institute</span><div><GraduationCap /><input name="university" required autoComplete="organization" placeholder="Your university or institute" /></div></label><label><span>Degree / program</span><div><GraduationCap /><input name="degree" required placeholder="e.g. BS Computer Science" /></div></label></>}
              <label><span>Email address</span><div><Mail /><input name="email" type="email" required value={loginEmail} onChange={(event) => setLoginEmail(event.target.value)} placeholder={portalRole === "admin" ? "admin@devquest.pk" : portalRole === "team" ? "team@devquest.pk" : "your@email.com"} autoComplete="email" /></div></label>
              <label><span>Password</span><div><LockKeyhole /><input name="password" type={showPassword ? "text" : "password"} required minLength={8} placeholder="Enter your password" autoComplete={studentSignup ? "new-password" : "current-password"} />{!studentSignup && <button className="auth-password-toggle" type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff /> : <Eye />}</button>}</div></label>
              {(portalRole === "student" || portalRole === "admin" || portalRole === "team") && !studentSignup && <div className="student-login-options"><label><input type="checkbox" defaultChecked /> <span>Remember me</span></label><button type="button" onClick={() => void resetStudentPassword()} disabled={working}>Forgot your password?</button></div>}
              {message && <Status {...message} />}
              {portalRole === "student" && studentSignup && confirmationSent && <div className="auth-confirmation-help" role="status"><p>Didn&apos;t receive the email? Check your <strong>Spam</strong> or <strong>Junk</strong> folder.</p><button type="button" onClick={() => void resendConfirmationEmail()} disabled={resendingConfirmation || resendCooldown > 0}>{resendingConfirmation ? <><LoaderCircle className="spin" /> Sending…</> : resendCooldown > 0 ? `Resend available in ${resendCooldown}s` : "Resend confirmation email"}</button></div>}
              <button className="auth-submit" type="submit" disabled={working || (portalRole === "student" && studentSignup && confirmationSent)}>{working ? <><LoaderCircle className="spin" /> Please wait</> : studentSignup && confirmationSent ? <>Confirmation email sent <CheckCircle2 /></> : studentSignup ? <>Create student account <ChevronRight /></> : portalRole === "student" ? <>Sign In to Student Portal <ArrowRight /></> : portalRole === "admin" ? <>Sign In to Admin Portal <ArrowRight /></> : <>Sign In to Team Portal <ArrowRight /></>}</button>
            </form>
            
            {portalRole === "student" && !studentSignup && (
              <div className="student-login-google">
                <div className="student-login-divider">
                  <div></div>
                  <span>OR</span>
                  <div></div>
                </div>
                <button 
                  className="student-google-button"
                  type="button" 
                  onClick={signInWithGoogle}
                  disabled={working}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                  Continue with Google
                </button>
                <p><ShieldCheck /> Your account is securely managed by DevQuest PK.</p>
              </div>
            )}
            {portalRole !== "student" && <p className="auth-team-note"><ShieldCheck /> Portal accounts are issued and controlled by DevQuest administrators.</p>}
          </>}

        </div>
      </section>
    </>}
    <button className="auth-trigger" type="button" onClick={toggleAccess} aria-expanded={open}>{user ? <span>{name.slice(0, 2).toUpperCase()}</span> : <UserRound />}<strong>{user ? "My account" : "Portal access"}</strong></button>
  </div>;
}

function Status({ type, text }: {type: "error" | "success"; text: string}) { return <div className={`auth-status ${type}`}>{type === "success" ? <CheckCircle2 /> : <AlertCircle />}{text}</div>; }
