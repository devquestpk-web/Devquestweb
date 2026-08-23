const googleAppsScriptHost = "script.google.com";
const requestTimeoutMs = 25_000;

export type WebsiteFormType = "contact" | "ambassador" | "career";

export type WebsiteFormSubmission = {
  formType: WebsiteFormType;
  submittedAt: string;
  submissionId: string;
  fields: Record<string, string>;
  sourcePage: string;
  attachment?: {
    filename: string;
    contentType: string;
    base64: string;
  };
};

function getWebhookConfiguration() {
  const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL?.trim();
  const webhookSecret = process.env.GOOGLE_SHEETS_WEBHOOK_SECRET?.trim();

  if (!webhookUrl || !webhookSecret) return null;

  const parsedUrl = new URL(webhookUrl);
  if (parsedUrl.protocol !== "https:" || parsedUrl.hostname !== googleAppsScriptHost || !parsedUrl.pathname.endsWith("/exec")) {
    throw new Error("GOOGLE_SHEETS_WEBHOOK_URL must be a deployed Google Apps Script /exec URL.");
  }

  return { webhookUrl: parsedUrl.toString(), webhookSecret };
}

export async function appendWebsiteFormSubmission(submission: WebsiteFormSubmission) {
  const configuration = getWebhookConfiguration();
  if (!configuration) return { configured: false, synced: false } as const;

  const response = await fetch(configuration.webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=UTF-8" },
    body: JSON.stringify({ secret: configuration.webhookSecret, submission }),
    cache: "no-store",
    redirect: "follow",
    signal: AbortSignal.timeout(requestTimeoutMs),
  });

  if (!response.ok) {
    throw new Error(`Google Sheets webhook returned HTTP ${response.status}.`);
  }

  const result: unknown = await response.json().catch(() => null);
  if (!result || typeof result !== "object" || !("ok" in result) || result.ok !== true) {
    throw new Error("Google Sheets webhook rejected the form submission.");
  }

  return { configured: true, synced: true } as const;
}
