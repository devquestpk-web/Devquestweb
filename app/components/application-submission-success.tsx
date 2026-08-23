import { ArrowUpRight, CheckCircle2 } from "lucide-react";

export function ApplicationSubmissionSuccess({ tracking, emailWarning }: { tracking: { code: string; url: string } | null; emailWarning?: string }) {
  return (
    <div className="ambassador-success application-submitted" role="status">
      <CheckCircle2 />
      <div>
        <strong>Application submitted successfully</strong>
        <p>Your application and documents were sent to the DevQuest team.</p>
        {tracking && (
          <div className="application-submitted-tracking">
            <small>YOUR TRACKING ID</small>
            <code>{tracking.code}</code>
            <a href={tracking.url}>Open application tracker <ArrowUpRight /></a>
            <span>Save this ID. You can use it later on the Application Status page.</span>
          </div>
        )}
        {emailWarning && <p className="application-email-warning" role="note">{emailWarning}</p>}
      </div>
    </div>
  );
}
