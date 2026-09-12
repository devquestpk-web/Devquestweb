import React from "react";
import { Document, Page, Text, View, StyleSheet, Font, Image } from "@react-pdf/renderer";

// Register fonts
Font.register({
  family: "Geist",
  fonts: [
    { src: "https://cdn.jsdelivr.net/fontsource/fonts/geist-sans@latest/latin-400-normal.ttf" },
    { src: "https://cdn.jsdelivr.net/fontsource/fonts/geist-sans@latest/latin-700-normal.ttf", fontWeight: 700 },
    { src: "https://cdn.jsdelivr.net/fontsource/fonts/geist-sans@latest/latin-900-normal.ttf", fontWeight: 900 },
  ],
});

const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#ffffff",
    padding: 40,
    fontFamily: "Geist",
  },
  borderWrap: {
    flex: 1,
    border: "2pt solid #061e3d",
    padding: 30,
    position: "relative",
  },
  innerBorder: {
    position: "absolute",
    top: 5,
    left: 5,
    right: 5,
    bottom: 5,
    border: "1pt solid #469bff",
    zIndex: -1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 50,
  },
  brand: {
    fontSize: 28,
    fontWeight: 900,
    color: "#061e3d",
    letterSpacing: -1,
  },
  brandAccent: {
    color: "#469bff",
  },
  certTitle: {
    fontSize: 12,
    color: "#469bff",
    textTransform: "uppercase",
    letterSpacing: 2,
    fontWeight: 700,
    textAlign: "right",
  },
  certCode: {
    fontSize: 10,
    color: "#718096",
    textAlign: "right",
    marginTop: 4,
  },
  body: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  kicker: {
    fontSize: 14,
    color: "#4a5568",
    marginBottom: 15,
  },
  studentName: {
    fontSize: 48,
    fontWeight: 700,
    color: "#061e3d",
    marginBottom: 20,
    textAlign: "center",
  },
  description: {
    fontSize: 16,
    color: "#4a5568",
    marginBottom: 10,
  },
  courseTitle: {
    fontSize: 24,
    fontWeight: 700,
    color: "#061e3d",
    textAlign: "center",
    maxWidth: "80%",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: 40,
  },
  signatureBlock: {
    width: 200,
    borderTop: "1pt solid #cbd5e0",
    paddingTop: 10,
  },
  signatureName: {
    fontSize: 14,
    fontWeight: 700,
    color: "#061e3d",
  },
  signatureTitle: {
    fontSize: 10,
    color: "#718096",
  },
  qrContainer: {
    width: 80,
    height: 80,
  },
  qrImage: {
    width: "100%",
    height: "100%",
  },
  dateBlock: {
    alignItems: "flex-end",
  },
  dateLabel: {
    fontSize: 10,
    color: "#718096",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4,
  },
  dateValue: {
    fontSize: 14,
    fontWeight: 700,
    color: "#061e3d",
  },
});

export interface CertificateProps {
  studentName: string;
  courseTitle: string;
  issueDate: string;
  certCode: string;
  qrCodeDataUrl: string;
  itemType: "COURSE" | "WEBINAR";
}

export const CertificateDocument = ({ studentName, courseTitle, issueDate, certCode, qrCodeDataUrl, itemType }: CertificateProps) => (
  <Document>
    <Page size="A4" orientation="landscape" style={styles.page}>
      <View style={styles.borderWrap}>
        <View style={styles.innerBorder} />
        
        <View style={styles.header}>
          <Text style={styles.brand}>
            DevQuest<Text style={styles.brandAccent}>.</Text>
          </Text>
          <View>
            <Text style={styles.certTitle}>Certificate of {itemType === "COURSE" ? "Completion" : "Attendance"}</Text>
            <Text style={styles.certCode}>ID: {certCode}</Text>
          </View>
        </View>

        <View style={styles.body}>
          <Text style={styles.kicker}>This is to certify that</Text>
          <Text style={styles.studentName}>{studentName}</Text>
          <Text style={styles.description}>
            has successfully {itemType === "COURSE" ? "completed the course" : "attended the webinar"}
          </Text>
          <Text style={styles.courseTitle}>{courseTitle}</Text>
        </View>

        <View style={styles.footer}>
          <View style={styles.signatureBlock}>
            <Text style={styles.signatureName}>DevQuest Administration</Text>
            <Text style={styles.signatureTitle}>Issued digitally by DevQuest PK</Text>
          </View>
          
          <View style={styles.qrContainer}>
            {qrCodeDataUrl && <Image style={styles.qrImage} src={qrCodeDataUrl} />}
          </View>

          <View style={styles.dateBlock}>
            <Text style={styles.dateLabel}>Date of Issue</Text>
            <Text style={styles.dateValue}>{issueDate}</Text>
          </View>
        </View>
      </View>
    </Page>
  </Document>
);
