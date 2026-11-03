import { createSign } from "node:crypto";

const tokenEndpoint = "https://oauth2.googleapis.com/token";
const sheetsBase = "https://sheets.googleapis.com/v4/spreadsheets";
export const DEVQUEST_MASTER_SPREADSHEET_ID = "194kjBck1wr7c1u3kB9DW6jnI5xn5ag84NkeIm3IsNfw";

function base64url(value: string | Buffer) {
  return Buffer.from(value).toString("base64url");
}

function escapeFormula(value: unknown) {
  const text = String(value ?? "");
  return /^[=+\-@]/.test(text) ? `'${text}` : text;
}

async function accessToken() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!email || !privateKey) throw new Error("Google service-account credentials are not configured");
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = base64url(JSON.stringify({ iss: email, scope: "https://www.googleapis.com/auth/spreadsheets", aud: tokenEndpoint, iat: now, exp: now + 3600 }));
  const unsigned = `${header}.${claims}`;
  const signer = createSign("RSA-SHA256");
  signer.update(unsigned);
  const assertion = `${unsigned}.${signer.sign(privateKey, "base64url")}`;
  const response = await fetch(tokenEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion }),
    cache: "no-store",
  });
  const result = await response.json() as { access_token?: string; error_description?: string };
  if (!response.ok || !result.access_token) throw new Error(result.error_description || "Google authentication failed");
  return result.access_token;
}

export function configuredSpreadsheetId() {
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  if (!spreadsheetId) throw new Error("GOOGLE_SHEETS_SPREADSHEET_ID is not configured");
  if (spreadsheetId !== DEVQUEST_MASTER_SPREADSHEET_ID) throw new Error("GOOGLE_SHEETS_SPREADSHEET_ID must reference the DevQuest PK - Master Database spreadsheet");
  return spreadsheetId;
}

async function sheetsRequest(path: string, init?: RequestInit) {
  const spreadsheetId = configuredSpreadsheetId();
  const token = await accessToken();
  const response = await fetch(`${sheetsBase}/${encodeURIComponent(spreadsheetId)}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...init?.headers },
    cache: "no-store",
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`Google Sheets API ${response.status}: ${JSON.stringify(body).slice(0, 500)}`);
  return body;
}

export async function ensureSheetHeaders(sheetName: string, headers: string[]) {
  const metadata = await sheetsRequest("?fields=sheets.properties.title") as { sheets?: Array<{ properties?: { title?: string } }> };
  if (!metadata.sheets?.some((sheet) => sheet.properties?.title === sheetName)) {
    await sheetsRequest(":batchUpdate", { method: "POST", body: JSON.stringify({ requests: [{ addSheet: { properties: { title: sheetName } } }] }) });
  }
  const range = encodeURIComponent(`${sheetName}!A1:${String.fromCharCode(64 + Math.min(headers.length, 26))}1`);
  const current = await sheetsRequest(`/values/${range}`) as { values?: string[][] };
  if (current.values?.[0]?.length) return;
  await sheetsRequest(`/values/${range}?valueInputOption=RAW`, { method: "PUT", body: JSON.stringify({ values: [headers] }) });
}

export async function upsertSheetRow(sheetName: string, stableId: string, values: unknown[]) {
  const idRange = encodeURIComponent(`${sheetName}!A:A`);
  const current = await sheetsRequest(`/values/${idRange}`) as { values?: string[][] };
  const rowIndex = current.values?.findIndex((row) => row[0] === stableId) ?? -1;
  const safeValues = values.map(escapeFormula);
  if (rowIndex >= 1) {
    const rowNumber = rowIndex + 1;
    const range = encodeURIComponent(`${sheetName}!A${rowNumber}`);
    await sheetsRequest(`/values/${range}?valueInputOption=RAW`, { method: "PUT", body: JSON.stringify({ values: [safeValues] }) });
    return rowNumber;
  }
  const range = encodeURIComponent(`${sheetName}!A:Z`);
  const result = await sheetsRequest(`/values/${range}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`, { method: "POST", body: JSON.stringify({ values: [safeValues] }) }) as { updates?: { updatedRange?: string } };
  const match = result.updates?.updatedRange?.match(/!(?:[A-Z]+)(\d+)/);
  return match ? Number(match[1]) : null;
}
