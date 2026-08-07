import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, BriefcaseBusiness, Clock3, FolderKanban, MessageSquareText } from "lucide-react";

export const metadata: Metadata = { title: "Services Portal — Coming Soon", description: "The DevQuest Services Portal is coming soon." };

export default function ServicesPortalPage() {
  return <div className="student-coming-soon"><section className="student-coming-card"><Link className="portal-back" href="/portal"><ArrowLeft /> All portals</Link><div className="student-coming-icon"><BriefcaseBusiness /></div><p className="portal-kicker">SERVICES PORTAL</p><h1>Your project workspace is coming soon.</h1><p className="student-coming-copy">Clients will be able to follow delivery, share feedback, request support, and keep every engagement organized.</p><div className="student-coming-features"><span><FolderKanban /> Milestones</span><span><MessageSquareText /> Communication</span><span><Clock3 /> Delivery updates</span></div><Link className="dq-btn dq-btn-blue" href="/contact">Start an enquiry</Link></section></div>;
}
