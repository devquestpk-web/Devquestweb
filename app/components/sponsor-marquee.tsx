import Image from "next/image";

const sponsors = Array.from({ length: 7 }, (_, index) => ({
  src: `/figma/sponsor-${index + 1}.png`,
  alt: `DevQuest partner ${index + 1}`,
}));

function SponsorSet({ duplicate = false }: { duplicate?: boolean }) {
  return (
    <div className="dq-sponsor-set" aria-hidden={duplicate || undefined}>
      {sponsors.map((sponsor) => (
        <div className="dq-sponsor-card" key={`${duplicate ? "duplicate" : "primary"}-${sponsor.src}`}>
          <Image src={sponsor.src} alt={duplicate ? "" : sponsor.alt} width={248} height={120} />
        </div>
      ))}
    </div>
  );
}

export function SponsorMarquee() {
  return (
    <div className="dq-sponsor-marquee" aria-label="DevQuest partners and sponsors">
      <div className="dq-sponsor-track">
        <SponsorSet />
        <SponsorSet duplicate />
      </div>
    </div>
  );
}
