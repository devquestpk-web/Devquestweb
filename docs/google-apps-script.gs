const SPREADSHEET_ID = "16h2Dcef7-F8ZN049pOqjCNxbAl9xYX46kl_0pEX9EV0";
const UPLOAD_FOLDER_ID = "1F0qlB6SysyEzu982eL7G7glAcQ7nebde";
const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024;
const ALLOWED_ATTACHMENT_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/octet-stream",
];

const FORM_CONFIGS = {
  contact: {
    sheetName: "Website Queries",
    phoneColumn: 5,
    columnWidths: [155, 245, 175, 230, 145, 220, 175, 165, 420, 300],
    wrappedColumns: [9, 10],
    headers: [
      "Submitted At", "Submission ID", "Name", "Email", "Phone",
      "Company / University", "Enquiry Type", "Estimated Budget",
      "Query Details", "Source Page",
    ],
    values: (fields) => [
      fields.name || fields.fullName,
      fields.email,
      normalizePhone_(fields.phone),
      fields.companyOrUniversity,
      fields.enquiryType || "General enquiry",
      fields.estimatedBudget,
      fields.enquiryDetails || fields.enquiry,
    ],
  },
  ambassador: {
    sheetName: "Campus Ambassadors",
    phoneColumn: 5,
    documentColumn: 16,
    hiddenColumns: [15],
    columnWidths: [155, 245, 180, 230, 145, 125, 220, 180, 155, 240, 175, 330, 380, 380, 210, 190, 300],
    wrappedColumns: [11, 12, 13, 14, 15, 16, 17],
    headers: [
      "Submitted At", "Submission ID", "Full Name", "Email", "WhatsApp", "City",
      "University / Institute", "Degree / Program", "Current Semester", "LinkedIn",
      "Weekly Availability", "Relevant Experience", "Motivation", "Campus Initiative",
      "CV Filename", "CV Document", "Source Page",
    ],
    values: (fields, documentUrl) => [
      fields.fullName,
      fields.email,
      normalizePhone_(fields.whatsapp),
      fields.city,
      fields.university,
      fields.degreeOrProgram,
      fields.currentSemester,
      fields.linkedIn,
      fields.weeklyAvailability,
      fields.relevantExperience,
      fields.motivation,
      fields.campusInitiative,
      fields.cvAttachment,
      documentUrl,
    ],
  },
  career: {
    sheetName: "Job Applications",
    phoneColumn: 6,
    documentColumn: 18,
    hiddenColumns: [17],
    columnWidths: [155, 245, 225, 180, 230, 145, 125, 220, 180, 165, 240, 240, 360, 360, 175, 380, 210, 190, 300],
    wrappedColumns: [13, 14, 15, 16, 17, 18, 19],
    headers: [
      "Submitted At", "Submission ID", "Position", "Full Name", "Email", "WhatsApp",
      "City", "University / Institute", "Degree / Program", "Education Status", "LinkedIn",
      "Portfolio / GitHub", "Technical Skills", "Relevant Experience", "Weekly Availability",
      "Introduction", "CV Filename", "CV Document", "Source Page",
    ],
    values: (fields, documentUrl) => [
      fields.position,
      fields.fullName,
      fields.email,
      normalizePhone_(fields.whatsapp),
      fields.city,
      fields.universityOrInstitute,
      fields.degreeOrProgram,
      fields.educationStatus,
      fields.linkedIn,
      fields.portfolioOrGitHub,
      fields.technicalSkills,
      fields.relevantExperience,
      fields.weeklyAvailability,
      fields.introduction,
      fields.cvAttachment,
      documentUrl,
    ],
  },
};

function doPost(event) {
  try {
    const expectedSecret = PropertiesService.getScriptProperties().getProperty("WEBHOOK_SECRET");
    const payload = JSON.parse(event.postData.contents || "{}");

    if (!expectedSecret || payload.secret !== expectedSecret) {
      return jsonResponse_({ ok: false, error: "Unauthorized" });
    }

    const submission = payload.submission || {};
    const configuration = FORM_CONFIGS[submission.formType];
    const submissionId = safeCell_(submission.submissionId);
    if (!configuration || !submissionId) {
      return jsonResponse_({ ok: false, error: "Invalid form submission" });
    }

    const lock = LockService.getScriptLock();
    lock.waitLock(10000);

    try {
      const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
      const sheet = spreadsheet.getSheetByName(configuration.sheetName)
        || spreadsheet.insertSheet(configuration.sheetName);

      if (sheet.getLastRow() === 0) {
        sheet.appendRow(configuration.headers);
      }

      prepareSheet_(sheet, configuration);

      if (hasSubmission_(sheet, submissionId)) {
        return jsonResponse_({ ok: true, duplicate: true });
      }

      const submittedAt = new Date(submission.submittedAt || Date.now());
      const fields = submission.fields || {};
      const documentUrl = submission.attachment
        ? saveAttachment_(submission.attachment, submissionId)
        : "";
      sheet.appendRow([
        Number.isNaN(submittedAt.getTime()) ? new Date() : submittedAt,
        submissionId,
        ...configuration.values(fields, documentUrl).map(safeCell_),
        safeCell_(submission.sourcePage),
      ]);

      const submittedRow = sheet.getLastRow();
      sheet.setRowHeight(submittedRow, 96);

      if (documentUrl && configuration.documentColumn) {
        const documentLabel = safeCell_(fields.cvAttachment) || "Open document";
        const linkedDocument = SpreadsheetApp.newRichTextValue()
          .setText(documentLabel)
          .setLinkUrl(documentUrl)
          .build();
        sheet.getRange(submittedRow, configuration.documentColumn).setRichTextValue(linkedDocument);
      }

      return jsonResponse_({ ok: true, sheet: configuration.sheetName });
    } finally {
      lock.releaseLock();
    }
  } catch (error) {
    console.error(error);
    return jsonResponse_({ ok: false, error: "Could not save form submission" });
  }
}

function prepareSheet_(sheet, configuration) {
  const columnCount = configuration.headers.length;
  const rowCount = Math.max(sheet.getMaxRows() - 1, 1);
  const header = sheet.getRange(1, 1, 1, columnCount);

  sheet.setFrozenRows(1);
  sheet.setRowHeight(1, 46);
  header
    .setBackground("#061326")
    .setFontColor("#ffffff")
    .setFontWeight("bold")
    .setHorizontalAlignment("center")
    .setVerticalAlignment("middle")
    .setWrapStrategy(SpreadsheetApp.WrapStrategy.WRAP);

  configuration.columnWidths.forEach((width, index) => {
    sheet.setColumnWidth(index + 1, width);
  });

  sheet
    .getRange(2, 1, rowCount, columnCount)
    .setVerticalAlignment("top")
    .setWrapStrategy(SpreadsheetApp.WrapStrategy.CLIP);
  sheet
    .getRange(2, 1, rowCount, 1)
    .setNumberFormat("dd mmm yyyy, hh:mm")
    .setHorizontalAlignment("center");
  sheet
    .getRange(2, configuration.phoneColumn, rowCount, 1)
    .setNumberFormat("@");

  configuration.wrappedColumns.forEach((column) => {
    sheet
      .getRange(2, column, rowCount, 1)
      .setVerticalAlignment("top")
      .setWrapStrategy(SpreadsheetApp.WrapStrategy.WRAP);
  });

  (configuration.hiddenColumns || []).forEach((column) => sheet.hideColumns(column));

  if (!sheet.getFilter()) {
    sheet.getRange(1, 1, sheet.getMaxRows(), columnCount).createFilter();
  }
}

function normalizePhone_(value) {
  const original = String(value || "").trim();
  let digits = original.replace(/\D/g, "");

  if (digits.startsWith("0092")) digits = digits.slice(4);
  else if (digits.startsWith("92")) digits = digits.slice(2);
  else if (digits.startsWith("0")) digits = digits.slice(1);

  if (/^3\d{9}$/.test(digits)) {
    return `+92 ${digits.slice(0, 3)} ${digits.slice(3)}`;
  }

  return original;
}

function saveAttachment_(attachment, submissionId) {
  const contentType = String(attachment.contentType || "application/octet-stream");
  if (!ALLOWED_ATTACHMENT_TYPES.includes(contentType)) {
    throw new Error("Unsupported attachment type");
  }

  const bytes = Utilities.base64Decode(String(attachment.base64 || ""));
  if (!bytes.length || bytes.length > MAX_ATTACHMENT_BYTES) {
    throw new Error("Invalid attachment size");
  }

  const filename = safeFilename_(attachment.filename);
  const storedFilename = `${submissionId}-${filename}`;
  const folder = DriveApp.getFolderById(UPLOAD_FOLDER_ID);
  const existingFiles = folder.getFilesByName(storedFilename);
  if (existingFiles.hasNext()) return existingFiles.next().getUrl();

  const blob = Utilities.newBlob(bytes, contentType, storedFilename);
  return folder.createFile(blob).getUrl();
}

function safeFilename_(filename) {
  const cleaned = String(filename || "")
    .replace(/[^a-zA-Z0-9._() -]/g, "_")
    .slice(0, 120);
  return cleaned || "application-cv.pdf";
}

function hasSubmission_(sheet, submissionId) {
  const dataRows = sheet.getLastRow() - 1;
  if (dataRows <= 0) return false;

  return Boolean(
    sheet
      .getRange(2, 2, dataRows, 1)
      .createTextFinder(submissionId)
      .matchEntireCell(true)
      .findNext(),
  );
}

function safeCell_(value) {
  const text = String(value || "").trim().slice(0, 20000);
  return /^[=+\-@]/.test(text) ? `'${text}` : text;
}

function jsonResponse_(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
