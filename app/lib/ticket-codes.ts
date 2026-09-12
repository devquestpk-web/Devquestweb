import { createHmac, randomBytes } from "crypto";

const HMAC_SECRET = process.env.TICKET_HMAC_SECRET || "devquest-default-insecure-secret-key-change-me";

export function generateTicketCode(itemType: "COURSE" | "WEBINAR"): string {
  const prefix = itemType === "COURSE" ? "CRS" : "WEB";
  const unique = randomBytes(4).toString("hex").toUpperCase();
  return `DQ-${prefix}-${unique}`;
}

export function generateCertCode(): string {
  const year = new Date().getUTCFullYear();
  const unique = randomBytes(6).toString("hex").toUpperCase();
  return `DQ-CERT-${year}-${unique}`;
}

export interface QRPayload {
  t: string; // Ticket Code
  i: string; // Item ID (Course/Webinar)
  u: string; // User ID
  y: "C" | "W"; // Type (Course / Webinar)
}

export interface SignedQRPayload {
  data: QRPayload;
  sig: string;
}

export function generateQrPayload(ticketCode: string, itemId: string, userId: string, itemType: "COURSE" | "WEBINAR"): string {
  const payload: QRPayload = {
    t: ticketCode,
    i: itemId,
    u: userId,
    y: itemType === "COURSE" ? "C" : "W",
  };
  
  const dataString = JSON.stringify(payload);
  const sig = createHmac("sha256", HMAC_SECRET).update(dataString).digest("hex");
  
  const signedPayload: SignedQRPayload = { data: payload, sig };
  return JSON.stringify(signedPayload);
}

export function verifyQrPayload(signedPayloadString: string): QRPayload | null {
  try {
    const signedPayload: SignedQRPayload = JSON.parse(signedPayloadString);
    if (!signedPayload.data || !signedPayload.sig) return null;
    
    const dataString = JSON.stringify(signedPayload.data);
    const expectedSig = createHmac("sha256", HMAC_SECRET).update(dataString).digest("hex");
    
    if (sigSafeCompare(signedPayload.sig, expectedSig)) {
      return signedPayload.data;
    }
    return null;
  } catch (e) {
    return null;
  }
}

// Constant-time string comparison to prevent timing attacks
function sigSafeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}
