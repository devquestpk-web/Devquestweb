import type { Metadata } from "next";
import { TeamPortal } from "./team-portal";

export const metadata: Metadata = {
  title: "Team Portal",
  description: "DevQuest team tasking, attendance, and reporting workspace.",
};

export default function TeamPortalPage() {
  return <TeamPortal />;
}
