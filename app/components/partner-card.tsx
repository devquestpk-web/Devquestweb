import Image from "next/image";
import Link from "next/link";
import { Linkedin, MapPin } from "lucide-react";

export interface PartnerData {
  /** Display name of the contact / organisation representative */
  name: string;
  /** Full organisation name (university, society, company) */
  organization: string;
  /** City, Province */
  location: string;
  /** Formal MoU status */
  mouStatus: "signed" | "pending" | "informal";
  /** Topic / domain tags shown as pills */
  focusTags: string[];
  /** Absolute public path to headshot or org logo, e.g. "/partnerships/…" */
  image?: string;
  /** Optional LinkedIn profile URL */
  linkedIn?: string;
  /** Their title / role within the organisation */
  role?: string;
}

const mouLabels: Record<PartnerData["mouStatus"], string> = {
  signed:   "✓ MoU Signed",
  pending:  "MoU Pending",
  informal: "Active Partner",
};

export function PartnerCard({ partner }: { partner: PartnerData }) {
  const initials = partner.name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("");

  return (
    <article className="dq-tic-partner-card">
      {/* Portrait */}
      <div className="dq-tic-partner-portrait">
        {partner.image ? (
          <Image
            src={partner.image}
            alt={partner.name}
            fill
            sizes="(max-width: 760px) 100vw, 360px"
            style={{ objectFit: "contain", padding: "12px" }}
          />
        ) : (
          <span className="dq-tic-partner-portrait-initials">{initials}</span>
        )}
      </div>

      {/* Organisation kicker */}
      <small>{partner.organization}</small>

      {/* Name */}
      <h3>{partner.name}</h3>

      {/* Role */}
      {partner.role && (
        <p className="dq-tic-partner-role">{partner.role}</p>
      )}

      {/* Location */}
      <p className="dq-tic-partner-location">
        <MapPin aria-hidden="true" />
        {partner.location}
      </p>

      {/* Focus tags */}
      {partner.focusTags.length > 0 && (
        <div className="dq-tic-partner-tags">
          {partner.focusTags.map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>
      )}

      {/* Footer — MoU badge + LinkedIn */}
      <div className="dq-tic-partner-footer">
        <span className={`dq-tic-mou-badge dq-tic-mou-${partner.mouStatus}`}>
          {mouLabels[partner.mouStatus]}
        </span>
        {partner.linkedIn && (
          <Link
            href={partner.linkedIn}
            target="_blank"
            rel="noreferrer"
            aria-label={`View ${partner.name} on LinkedIn`}
          >
            <Linkedin aria-hidden="true" />
          </Link>
        )}
      </div>
    </article>
  );
}
