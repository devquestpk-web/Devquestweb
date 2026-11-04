/**
 * DevQuest PK Google Sheets sync web app.
 *
 * Deploy as a Web app: Execute as Me; Who has access: Anyone.
 * Set WEBHOOK_SECRET in Apps Script Project Settings > Script properties.
 */
const ALLOWED_SHEETS = new Set([
  "Students", "Events", "Sessions", "Session_Enrollments", "Attendance", "Certificates",
]);
const SPREADSHEET_ID = "194kjBck1wr7c1u3kB9DW6jnI5xn5ag84NkeIm3IsNfw";

function doPost(event) {
  try {
    const body = JSON.parse(event.postData && event.postData.contents || "{}");
    if (body.secret !== PropertiesService.getScriptProperties().getProperty("WEBHOOK_SECRET")) {
      return json({ ok: false, error: "Unauthorized" });
    }
    if (!ALLOWED_SHEETS.has(body.sheetName) || body.spreadsheetId !== SPREADSHEET_ID) {
      return json({ ok: false, error: "Invalid sync target" });
    }
    const lock = LockService.getScriptLock();
    lock.waitLock(20000);
    try {
      const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(body.sheetName);
      if (!sheet) return json({ ok: false, error: "Unknown sheet" });
      if (body.action === "ensure_headers") {
        if (!Array.isArray(body.headers) || !body.headers.length) return json({ ok: false, error: "Headers required" });
        if (sheet.getLastRow() === 0) sheet.getRange(1, 1, 1, body.headers.length).setValues([body.headers]);
        return json({ ok: true });
      }
      if (body.action !== "upsert" || typeof body.stableId !== "string" || !Array.isArray(body.values)) {
        return json({ ok: false, error: "Invalid upsert request" });
      }
      const lastRow = sheet.getLastRow();
      const ids = lastRow > 1 ? sheet.getRange(2, 1, lastRow - 1, 1).getDisplayValues().flat() : [];
      const existing = ids.indexOf(body.stableId);
      const rowNumber = existing >= 0 ? existing + 2 : Math.max(2, lastRow + 1);
      sheet.getRange(rowNumber, 1, 1, body.values.length).setValues([body.values]);
      return json({ ok: true, rowNumber: rowNumber });
    } finally {
      lock.releaseLock();
    }
  } catch (error) {
    return json({ ok: false, error: error && error.message ? error.message : "Apps Script sync failed" });
  }
}

function json(value) {
  return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);
}
