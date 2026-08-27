import Image from "next/image";

export interface Partner {
  id: string;
  name: string;
  organization: string;
  location?: string;
  mouStatus?: "signed" | "in-progress" | "none";
  focusTags?: string[];
  image?: string;
  logoFit?: "contain" | "cover";
}

export function PartnerCard({ partner }: { partner: Partner }) {
  return (
    <article className="dq-official-card">
      <div>
        <small>PARTNER</small>
        <h3>{partner.organization}</h3>
        <p>{partner.name}</p>
        {partner.location && <span>{partner.location}</span>}

        {partner.focusTags && partner.focusTags.length > 0 && (
          <div className="tags" style={{ marginTop: 18 }}>
            {partner.focusTags.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
        )}

        <div style={{ marginTop: 18 }}>
          {partner.mouStatus === "signed" && <b>MOU: Signed</b>}
          {partner.mouStatus === "in-progress" && <b>MOU: In progress</b>}
          {partner.mouStatus === "none" && <b>MOU: None</b>}
        </div>
      </div>

      {partner.image && (
        <div className="dq-sponsor-logo" style={{ position: "relative", width: 220, height: 120 }}>
          <Image src={partner.image} alt={partner.organization} fill sizes="220px" style={{ objectFit: partner.logoFit || "contain" }} />
        </div>
      )}
    </article>
  );
}

export default PartnerCard;
