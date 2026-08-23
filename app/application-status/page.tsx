import type { Metadata } from "next";
import { ApplicationTracker } from "./application-tracker";

export const metadata: Metadata = {
  title: "Application Status",
  description: "Privately track a DevQuest Career or Campus Ambassador application.",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default function ApplicationStatusPage() {
  return <ApplicationTracker />;
}
