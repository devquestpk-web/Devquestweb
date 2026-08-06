import Link from "next/link";

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="brand" aria-label="DevQuest home">
      <span className="brand-mark" aria-hidden="true">
        <i className="brand-bar brand-bar-one" />
        <i className="brand-bar brand-bar-two" />
        <i className="brand-bar brand-bar-three" />
        <i className="brand-dot brand-dot-one" />
        <i className="brand-dot brand-dot-two" />
      </span>
      {!compact && <span className="brand-word">DevQuest</span>}
    </Link>
  );
}
