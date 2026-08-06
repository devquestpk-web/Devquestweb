"use client";

import { FormEvent, useState } from "react";
import { CheckCircle2, Send, ShieldCheck } from "lucide-react";

export function AmbassadorForm() {
  const [submitted, setSubmitted] = useState(false);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const application = [
      "DevQuest Campus Ambassador Application",
      "",
      `Name: ${data.get("fullName")}`,
      `Email: ${data.get("email")}`,
      `WhatsApp: ${data.get("phone")}`,
      `City: ${data.get("city")}`,
      `University: ${data.get("university")}`,
      `Degree / program: ${data.get("degree")}`,
      `Current semester: ${data.get("semester")}`,
      `LinkedIn: ${data.get("linkedin") || "Not provided"}`,
      `Weekly availability: ${data.get("availability")}`,
      `Relevant experience: ${data.get("experience") || "Not provided"}`,
      "",
      "Why I want to become an ambassador:",
      String(data.get("motivation") || ""),
      "",
      "An initiative I would bring to my campus:",
      String(data.get("initiative") || ""),
    ].join("\n");
    const url = `https://wa.me/923704489589?text=${encodeURIComponent(application)}`;
    setSubmitted(true);
    const whatsapp = window.open(url, "_blank", "noopener,noreferrer");
    if (!whatsapp) window.location.href = url;
  }

  return (
    <form className="ambassador-form" onSubmit={submit}>
      <div className="ambassador-form-head">
        <p className="eyebrow">CAMPUS AMBASSADOR APPLICATION</p>
        <h2>Tell us about yourself.</h2>
        <p>Complete the form carefully. Your application will be prepared and sent to the official DevQuest WhatsApp account.</p>
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
        <legend><span>02</span> University information</legend>
        <div className="ambassador-fields">
          <label>University or institute<input name="university" required autoComplete="organization" placeholder="University name" /></label>
          <label>Degree or program<input name="degree" required placeholder="e.g. BS Computer Science" /></label>
          <label>Current semester<select name="semester" required defaultValue=""><option value="" disabled>Select semester</option><option>1st semester</option><option>2nd semester</option><option>3rd semester</option><option>4th semester</option><option>5th semester</option><option>6th semester</option><option>7th semester</option><option>8th semester</option><option>Graduate / other</option></select></label>
          <label>LinkedIn profile <small>Optional</small><input name="linkedin" type="url" placeholder="https://linkedin.com/in/..." /></label>
        </div>
      </fieldset>

      <fieldset>
        <legend><span>03</span> Your contribution</legend>
        <div className="ambassador-fields single-column">
          <label>Weekly availability<select name="availability" required defaultValue=""><option value="" disabled>Select availability</option><option>2–4 hours per week</option><option>5–7 hours per week</option><option>8–10 hours per week</option><option>More than 10 hours per week</option></select></label>
          <label>Relevant leadership, event, or community experience <small>Optional</small><textarea name="experience" rows={3} placeholder="Tell us about societies, events, volunteering, projects, or leadership roles." /></label>
          <label>Why do you want to become a DevQuest Campus Ambassador?<textarea name="motivation" required minLength={60} rows={5} placeholder="Share your motivation and what you hope to achieve." /></label>
          <label>What initiative would you bring to your campus?<textarea name="initiative" required minLength={40} rows={4} placeholder="Describe one event, workshop, campaign, or community idea." /></label>
        </div>
      </fieldset>

      <label className="ambassador-consent"><input type="checkbox" required /> <span>I confirm that the information is accurate and I agree that DevQuest may contact me about this application.</span></label>
      {submitted ? <div className="ambassador-success" role="status"><CheckCircle2 /> Your application is ready. Please send the prepared message in WhatsApp to complete your registration.</div> : null}
      <button className="ambassador-submit" type="submit">Submit via official WhatsApp <Send /></button>
      <p className="ambassador-privacy"><ShieldCheck /> Your application goes directly to DevQuest at +92 370 4489589.</p>
    </form>
  );
}
