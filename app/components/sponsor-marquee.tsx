import Image from "next/image";

const sponsors = [
  { src: "/partners/devsinc-multan.jpg", alt: "Devsinc Multan" },
  { src: "/partners/devsinc.jpg", alt: "Devsinc" },
  { src: "/partners/english-with-komal.jpg", alt: "English with Komal" },
  { src: "/partners/gc-css-mnsuet.jpg", alt: "General Committee of Computer Science Students at MNS-UET Multan" },
  { src: "/partners/google.jpeg", alt: "Google" },
  { src: "/partners/kohaq-black.png", alt: "Kohaq" },
  { src: "/partners/mlsa.jpeg", alt: "Microsoft Learn Student Ambassadors" },
  { src: "/partners/mnsuet.jpg", alt: "Muhammad Nawaz Sharif University of Engineering and Technology Multan" },
  { src: "/partners/project-soch.jpg", alt: "Project Soch" },
];

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
