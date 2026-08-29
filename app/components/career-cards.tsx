import Link from "next/link";
import {
  ArrowUpRight,
  BarChart3,
  BrainCircuit,
  BriefcaseBusiness,
  Clapperboard,
  CloudCog,
  Code2,
  Megaphone,
  Palette,
  Smartphone,
  LucideIcon,
} from "lucide-react";
import { jobs } from "../careers/jobs";

const icons: LucideIcon[] = [
  Code2,             // 01: Tech Lead / Full-Stack Developer
  Palette,           // 02: Frontend & UI/UX Developer
  CloudCog,          // 03: Cloud & AI Solutions Engineer
  BriefcaseBusiness, // 04: Business Development Executive (BDE)
  BrainCircuit,      // 05: AI / ML Engineer
  BarChart3,         // 06: Data Analyst
  Megaphone,         // 07: Marketing Specialist
  Palette,           // 08: Graphic Designer
  Clapperboard,      // 09: Video Editor & Content Creator
  Smartphone,        // 10: Mobile App Developer
];

export function CareerCards({ preview = false }: { preview?: boolean }) {
  const visibleJobs = preview ? jobs.slice(0, 4) : jobs;

  return (
    <div className={`dq-career-grid${preview ? " is-preview" : ""}`}>
      {visibleJobs.map((job, index) => {
        const Icon = icons[index] || BriefcaseBusiness;
        const numberFormatted = String(index + 1).padStart(2, "0");

        return (
          <article className="dq-career-card" id={preview ? undefined : job.slug} key={job.slug}>
            <div className="dq-career-card-top">
              <span><Icon /></span>
              <small>{numberFormatted}</small>
            </div>
            <p>{job.category || "TECHNICAL TEAM"}</p>
            <h3>{job.title}</h3>
            {!preview ? (
              <>
                <div className="dq-career-meta">
                  <span>Multan / Hybrid</span>
                  <span>Open application</span>
                </div>
                <p className="dq-career-summary">{job.summary}</p>
                <ul>
                  {job.skills.map((skill) => (
                    <li key={skill}>{skill}</li>
                  ))}
                </ul>
              </>
            ) : null}
            <Link href={`/careers/apply/${job.slug}`}>
              Apply now <ArrowUpRight />
            </Link>
          </article>
        );
      })}
      {preview ? (
        <Link className="dq-career-all" href="/careers">
          View all career details <ArrowUpRight />
        </Link>
      ) : null}
    </div>
  );
}
