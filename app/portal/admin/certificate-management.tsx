"use client";

import { type CSSProperties, type FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Award, Check, LoaderCircle, Search, Upload } from "lucide-react";
import { getSupabaseBrowserClient } from "../../lib/supabase-browser";
import { searchStudents } from "../../lib/student-search";
import { CertificateVerifier } from "./certificate-verifier";

type Item = { id: string; title?: string; full_name?: string; student_id?: string; email?: string; phone?: string };
type Template = { id: string; name: string; scope_type: string; is_active: boolean };
type CertificateData = { templates: Template[]; courses: Item[]; webinars: Item[]; sessions: Item[]; students: Item[] };

export function CertificateManagement() {
  const supabase = getSupabaseBrowserClient();
  const [data, setData] = useState<CertificateData>({ templates: [], courses: [], webinars: [], sessions: [], students: [] });
  const [message, setMessage] = useState(""); const [saving, setSaving] = useState(false);
  const [itemType, setItemType] = useState<"COURSE" | "WEBINAR">("COURSE"); const [templateScope, setTemplateScope] = useState("DEFAULT");
  const [studentSearch, setStudentSearch] = useState(""); const [selectedStudentId, setSelectedStudentId] = useState("");
  const [designStyle, setDesignStyle] = useState("midnight"); const [primaryColor, setPrimaryColor] = useState("#071a38"); const [accentColor, setAccentColor] = useState("#2d8cff");
  const itemOptions = useMemo(() => itemType === "COURSE" ? data.courses : data.webinars, [data.courses, data.webinars, itemType]);
  const scopeOptions = useMemo(() => templateScope === "COURSE" ? data.courses : templateScope === "WEBINAR" ? data.webinars : templateScope === "SESSION" ? data.sessions : [], [data, templateScope]);
  const studentOptions = useMemo(() => searchStudents(data.students, studentSearch, studentSearch.trim() ? 50 : 12), [data.students, studentSearch]);
  const selectedStudent = useMemo(() => data.students.find((student) => student.id === selectedStudentId), [data.students, selectedStudentId]);

  const call = useCallback(async (method: string, body?: BodyInit, json = false) => {
    if (!supabase) throw new Error("Supabase is not configured");
    const token = (await supabase.auth.getSession()).data.session?.access_token;
    const response = await fetch("/api/admin/certificates", { method, headers: { Authorization: `Bearer ${token}`, ...(json ? { "Content-Type": "application/json" } : {}) }, body });
    const result = await response.json(); if (!response.ok) throw new Error(result.error || "Certificate request failed"); return result;
  }, [supabase]);
  const load = useCallback(() => call("GET").then(setData).catch((error) => setMessage(error.message)), [call]);
  useEffect(() => { void load(); }, [load]);

  async function saveTemplate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); const form = event.currentTarget; const values = Object.fromEntries(new FormData(form));
    try { await call("POST", JSON.stringify({ action: "template", ...values, requireAllSessions: true }), true); setMessage("Certificate template saved."); form.reset(); setTemplateScope("DEFAULT"); setDesignStyle("midnight"); setPrimaryColor("#071a38"); setAccentColor("#2d8cff"); await load(); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Could not save template"); } finally { setSaving(false); }
  }

  async function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = event.currentTarget; const file = new FormData(form).get("file");
    if (!selectedStudentId) { setMessage("Select a student from the search results."); return; }
    if (!(file instanceof File) || !file.size) { setMessage("Choose a completed PDF, or use Generate branded certificate."); return; }
    setSaving(true);
    try { await call("POST", new FormData(form)); setMessage("Verified certificate uploaded and issued."); form.reset(); setStudentSearch(""); setSelectedStudentId(""); await load(); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Could not upload certificate"); } finally { setSaving(false); }
  }

  async function generate(form: HTMLFormElement | null) {
    if (!form || !selectedStudentId) { setMessage("Select a student from the search results."); return; }
    const values = new FormData(form); const selectedType = String(values.get("itemType")); const itemId = String(values.get("itemId") || "");
    if (!itemId) { setMessage("Select a course or event."); return; } setSaving(true);
    try {
      if (!supabase) throw new Error("Supabase is not configured"); const token = (await supabase.auth.getSession()).data.session?.access_token;
      const response = await fetch("/api/student/certificates/generate", { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ itemType: selectedType, courseId: selectedType === "COURSE" ? itemId : null, webinarId: selectedType === "WEBINAR" ? itemId : null, sessionId: String(values.get("sessionId") || "") || null, userId: selectedStudentId, manualReason: String(values.get("overrideReason") || "") }) });
      const result = await response.json(); if (!response.ok) throw new Error(result.error || "Certificate generation failed");
      setMessage(result.existing ? "This certificate already exists; no duplicate was created." : "Professional certificate generated with a verification QR code."); await load();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not generate certificate"); } finally { setSaving(false); }
  }

  return <div className="portal-work-grid admin-members-layout">
    {message && <div className="portal-message" role="status">{message}</div>}
    <CertificateVerifier />
    <section className="portal-panel">
      <div className="portal-panel-head"><div><p>CERTIFICATE DESIGN</p><h2>Professional reusable templates</h2></div></div>
      <form className="portal-inline-form" onSubmit={saveTemplate}>
        <label>Template name<input name="name" required placeholder="e.g. AWS event completion" /></label>
        <label>Apply template to<select name="scopeType" value={templateScope} onChange={(event) => setTemplateScope(event.target.value)}><option value="DEFAULT">All programs by default</option><option value="COURSE">A course</option><option value="WEBINAR">An event</option><option value="SESSION">A session</option></select></label>
        {templateScope !== "DEFAULT" && <label>{templateScope === "COURSE" ? "Course" : templateScope === "WEBINAR" ? "Event" : "Session"}<select name="scopeId" required defaultValue=""><option value="" disabled>Select an item</option>{scopeOptions.map((item) => <option key={item.id} value={item.id}>{item.title || item.id}</option>)}</select></label>}
        <label>Design style<select name="designStyle" value={designStyle} onChange={(event) => setDesignStyle(event.target.value)}><option value="midnight">Midnight prestige</option><option value="royal">Royal ivory</option><option value="aurora">Aurora technology</option></select></label>
        <div className={`certificate-template-preview certificate-template-preview--${designStyle}`} style={{ "--certificate-primary": primaryColor, "--certificate-accent": accentColor } as CSSProperties}><span>DEVQUEST PK</span><small>AUTHENTICATED DIGITAL CREDENTIAL</small><h3>Certificate of Achievement</h3><p>is proudly presented to</p><strong>Student Name</strong><b>Program or Event Title</b><i>QR verification · lower-left</i></div>
        <div className="portal-form-row"><label>Primary color<input name="primaryColor" type="color" value={primaryColor} onChange={(event) => setPrimaryColor(event.target.value)} /></label><label>Accent color<input name="accentColor" type="color" value={accentColor} onChange={(event) => setAccentColor(event.target.value)} /></label></div>
        <label>Certificate heading<input name="certificateTitle" defaultValue="Certificate of Achievement" /></label><label>Presentation wording<input name="awardText" defaultValue="is proudly presented to" /></label>
        <div className="portal-form-row"><label>Issuer name<input name="issuerName" defaultValue="DevQuest Administration" /></label><label>Issuer title<input name="issuerTitle" defaultValue="Program Director" /></label></div>
        <div className="portal-form-row"><label>Second signer<input name="secondSignerName" defaultValue="DevQuest PK" /></label><label>Second signer title<input name="secondSignerTitle" defaultValue="Authorized Signatory" /></label></div>
        <label>Footer line<input name="footerText" defaultValue="Learning • Community • Innovation" /></label><label>Minimum attendance %<input name="minimumAttendancePercent" type="number" min="0" max="100" defaultValue="100" /></label>
        <button className="portal-primary" disabled={saving}>{saving && <LoaderCircle className="spin" />} Save template</button>
      </form>
      <div className="portal-template-list">{data.templates.map((item) => <p key={item.id}><strong>{item.name}</strong> · {item.scope_type} · {item.is_active ? "Active" : "Inactive"}</p>)}</div>
    </section>
    <section className="portal-panel">
      <div className="portal-panel-head"><div><p>CERTIFICATE ISSUANCE</p><h2>Generate or upload</h2></div></div><p className="portal-security-note">Eligibility is checked on the server. Overrides require a recorded reason.</p>
      <form className="portal-inline-form" onSubmit={upload}>
        <label>Search student<div className="certificate-student-search"><Search /><input type="search" value={studentSearch} onChange={(event) => { setStudentSearch(event.target.value); setSelectedStudentId(""); }} placeholder="Name, email, phone, or student ID" autoComplete="off" /></div></label><input type="hidden" name="userId" value={selectedStudentId} />
        {selectedStudent ? <div className="certificate-student-selected"><Check /><span><strong>{selectedStudent.full_name || "Student"}</strong><small>{[selectedStudent.student_id, selectedStudent.email].filter(Boolean).join(" · ")}</small></span><button type="button" onClick={() => { setSelectedStudentId(""); setStudentSearch(""); }}>Change</button></div> : <div className="certificate-student-results" role="listbox" aria-label="Matching students">{studentOptions.map((item) => <button type="button" role="option" aria-selected="false" key={item.id} onClick={() => { setSelectedStudentId(item.id); setStudentSearch(item.full_name || item.student_id || item.email || ""); }}><span><strong>{item.full_name || "Student"}</strong><small>{[item.student_id, item.email, item.phone].filter(Boolean).join(" · ")}</small></span></button>)}{!studentOptions.length && <p>No student matches this search.</p>}</div>}
        <label>Certificate for<select name="itemType" value={itemType} onChange={(event) => setItemType(event.target.value as "COURSE" | "WEBINAR")}><option value="COURSE">Course</option><option value="WEBINAR">Event</option></select></label>
        <label>{itemType === "COURSE" ? "Course" : "Event"}<select name="itemId" required defaultValue=""><option value="" disabled>Select an item</option>{itemOptions.map((item) => <option key={item.id} value={item.id}>{item.title || item.id}</option>)}</select></label>
        <label>Related session<select name="sessionId" defaultValue=""><option value="">No specific session</option>{data.sessions.map((item) => <option key={item.id} value={item.id}>{item.title || item.id}</option>)}</select></label>
        <label>Override reason<textarea name="overrideReason" rows={3} placeholder="Required only if the student does not meet the configured eligibility rule." /></label><label>Certificate PDF (manual upload only)<input name="file" type="file" accept="application/pdf" /></label>
        <div className="certificate-issuance-actions"><button type="button" className="portal-primary" onClick={(event) => void generate(event.currentTarget.form)} disabled={saving || !itemOptions.length || !selectedStudentId}>{saving ? <LoaderCircle className="spin" /> : <Award />} Generate branded certificate</button><button className="portal-secondary" disabled={saving || !itemOptions.length || !selectedStudentId}>{saving ? <LoaderCircle className="spin" /> : <Upload />} Upload completed PDF</button></div>
      </form>
    </section>
  </div>;
}
