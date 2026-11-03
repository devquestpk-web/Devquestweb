import { createHmac, randomBytes, timingSafeEqual } from "crypto";

function ticketSecret() {
  const secret = process.env.TICKET_HMAC_SECRET;
  if (!secret || secret.length < 32) throw new Error("TICKET_HMAC_SECRET must be configured with at least 32 characters");
  return secret;
}

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
  const sig = createHmac("sha256", ticketSecret()).update(dataString).digest("hex");
  
  const signedPayload: SignedQRPayload = { data: payload, sig };
  return JSON.stringify(signedPayload);
}

export function verifyQrPayload(signedPayloadString: string): QRPayload | null {
  try {
    const signedPayload: SignedQRPayload = JSON.parse(signedPayloadString);
    if (!signedPayload.data || !signedPayload.sig) return null;
    
    const dataString = JSON.stringify(signedPayload.data);
    const expectedSig = createHmac("sha256", ticketSecret()).update(dataString).digest("hex");
    
    if (sigSafeCompare(signedPayload.sig, expectedSig)) {
      return signedPayload.data;
    }
    return null;
  } catch {
    return null;
  }
}

// Constant-time string comparison to prevent timing attacks
function sigSafeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}
