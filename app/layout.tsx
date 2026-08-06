import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { MessageCircle } from "lucide-react";
import "./globals.css";
import { SiteHeader } from "./components/site-header";
import { SiteFooter } from "./components/site-footer";
import { AuthDock } from "./components/auth-dock";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://devquest.pk"),
  title: {
    default: "DevQuest PK — Empowering Innovators",
    template: "%s | DevQuest PK",
  },
  description:
    "A global community of innovators learning, building, and shaping the future of technology across Pakistan.",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
  openGraph: {
    title: "DevQuest PK — Empowering Innovators",
    description:
      "Join Pakistan's growing technology community for events, practical learning, collaboration, and impactful solutions.",
    type: "website",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "DevQuest PK — Empowering a global community of innovators" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "DevQuest PK — Empowering Innovators",
    description: "Learn, build, and shape the future of technology with DevQuest PK.",
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <SiteHeader />
        <main>{children}</main>
        <SiteFooter />
        <AuthDock />
        <a
          className="floating-contact"
          href="https://wa.me/923704489589?text=Hello%20DevQuest%2C%20I%20would%20like%20to%20connect."
          target="_blank"
          rel="noreferrer"
          aria-label="Chat with DevQuest on WhatsApp"
        >
          <span>We are here!</span>
          <MessageCircle aria-hidden="true" />
        </a>
      </body>
    </html>
  );
}
