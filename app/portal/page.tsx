import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, GraduationCap, ShieldCheck, UsersRound } from "lucide-react";

export const metadata: Metadata = { title: "Portals", description: "Access DevQuest student, services, team, and admin portals." };

const portals = [
  { name: "Team Portal", status: "Live workspace", copy: "View assigned tasks, maintain your profile and credentials, mark attendance, and submit reports.", href: "/portal/team", icon: UsersRound, tone: "team" },
  { name: "Admin Portal", status: "Administrators only", copy: "Manage team accounts, assignments, attendance, reports, and operational access from one place.", href: "/portal/admin", icon: ShieldCheck, tone: "admin" },
  { name: "Services Portal", status: "Coming soon", copy: "A dedicated client workspace for service requests, project communication, milestones, and delivery.", href: "/portal/services", icon: BriefcaseBusiness, tone: "services" },
  { name: "Student Portal", status: "Coming soon", copy: "Learning paths, events, certificates, opportunities, and student progress in one connected space.", href: "/portal/student", icon: GraduationCap, tone: "student" },
];

export default function PortalsPage() {
  return <div className="portal-hub"><section className="portal-hub-hero dq-shell"><p className="portal-kicker">DEVQUEST DIGITAL WORKSPACE</p><h1>Four portals.<br />One community.</h1><p>Choose the workspace designed for your role. Team and administrator tools are live; student and services experiences are on the way.</p></section><section className="portal-choice-grid portal-choice-grid-four dq-shell" aria-label="Choose a DevQuest portal">{portals.map(({ name, status, copy, href, icon: Icon, tone }) => <article className={`portal-choice portal-choice-${tone}`} key={name}><div className="portal-choice-icon"><Icon /></div><span>{status}</span><h2>{name}</h2><p>{copy}</p><Link href={href}>Open {name.toLowerCase()} <ArrowRight /></Link></article>)}</section></div>;
}
