"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AlertCircle, ArrowLeft, BriefcaseBusiness, Check, CheckCircle2, Clock3, LoaderCircle, RefreshCw, Search, ShieldCheck, UserRound, X, XCircle } from "lucide-react";

type HistoryEntry = { status: string; label: string; note: string | null; createdAt: string };
type Application = {
  trackingCode: string;
  applicationType: "career" | "ambassador";
  fullName: string;
  position: string | null;
  status: string;
  statusLabel: string;
  publicNote: string | null;
  submittedAt: string;
  updatedAt: string;
  history: HistoryEntry[];
};
type Lookup = { token?: string; id?: string };

const stages = ["Submitted", "Under review", "Shortlisted", "Interview", "Decision"];
const stageIndex: Record<string, number> = { submitted: 0, under_review: 1, shortlisted: 2, interview: 3, accepted: 4 };
const trackingIdPattern = /^DQ-(CAR|AMB)-\d{4}-[A-F0-9]{8,12}$/;
const formatDate = (value: string) => new Intl.DateTimeFormat("en-PK", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(value));

export function ApplicationTracker() {
  const [application, setApplication] = useState<Application | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lookupId, setLookupId] = useState("");
  const lookupRef = useRef<Lookup>({});

  const loadStatus = useCallback(async (lookup: Lookup, manual = false) => {
    if (!lookup.token && !lookup.id) { setLoading(false); return; }
    if (manual) setRefreshing(true);
    try {
      const params = new URLSearchParams();
      if (lookup.token) params.set("token", lookup.token);
      else if (lookup.id) params.set("id", lookup.id);
      const response = await fetch(`/api/applications/status?${params}`, { cache: "no-store" });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Application status is unavailable.");
      setApplication(result.application);
      setError("");
    } catch (lookupError) {
      setError(lookupError instanceof Error ? lookupError.message : "Application status is unavailable.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const token = searchParams.get("token")?.trim() || "";
    const id = searchParams.get("id")?.trim().toUpperCase() || "";
    const lookup = token ? { token } : id ? { id } : {};
    lookupRef.current = lookup;
    queueMicrotask(() => {
      setLookupId(id);
      void loadStatus(lookup);
    });
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible" && (lookupRef.current.token || lookupRef.current.id)) void loadStatus(lookupRef.current);
    }, 15_000);
    return () => window.clearInterval(interval);
  }, [loadStatus]);

  function findApplication(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const id = String(form.get("trackingId") || "").trim().toUpperCase();
    if (!trackingIdPattern.test(id)) {
      setError("Enter a valid tracking ID, for example DQ-CAR-2026-A1B2C3D4.");
      return;
    }
    const lookup = { id };
    lookupRef.current = lookup;
    setLookupId(id);
    window.history.replaceState(null, "", `/application-status?id=${encodeURIComponent(id)}`);
    setApplication(null);
    setError("");
    setLoading(true);
    void loadStatus(lookup);
  }

  if (loading) return <TrackerState icon={<LoaderCircle className="spin" />} title="Opening your application" copy="Checking your DevQuest application status..." />;
  if (!application) return <ApplicationLookup error={error} initialId={lookupId} onSubmit={findApplication} />;

  const isPositive = application.status === "accepted";
  const isRejected = application.status === "rejected";
  const lastReachedStatus = [...application.history].reverse().find((entry) => entry.status !== "rejected")?.status || "submitted";
  const rejectionStage = stageIndex[lastReachedStatus] ?? 0;
  const currentStage = isRejected ? rejectionStage : stageIndex[application.status] ?? 0;

  return (
    <div className="application-tracker-page">
      <div className="application-tracker-orb tracker-orb-one" />
      <div className="application-tracker-orb tracker-orb-two" />
      <section className="application-tracker-shell">
        <Link className="application-tracker-back" href="/careers"><ArrowLeft /> Back to careers</Link>
        <header className="application-tracker-head">
          <div><p>APPLICATION TRACKER</p><h1>Hello, {application.fullName.split(" ")[0]}.</h1><span>Your application status refreshes automatically every 15 seconds.</span></div>
          <button type="button" onClick={() => void loadStatus(lookupRef.current, true)} disabled={refreshing}>{refreshing ? <LoaderCircle className="spin" /> : <RefreshCw />} Refresh</button>
        </header>

        <div className="application-tracker-summary">
          <article><span><ShieldCheck /></span><div><small>TRACKING ID</small><strong>{application.trackingCode}</strong></div></article>
          <article><span>{application.applicationType === "career" ? <BriefcaseBusiness /> : <UserRound />}</span><div><small>APPLICATION</small><strong>{application.position || "Campus Ambassador"}</strong></div></article>
          <article className={`application-current-status${isPositive ? " accepted" : ""}${isRejected ? " rejected" : ""}`}><span>{isPositive ? <CheckCircle2 /> : isRejected ? <XCircle /> : <Clock3 />}</span><div><small>CURRENT STATUS</small><strong>{application.statusLabel}</strong></div></article>
        </div>

        <section className="application-progress-card">
          <div className="application-progress-head"><div><p>APPLICATION JOURNEY</p><h2>{application.statusLabel}</h2></div><small>Updated {formatDate(application.updatedAt)}</small></div>
          <div className="application-stage-track">
            {stages.map((stage, index) => {
              const failed = isRejected && index === rejectionStage;
              const completed = isRejected ? index < rejectionStage : index < currentStage || isPositive;
              const active = completed || (!isRejected && index === currentStage);
              return (
                <div className={`application-stage${active ? " active" : ""}${index === currentStage ? " current" : ""}${failed ? " failed" : ""}`} key={stage}>
                  <span>{failed ? <X /> : completed ? <Check /> : index + 1}</span>
                  <b>{failed ? `${stage} - Not selected` : index === 4 && isPositive ? "Accepted" : stage}</b>
                </div>
              );
            })}
          </div>
          {application.publicNote && <div className={`application-public-note${isRejected ? " rejected" : ""}`}><strong>Update from DevQuest</strong><p>{application.publicNote}</p></div>}
        </section>

        <section className="application-history-card">
          <div className="application-progress-head"><div><p>STATUS HISTORY</p><h2>Your updates</h2></div></div>
          <div className="application-history-list">{application.history.map((entry, index) => <article className={entry.status === "rejected" ? "rejected" : ""} key={`${entry.createdAt}-${index}`}><span>{entry.status === "rejected" ? <X /> : <Check />}</span><div><strong>{entry.label}</strong><small>{formatDate(entry.createdAt)}</small>{entry.note && <p>{entry.note}</p>}</div></article>)}</div>
        </section>

        <p className="application-tracker-security"><ShieldCheck /> Keep your tracking ID private. Anyone with it can view this application status.</p>
      </section>
    </div>
  );
}

function ApplicationLookup({ error, initialId, onSubmit }: { error: string; initialId: string; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  return (
    <div className="application-tracker-page">
      <section className="application-tracker-lookup">
        <Link className="application-tracker-back" href="/careers"><ArrowLeft /> Back to careers</Link>
        <span className="application-lookup-icon"><Search /></span>
        <p>DEVQUEST APPLICATION TRACKER</p>
        <h1>Check your application status.</h1>
        <div>Enter the tracking ID you received after submitting your application.</div>
        <form onSubmit={onSubmit}>
          <label htmlFor="trackingId">Tracking ID</label>
          <div><input id="trackingId" name="trackingId" defaultValue={initialId} placeholder="DQ-CAR-2026-A1B2C3D4" autoComplete="off" spellCheck={false} required /><button type="submit"><Search /> Check status</button></div>
          {error && <small role="alert"><AlertCircle /> {error}</small>}
        </form>
        <p className="application-lookup-security"><ShieldCheck /> Your tracking ID is included in your submission confirmation and email.</p>
      </section>
    </div>
  );
}

function TrackerState({ icon, title, copy }: { icon: React.ReactNode; title: string; copy: string }) {
  return <div className="application-tracker-page"><section className="application-tracker-state"><span>{icon}</span><p>DEVQUEST APPLICATION TRACKER</p><h1>{title}</h1><div>{copy}</div></section></div>;
}
