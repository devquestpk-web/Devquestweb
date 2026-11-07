export const CERTIFICATE_DESIGNS = ["midnight", "royal", "aurora"] as const;

export type CertificateDesign = (typeof CERTIFICATE_DESIGNS)[number];

export type CertificateTemplateConfig = {
  designStyle: CertificateDesign;
  primaryColor: string;
  accentColor: string;
  brandName: string;
  certificateTitle: string;
  awardText: string;
  issuerName: string;
  issuerTitle: string;
  secondSignerName: string;
  secondSignerTitle: string;
  footerText: string;
};

const color = (value: unknown, fallback: string) =>
  /^#[0-9a-f]{6}$/i.test(String(value || "")) ? String(value) : fallback;

const shortText = (value: unknown, fallback: string, length: number) =>
  String(value || "").trim().slice(0, length) || fallback;

export function sanitizeCertificateTemplate(input: Record<string, unknown> = {}): CertificateTemplateConfig {
  const style = String(input.designStyle || "midnight");
  return {
    designStyle: CERTIFICATE_DESIGNS.includes(style as CertificateDesign) ? style as CertificateDesign : "midnight",
    primaryColor: color(input.primaryColor, "#071a38"),
    accentColor: color(input.accentColor, "#2d8cff"),
    brandName: shortText(input.brandName, "DevQuest PK", 60),
    certificateTitle: shortText(input.certificateTitle, "Certificate of Achievement", 100),
    awardText: shortText(input.awardText, "is proudly presented to", 140),
    issuerName: shortText(input.issuerName, "DevQuest Administration", 100),
    issuerTitle: shortText(input.issuerTitle, "Program Director", 100),
    secondSignerName: shortText(input.secondSignerName, "DevQuest PK", 100),
    secondSignerTitle: shortText(input.secondSignerTitle, "Authorized Signatory", 100),
    footerText: shortText(input.footerText, "Learning • Community • Innovation", 160),
  };
}
