import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BadgeCheck, BriefcaseBusiness, FileText, MailCheck } from "lucide-react";
import { jobs } from "../../jobs";
import { JobApplicationForm } from "./job-application-form";

type JobApplicationPageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return jobs.map((job) => ({ slug: job.slug }));
}

export async function generateMetadata({ params }: JobApplicationPageProps): Promise<Metadata> {
  const { slug } = await params;
  const job = jobs.find((item) => item.slug === slug);
  return {
    title: job ? `Apply — ${job.shortTitle}` : "Career application",
    description: job ? `Apply for the ${job.title} position at DevQuest PK.` : "Apply for an open role at DevQuest PK.",
  };
}

export default async function JobApplicationPage({ params }: JobApplicationPageProps) {
  const { slug } = await params;
  const job = jobs.find((item) => item.slug === slug);
  if (!job) notFound();

  return (
    <main className="dq-job-apply-page">
      <section className="dq-job-apply-hero">
        <div className="dq-shell dq-job-apply-hero-grid">
          <div>
            <Link className="dq-job-back" href="/careers#open-roles"><ArrowLeft /> Back to open roles</Link>
            <p className="dq-kicker"><BriefcaseBusiness /> OPEN VACANCY</p>
            <h1>{job.title}</h1>
          </div>
          <div className="dq-job-apply-summary">
            <div><span>Multan / Hybrid</span><span>Applications open</span></div>
            <p>{job.summary}</p>
            <ul>{job.skills.map((skill) => <li key={skill}><BadgeCheck /> {skill}</li>)}</ul>
          </div>
        </div>
      </section>

      <section className="ambassador-application">
        <div className="dq-shell ambassador-application-grid">
          <aside className="ambassador-guide">
            <p className="eyebrow">APPLICATION CHECKLIST</p>
            <h2>Put your best work forward.</h2>
            <p>Complete the form for <strong>{job.shortTitle}</strong>. The role is selected automatically and included in the email sent to the hiring team.</p>
            <ul>
              <li><FileText /> <span>Prepare an up-to-date CV in PDF, DOC, or DOCX format.</span></li>
              <li><BadgeCheck /> <span>Highlight projects and skills related to this specific vacancy.</span></li>
              <li><MailCheck /> <span>Use an active email and WhatsApp number so the team can contact you.</span></li>
            </ul>
          </aside>
          <JobApplicationForm position={job.title} />
        </div>
      </section>
    </main>
  );
}
