import Link from "next/link";
import { ArrowUpRight, BriefcaseBusiness, CloudCog, Code2, Palette } from "lucide-react";
import { jobs } from "../careers/jobs";

const icons = [Code2, Palette, CloudCog, BriefcaseBusiness];

export function CareerCards({ preview = false }: { preview?: boolean }) {
  return (
    <div className={`dq-career-grid${preview ? " is-preview" : ""}`}>
      {jobs.map((job, index) => {
        const Icon = icons[index];
        return (
          <article className="dq-career-card" id={preview ? undefined : job.slug} key={job.slug}>
            <div className="dq-career-card-top"><span><Icon /></span><small>0{index + 1}</small></div>
            <p>TECHNICAL TEAM</p>
            <h3>{job.title}</h3>
            {!preview ? <><div className="dq-career-meta"><span>Multan / Hybrid</span><span>Open application</span></div><p className="dq-career-summary">{job.summary}</p><ul>{job.skills.map((skill) => <li key={skill}>{skill}</li>)}</ul></> : null}
            <Link href={`/careers/apply/${job.slug}`}>Apply now <ArrowUpRight /></Link>
          </article>
        );
      })}
      {preview ? <Link className="dq-career-all" href="/careers">View all career details <ArrowUpRight /></Link> : null}
    </div>
  );
}
