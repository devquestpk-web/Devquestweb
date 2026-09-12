import type { Metadata } from "next";
import { StudentPortal } from "./student-portal";

export const metadata: Metadata = {
  title: "Student Portal",
  description: "DevQuest Student Portal for learning paths, events, and certifications.",
};

export default function StudentPortalPage() {
  return <StudentPortal />;
}
