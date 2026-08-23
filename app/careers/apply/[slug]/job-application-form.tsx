"use client";

import { FormEvent, useState } from "react";
import { AlertCircle, FileText, Send, ShieldCheck, UploadCloud } from "lucide-react";
import { ApplicationSubmissionSuccess } from "../../../components/application-submission-success";
import { deliverWebsiteForm } from "../../../lib/form-delivery";

const maxCvBytes = 5 * 1024 * 1024;
const allowedCvExtensions = ["pdf", "doc", "docx"];

export function JobApplicationForm({ position }: { position: string }) {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");
  const [cvName, setCvName] = useState("");
  const [tracking, setTracking] = useState<{ code: string; url: string } | null>(null);
  const [emailWarning, setEmailWarning] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setStatus("sending");
    setError("");
    setTracking(null);
    setEmailWarning("");

    try {
      const cv = data.get("cv");
      const extension = cv instanceof File ? cv.name.split(".").pop()?.toLowerCase() || "" : "";
      if (!(cv instanceof File) || cv.size === 0) throw new Error("Please attach your CV.");
      if (!allowedCvExtensions.includes(extension)) throw new Error("Please attach a PDF, DOC, or DOCX file.");
      if (cv.size > maxCvBytes) throw new Error("The CV must be 5 MB or smaller.");

      const result = await deliverWebsiteForm("career", {
        position,
        fullName: String(data.get("fullName") || ""),
        email: String(data.get("email") || ""),
        whatsapp: String(data.get("phone") || ""),
        city: String(data.get("city") || ""),
        universityOrInstitute: String(data.get("university") || ""),
        degreeOrProgram: String(data.get("degree") || ""),
        educationStatus: String(data.get("educationStatus") || ""),
        linkedIn: String(data.get("linkedin") || "Not provided"),
        portfolioOrGitHub: String(data.get("portfolio") || "Not provided"),
        technicalSkills: String(data.get("skills") || ""),
        relevantExperience: String(data.get("experience") || "Not provided"),
        weeklyAvailability: String(data.get("availability") || ""),
        introduction: String(data.get("introduction") || ""),
      }, String(data.get("website") || ""), cv);

      form.reset();
      setCvName("");
      setTracking(result.tracking || null);
      setEmailWarning(result.emailWarning || "");
      setStatus("sent");
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "We could not send your application. Please try again.");
      setStatus("error");
    }
  }

  return (
    <form className="ambassador-form job-application-form" onSubmit={submit}>
      <div className="ambassador-form-head">
        <p className="eyebrow">CAREER APPLICATION</p>
        <h2>Apply for this role.</h2>
        <div className="job-application-role"><small>SELECTED VACANCY</small><strong>{position}</strong></div>
      </div>

      <fieldset>
        <legend><span>01</span> Personal details</legend>
        <div className="ambassador-fields">
          <label>Full name<input name="fullName" required autoComplete="name" placeholder="Your full name" /></label>
          <label>Email address<input name="email" type="email" required autoComplete="email" placeholder="you@example.com" /></label>
          <label>WhatsApp number<input name="phone" type="tel" required autoComplete="tel" placeholder="+92 300 0000000" /></label>
          <label>City<input name="city" required autoComplete="address-level2" placeholder="Your city" /></label>
        </div>
      </fieldset>

      <fieldset>
        <legend><span>02</span> Education and profiles</legend>
        <div className="ambassador-fields">
          <label>University or institute<input name="university" required autoComplete="organization" placeholder="University name" /></label>
          <label>Degree or program<input name="degree" required placeholder="e.g. BS Computer Science" /></label>
          <label>Education status<select name="educationStatus" required defaultValue=""><option value="" disabled>Select your status</option><option>Currently studying</option><option>Recent graduate</option><option>Graduate</option><option>Self-taught / other</option></select></label>
          <label>LinkedIn profile <small>Optional</small><input name="linkedin" type="url" placeholder="https://linkedin.com/in/..." /></label>
          <label>Portfolio or GitHub <small>Optional</small><input name="portfolio" type="url" placeholder="https://github.com/..." /></label>
        </div>
      </fieldset>

      <fieldset>
        <legend><span>03</span> Experience and fit</legend>
        <div className="ambassador-fields single-column">
          <label>Relevant technical or professional skills<textarea name="skills" required minLength={20} rows={3} placeholder="List the tools, technologies, and strengths relevant to this role." /></label>
          <label>Projects, internships, or work experience <small>Optional</small><textarea name="experience" rows={4} placeholder="Describe relevant projects, internships, freelance work, or community experience." /></label>
          <label>Weekly availability<select name="availability" required defaultValue=""><option value="" disabled>Select availability</option><option>5–10 hours per week</option><option>11–20 hours per week</option><option>21–30 hours per week</option><option>Full-time availability</option></select></label>
          <label>Why are you a good fit for this vacancy?<textarea name="introduction" required minLength={80} rows={5} placeholder="Introduce yourself and explain why you want to join DevQuest in this role." /></label>
        </div>
      </fieldset>

      <fieldset>
        <legend><span>04</span> CV / resume</legend>
        <label className={`ambassador-upload${cvName ? " has-file" : ""}`}>
          <input
            name="cv"
            type="file"
            required
            accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            aria-describedby="career-cv-help"
            onChange={(event) => {
              setCvName(event.currentTarget.files?.[0]?.name || "");
              setStatus("idle");
              setError("");
            }}
          />
          <span className="ambassador-upload-icon">{cvName ? <FileText /> : <UploadCloud />}</span>
          <span className="ambassador-upload-copy">
            <strong>{cvName || "Choose your CV or drop it here"}</strong>
            <small id="career-cv-help">PDF, DOC, or DOCX · Maximum 5 MB</small>
          </span>
        </label>
      </fieldset>

      <input className="form-honeypot" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
      <label className="ambassador-consent"><input type="checkbox" required /> <span>I confirm that this information is accurate and I agree that DevQuest may contact me about this vacancy.</span></label>
      {status === "sent" ? <ApplicationSubmissionSuccess tracking={tracking} emailWarning={emailWarning} /> : null}
      {status === "error" ? <div className="ambassador-success ambassador-error" role="alert"><AlertCircle /> {error}</div> : null}
      <button className="ambassador-submit" type="submit" disabled={status === "sending"}>{status === "sending" ? "Sending application..." : status === "sent" ? "Application sent" : <>Submit application <Send /></>}</button>
      <p className="ambassador-privacy"><ShieldCheck /> Your application and CV go directly to the official DevQuest workspace.</p>
    </form>
  );
}
