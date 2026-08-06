"use client";

import { FormEvent, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { AlertCircle, CheckCircle2, LoaderCircle, LockKeyhole, LogIn, LogOut, Mail, UserPlus, UserRound, X } from "lucide-react";
import { getSupabaseBrowserClient } from "../lib/supabase-browser";

type Mode = "signin" | "signup";

export function AuthDock() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("signin");
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => data.subscription.unsubscribe();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setMessage({ type: "error", text: "Member access is awaiting the DevQuest Supabase keys." });
      return;
    }

    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") || "").trim();
    const password = String(data.get("password") || "");
    const fullName = String(data.get("fullName") || "").trim();
    setWorking(true);

    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setWorking(false);
      if (error) setMessage({ type: "error", text: error.message });
      else setMessage({ type: "success", text: "Welcome back to DevQuest." });
      return;
    }

    const { data: signUpData, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    setWorking(false);
    if (error) setMessage({ type: "error", text: error.message });
    else if (!signUpData.session) setMessage({ type: "success", text: "Check your email to confirm your DevQuest account." });
    else setMessage({ type: "success", text: "Your DevQuest account is ready." });
  }

  async function handleSignOut() {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    setWorking(true);
    const { error } = await supabase.auth.signOut();
    setWorking(false);
    if (error) setMessage({ type: "error", text: error.message });
    else {
      setUser(null);
      setMessage({ type: "success", text: "You are signed out." });
    }
  }

  const displayName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Member";

  return (
    <div className={`auth-dock ${open ? "is-open" : ""}`}>
      {open && (
        <section className="auth-popup" role="dialog" aria-modal="false" aria-label="DevQuest member access">
          <button className="auth-close" type="button" onClick={() => setOpen(false)} aria-label="Close member access"><X /></button>
          <div className="auth-popup-head">
            <span><UserRound /></span>
            <div><small>DEVQUEST ACCOUNT</small><h2>{user ? `Welcome, ${displayName}` : mode === "signin" ? "Welcome back." : "Join the quest."}</h2></div>
          </div>

          {loading ? (
            <div className="auth-loading"><LoaderCircle /> Checking your session…</div>
          ) : user ? (
            <div className="auth-account">
              <div className="auth-user-row"><span>{displayName.slice(0, 2).toUpperCase()}</span><div><strong>{displayName}</strong><small>{user.email}</small></div></div>
              <p>Your DevQuest session is active on this device.</p>
              {message && <StatusMessage {...message} />}
              <button className="button auth-signout" type="button" onClick={handleSignOut} disabled={working}>{working ? <LoaderCircle className="spin" /> : <LogOut />} Sign out</button>
            </div>
          ) : (
            <>
              <div className="auth-tabs" role="tablist" aria-label="Account action">
                <button type="button" className={mode === "signin" ? "active" : ""} onClick={() => { setMode("signin"); setMessage(null); }}><LogIn /> Sign in</button>
                <button type="button" className={mode === "signup" ? "active" : ""} onClick={() => { setMode("signup"); setMessage(null); }}><UserPlus /> Create account</button>
              </div>
              <form className="auth-form" onSubmit={handleSubmit}>
                {mode === "signup" && <label><span>Full name</span><div><UserRound /><input name="fullName" required placeholder="Your name" autoComplete="name" /></div></label>}
                <label><span>Email address</span><div><Mail /><input name="email" type="email" required placeholder="you@example.com" autoComplete="email" /></div></label>
                <label><span>Password</span><div><LockKeyhole /><input name="password" type="password" required minLength={8} placeholder="Minimum 8 characters" autoComplete={mode === "signin" ? "current-password" : "new-password"} /></div></label>
                {message && <StatusMessage {...message} />}
                <button className="button button-primary button-wide" type="submit" disabled={working}>{working ? <><LoaderCircle className="spin" /> Please wait</> : mode === "signin" ? <>Sign in <LogIn /></> : <>Create DevQuest account <UserPlus /></>}</button>
              </form>
              <p className="auth-note">Authentication is managed by DevQuest through its own Supabase project. No ChatGPT login is used.</p>
            </>
          )}
        </section>
      )}
      <button className="auth-trigger" type="button" onClick={() => setOpen(value => !value)} aria-expanded={open} aria-label={open ? "Close member access" : "Open member access"}>
        {user ? <span>{displayName.slice(0, 2).toUpperCase()}</span> : <UserRound />}
        <strong>{user ? "My account" : "Member access"}</strong>
      </button>
    </div>
  );
}

function StatusMessage({ type, text }: { type: "error" | "success"; text: string }) {
  return <div className={`auth-status ${type}`}>{type === "success" ? <CheckCircle2 /> : <AlertCircle />}{text}</div>;
}
