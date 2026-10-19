export function escapeMarkup(value: string): string {
  return value.replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]!));
}

export function safeImageUrl(value: string): boolean {
  if (value.startsWith("/manus-storage/") && !value.includes("\\") && !/[\s<>"']/.test(value)) return true;
  try { const url = new URL(value); return url.protocol === "https:" && !url.username && !url.password; } catch { return false; }
}

/** Only the trusted, bundled package markup is used; runtime values are attribute-escaped. */
export function renderPackageMarkup(template: string, images: Record<string, string>): string {
  return template.replace(/\{\{([a-z-]+)\}\}/g, (_, key: string) => {
    const url = images[key];
    return url && safeImageUrl(url) ? escapeMarkup(url) : "";
  });
}
