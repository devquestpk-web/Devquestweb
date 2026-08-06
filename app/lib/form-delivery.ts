export async function deliverWebsiteForm(
  formType: "contact" | "ambassador",
  fields: Record<string, string>,
  website = "",
) {
  const response = await fetch("/api/forms", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ formType, fields, website }),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || "We could not send your form. Please try again.");
}
