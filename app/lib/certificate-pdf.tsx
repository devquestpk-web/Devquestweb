import React from "react";
import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import { sanitizeCertificateTemplate, type CertificateTemplateConfig } from "./certificate-template";

const styles = StyleSheet.create({
  page: { position: "relative", padding: 26, fontFamily: "Helvetica", backgroundColor: "#eef4ff" },
  canvas: { flex: 1, position: "relative", overflow: "hidden", borderRadius: 8, borderWidth: 1.5, padding: "38 48 34 48" },
  glowOne: { position: "absolute", width: 280, height: 280, borderRadius: 140, top: -155, right: -75, opacity: 0.16 },
  glowTwo: { position: "absolute", width: 210, height: 210, borderRadius: 105, bottom: -135, left: -65, opacity: 0.12 },
  rail: { position: "absolute", width: 7, top: 0, bottom: 0, left: 0 },
  topLine: { position: "absolute", height: 2, left: 48, right: 48, top: 86, opacity: 0.65 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  brand: { fontSize: 20, fontFamily: "Helvetica-Bold", letterSpacing: -0.6 },
  brandRule: { width: 38, height: 3, marginTop: 8, borderRadius: 2 },
  credential: { fontSize: 8, letterSpacing: 1.8, textTransform: "uppercase", textAlign: "right" },
  code: { fontSize: 8, marginTop: 6, textAlign: "right", opacity: 0.7 },
  content: { flex: 1, alignItems: "center", justifyContent: "center", paddingBottom: 28 },
  title: { fontSize: 12, fontFamily: "Helvetica-Bold", letterSpacing: 3.1, textTransform: "uppercase", marginBottom: 17 },
  awardText: { fontSize: 11, marginBottom: 12, opacity: 0.78 },
  studentName: { fontSize: 38, fontFamily: "Helvetica-Bold", textAlign: "center", letterSpacing: -1.2, marginBottom: 10 },
  nameRule: { width: 300, height: 1.5, marginBottom: 17 },
  achievement: { fontSize: 11, opacity: 0.76, marginBottom: 9 },
  courseTitle: { maxWidth: 520, fontSize: 21, fontFamily: "Helvetica-Bold", textAlign: "center", lineHeight: 1.2 },
  bottom: { minHeight: 74, flexDirection: "row", justifyContent: "flex-end", alignItems: "flex-end", gap: 32 },
  qrCard: { position: "absolute", left: 48, bottom: 30, width: 76, alignItems: "center", padding: 6, borderRadius: 5, backgroundColor: "#ffffff" },
  qr: { width: 55, height: 55 },
  qrLabel: { fontSize: 5.5, fontFamily: "Helvetica-Bold", letterSpacing: 0.8, marginTop: 3, color: "#071a38" },
  qrCode: { position: "absolute", left: 132, bottom: 37, width: 125 },
  verifyLabel: { fontSize: 6.5, letterSpacing: 1, textTransform: "uppercase", opacity: 0.65 },
  verifyCode: { fontSize: 8, fontFamily: "Helvetica-Bold", marginTop: 4 },
  signature: { width: 145, borderTopWidth: 1, paddingTop: 7 },
  signatureName: { fontSize: 9, fontFamily: "Helvetica-Bold", textAlign: "center" },
  signatureTitle: { fontSize: 7, marginTop: 3, textAlign: "center", opacity: 0.65 },
  date: { width: 110, borderTopWidth: 1, paddingTop: 7 },
  dateValue: { fontSize: 9, fontFamily: "Helvetica-Bold", textAlign: "center" },
  dateLabel: { fontSize: 7, marginTop: 3, textAlign: "center", opacity: 0.65 },
  footerText: { position: "absolute", bottom: 9, left: 280, right: 40, fontSize: 6, textAlign: "right", letterSpacing: 1.3, textTransform: "uppercase", opacity: 0.5 },
});

export interface CertificateProps {
  studentName: string;
  courseTitle: string;
  issueDate: string;
  certCode: string;
  qrCodeDataUrl: string;
  itemType: "COURSE" | "WEBINAR";
  template?: Partial<CertificateTemplateConfig> | Record<string, unknown>;
}

const palettes = {
  midnight: { paper: "#071a38", surface: "#0d2851", text: "#f8fbff", muted: "#c9d8ee" },
  royal: { paper: "#f7f4ec", surface: "#ffffff", text: "#13254a", muted: "#536581" },
  aurora: { paper: "#071f2d", surface: "#0b3040", text: "#f4ffff", muted: "#bfe2e5" },
} as const;

export function CertificateDocument({ studentName, courseTitle, issueDate, certCode, qrCodeDataUrl, itemType, template = {} }: CertificateProps) {
  const config = sanitizeCertificateTemplate(template);
  const palette = palettes[config.designStyle];
  const achievement = itemType === "COURSE" ? "for successfully completing" : "for verified participation in";

  return <Document title={`${config.certificateTitle} - ${studentName}`} author={config.brandName} subject={courseTitle}>
    <Page size="A4" orientation="landscape" style={[styles.page, { backgroundColor: palette.surface }]}>
      <View style={[styles.canvas, { backgroundColor: palette.paper, borderColor: config.accentColor, color: palette.text }]}>
        <View style={[styles.rail, { backgroundColor: config.accentColor }]} />
        <View style={[styles.glowOne, { backgroundColor: config.accentColor }]} />
        <View style={[styles.glowTwo, { backgroundColor: config.primaryColor }]} />
        <View style={[styles.topLine, { backgroundColor: config.accentColor }]} />
        <View style={styles.header}>
          <View><Text style={[styles.brand, { color: palette.text }]}>{config.brandName}</Text><View style={[styles.brandRule, { backgroundColor: config.accentColor }]} /></View>
          <View><Text style={[styles.credential, { color: config.accentColor }]}>Authenticated digital credential</Text><Text style={[styles.code, { color: palette.muted }]}>Certificate ID · {certCode}</Text></View>
        </View>
        <View style={styles.content}>
          <Text style={[styles.title, { color: config.accentColor }]}>{config.certificateTitle}</Text>
          <Text style={[styles.awardText, { color: palette.muted }]}>{config.awardText}</Text>
          <Text style={[styles.studentName, { color: palette.text }]}>{studentName}</Text>
          <View style={[styles.nameRule, { backgroundColor: config.accentColor }]} />
          <Text style={[styles.achievement, { color: palette.muted }]}>{achievement}</Text>
          <Text style={[styles.courseTitle, { color: palette.text }]}>{courseTitle}</Text>
        </View>
        <View style={styles.bottom}>
          <View style={[styles.signature, { borderColor: config.accentColor }]}><Text style={[styles.signatureName, { color: palette.text }]}>{config.issuerName}</Text><Text style={[styles.signatureTitle, { color: palette.muted }]}>{config.issuerTitle}</Text></View>
          <View style={[styles.signature, { borderColor: config.accentColor }]}><Text style={[styles.signatureName, { color: palette.text }]}>{config.secondSignerName}</Text><Text style={[styles.signatureTitle, { color: palette.muted }]}>{config.secondSignerTitle}</Text></View>
          <View style={[styles.date, { borderColor: config.accentColor }]}><Text style={[styles.dateValue, { color: palette.text }]}>{issueDate}</Text><Text style={[styles.dateLabel, { color: palette.muted }]}>Date of issue</Text></View>
        </View>
        <View style={styles.qrCard}>{qrCodeDataUrl ? <>
          {/* eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image is not an HTML image. */}
          <Image style={styles.qr} src={qrCodeDataUrl} />
        </> : null}<Text style={styles.qrLabel}>SCAN TO VERIFY</Text></View>
        <View style={styles.qrCode}><Text style={[styles.verifyLabel, { color: palette.muted }]}>Secure verification</Text><Text style={[styles.verifyCode, { color: palette.text }]}>{certCode}</Text></View>
        <Text style={[styles.footerText, { color: palette.muted }]}>{config.footerText}</Text>
      </View>
    </Page>
  </Document>;
}
