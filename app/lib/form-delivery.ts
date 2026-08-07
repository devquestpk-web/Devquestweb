export async function deliverWebsiteForm(
  formType: "contact" | "ambassador" | "career",
  fields: Record<string, string>,
  website = "",
  attachment?: File,
) {
  const requestBody = attachment
    ? (() => {
        const formData = new FormData();
        formData.append("formType", formType);
        formData.append("fields", JSON.stringify(fields));
        formData.append("website", website);
        formData.append("cv", attachment, attachment.name);
        return formData;
      })()
    : JSON.stringify({ formType, fields, website });

  const response = await fetch("/api/forms", {
    method: "POST",
    headers: attachment ? undefined : { "Content-Type": "application/json" },
    body: requestBody,
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || "We could not send your form. Please try again.");
}
