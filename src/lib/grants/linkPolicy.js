const DEFAULT_VERIFY_URL = "https://grantedai.com/grants";

export function isValidHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function getGrantedVerifyUrl(title) {
  const base = import.meta.env.VITE_GRANTED_VERIFY_URL || DEFAULT_VERIFY_URL;
  const url = new URL(base);

  if (title) {
    url.searchParams.set("q", title);
  }

  return url.toString();
}

export function isDirectGrantSourceUrl(value) {
  if (!isValidHttpUrl(value)) return false;

  const url = new URL(value);
  const hostname = url.hostname.toLowerCase();
  const pathname = url.pathname.toLowerCase();

  const trustedHost =
    hostname.endsWith(".gov") ||
    hostname.includes("grants.gov") ||
    hostname.includes("hrsa.gov") ||
    hostname.includes("cdc.gov") ||
    hostname.includes("samhsa.gov") ||
    hostname.includes("rwjf.org") ||
    hostname.includes("nih.gov");

  const genericPath = pathname === "/" || pathname === "";

  return trustedHost && !genericPath;
}
