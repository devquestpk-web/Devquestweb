import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How DevQuest PK collects, uses, protects, and shares information across its website and learning portals.",
};

export default function PrivacyPage() {
  return (
    <article className="dq-policy-page">
      <header>
        <p>DEVQUEST PK</p>
        <h1>Privacy Policy</h1>
        <span>Last updated: 7 November 2026</span>
      </header>
      <section><h2>About this policy</h2><p>This policy explains how DevQuest PK collects and uses information when you browse our website, create a portal account, enroll in an event or course, attend a session, request support, or receive a certificate. Supabase remains the primary database for portal records.</p></section>
      <section><h2>Information we collect</h2><p>We may collect your name, email address, phone number, city, educational institution, degree or program, semester, profile details, event and session enrollments, attendance, certificates, support requests, and communication preferences. We also receive basic technical data such as browser type, IP address, device information, and pages visited through hosting, security, and analytics services.</p><p>We never ask for or export your password. Authentication credentials are handled by Supabase Auth.</p></section>
      <section><h2>How we use information</h2><ul><li>Provide and secure student, team, and administrator portal access.</li><li>Manage programs, enrollments, sessions, attendance, support, and certificate verification.</li><li>Send account, enrollment, schedule, support, and certificate notifications.</li><li>Maintain operational reports and synchronized records for authorized administrators.</li><li>Improve website reliability, accessibility, content, and protection against abuse.</li></ul></section>
      <section><h2>Service providers and data sharing</h2><p>We use service providers including Supabase for authentication and database services, Vercel for website hosting, Google services for authorized operational records and meeting features, and email providers for transactional notifications. These providers process only the information needed to deliver their services. We do not sell student or member personal information.</p></section>
      <section><h2>Cookies, advertising, and analytics</h2><p>The website may use essential cookies for sign-in and security. If advertising is enabled, Google and its partners may use cookies or similar technologies to serve and measure ads in accordance with their policies. Where required, we will request consent before using non-essential cookies. You can also manage cookies through your browser settings.</p></section>
      <section><h2>Retention and security</h2><p>We retain records for as long as they are needed to provide the service, meet operational or legal requirements, preserve attendance and certificate history, and resolve disputes. Access is restricted by role, and sensitive credentials are stored only in protected server-side settings.</p></section>
      <section><h2>Your choices</h2><p>You may update your student profile and communication preferences through the portal. You may also request access, correction, or deletion of eligible personal information. Some records may be retained where required for security, certificate integrity, attendance history, or legal obligations.</p></section>
      <section><h2>Contact us</h2><p>For privacy questions or requests, email <a href="mailto:devquestpk@gmail.com">devquestpk@gmail.com</a> or use our <a href="/contact">contact page</a>.</p></section>
    </article>
  );
}
