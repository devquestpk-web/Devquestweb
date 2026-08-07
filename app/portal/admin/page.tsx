import type { Metadata } from "next";
import { AdminPortal } from "./admin-portal";

export const metadata: Metadata = { title: "Admin Portal", description: "DevQuest administration workspace." };
export default function AdminPortalPage() { return <AdminPortal />; }
