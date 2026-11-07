const codePattern = /^[A-Za-z0-9][A-Za-z0-9-]{3,99}$/;

export function certificateCodeFromInput(input: string, currentOrigin: string): string | null {
  const value = input.trim();
  if (codePattern.test(value)) return value;

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }

  const current = new URL(currentOrigin);
  const isCurrentSite = url.origin === current.origin;
  const isProductionSite = url.protocol === "https:" && ["devquestpk.com", "www.devquestpk.com"].includes(url.hostname.toLowerCase());
  if (!isCurrentSite && !isProductionSite) return null;

  const match = /^\/verify\/([A-Za-z0-9][A-Za-z0-9-]{3,99})\/?$/.exec(url.pathname);
  return match?.[1] ?? null;
}
