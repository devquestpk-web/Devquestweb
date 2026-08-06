import Image from "next/image";

const sponsors = [
  { src: "/partners/devsinc-multan.jpg", alt: "Devsinc Multan", fit: "extra-wide" },
  { src: "/partners/devsinc.jpg", alt: "Devsinc", fit: "mark" },
  { src: "/partners/english-with-komal.jpg", alt: "English with Komal", fit: "mark" },
  { src: "/partners/gc-css-mnsuet.jpg", alt: "General Committee of Computer Science Students at MNS-UET Multan", fit: "wide" },
  { src: "/partners/google.jpeg", alt: "Google", fit: "mark" },
  { src: "/partners/kohaq-black.png", alt: "Kohaq", fit: "wide" },
  { src: "/partners/mlsa.jpeg", alt: "Microsoft Learn Student Ambassadors", fit: "mark" },
  { src: "/partners/mnsuet.jpg", alt: "Muhammad Nawaz Sharif University of Engineering and Technology Multan", fit: "wide" },
  { src: "/partners/project-soch.jpg", alt: "Project Soch", fit: "mark" },
];

function SponsorSet({ duplicate = false }: { duplicate?: boolean }) {
  return (
    <div className="dq-sponsor-set" aria-hidden={duplicate || undefined}>
      {sponsors.map((sponsor) => (
        <div className="dq-sponsor-card" key={`${duplicate ? "duplicate" : "primary"}-${sponsor.src}`}>
          <div className={`dq-sponsor-logo dq-sponsor-logo-${sponsor.fit}`}>
            <Image src={sponsor.src} alt={duplicate ? "" : sponsor.alt} fill sizes="(max-width: 760px) 184px, 244px" />
          </div>
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
