import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BadgeCheck, BriefcaseBusiness, FileText, MailCheck } from "lucide-react";
import { ARE_JOB_APPLICATIONS_OPEN, jobs } from "../../jobs";
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

  const isOpen = job.status ? job.status === "open" : ARE_JOB_APPLICATIONS_OPEN;

  return (
    <main className="dq-job-apply-page">
      <section className="dq-job-apply-hero">
        <div className="dq-shell dq-job-apply-hero-grid">
          <div>
            <Link className="dq-job-back" href="/careers#open-roles"><ArrowLeft /> Back to roles</Link>
            <p className="dq-kicker"><BriefcaseBusiness /> {isOpen ? "OPEN VACANCY" : "ROLE DETAILS"}</p>
            <h1>{job.title}</h1>
          </div>
          <div className="dq-job-apply-summary">
            <div><span>Multan / Hybrid</span><span className={isOpen ? "dq-status-open" : "dq-status-closed"}>{isOpen ? "Applications open" : "Deadline ended"}</span></div>
            <p>{job.summary}</p>
            <ul>{job.skills.map((skill) => <li key={skill}><BadgeCheck /> {skill}</li>)}</ul>
          </div>
        </div>
      </section>


      <section className="ambassador-application">
        <div className="dq-shell ambassador-application-grid">
          <aside className="ambassador-guide">
            <p className="eyebrow">{isOpen ? "APPLICATION CHECKLIST" : "VACANCY INFORMATION"}</p>
            <h2>{isOpen ? "Put your best work forward." : "Position details & requirements."}</h2>
            <p>
              {isOpen
                ? `Complete the form for ${job.shortTitle}. The role is selected automatically and included in the email sent to the hiring team.`
                : `Review the key responsibilities and required skills for ${job.shortTitle}. Applications are currently closed.`}
            </p>
            <ul>
              <li><FileText /> <span>{isOpen ? "Prepare an up-to-date CV in PDF, DOC, or DOCX format." : "Prepare an updated CV for future open role calls."}</span></li>
              <li><BadgeCheck /> <span>Highlight projects and skills related to this specific vacancy.</span></li>
              <li><MailCheck /> <span>Follow DevQuest official channels for new opening announcements.</span></li>
            </ul>
          </aside>
          <JobApplicationForm position={job.title} isOpen={isOpen} />
        </div>
      </section>
    </main>
  );
}
