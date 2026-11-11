import { ItchError } from "./errors.js";

export function validateGameUrl(value) {
  let url;
  try {
    url = new URL(value);
  } catch (cause) {
    throw new ItchError("Expected a valid itch.io game URL", { code: "ITCH_INVALID_URL", cause });
  }
  if (
    url.protocol !== "https:" ||
    !/(^|\.)itch\.io$/i.test(url.hostname) ||
    url.hostname.toLowerCase() === "itch.io"
  ) {
    throw new ItchError("Expected an HTTPS game page on an itch.io subdomain", {
      url: url.href,
      code: "ITCH_INVALID_URL",
    });
  }
  return url;
}

export function normalizeProfileUrl(profile) {
  if (typeof profile !== "string" || !profile.trim()) {
    throw new TypeError("profile must be a username or itch.io profile URL");
  }
  if (/^https?:\/\//i.test(profile)) {
    let url;
    try {
      url = new URL(profile);
    } catch (cause) {
      throw new ItchError("Expected a valid itch.io profile URL", { code: "ITCH_INVALID_URL", cause });
    }
    if (url.protocol !== "https:" || !/(^|\.)itch\.io$/i.test(url.hostname)) {
      throw new ItchError("Only HTTPS itch.io profile URLs are supported", {
        url: url.href,
        code: "ITCH_INVALID_URL",
      });
    }
    return url;
  }
  if (profile.includes("/") || /[?#\s]/.test(profile))
    throw new ItchError("Expected a username or an itch.io profile URL", { code: "ITCH_INVALID_URL" });
  return new URL(`https://itch.io/profile/${encodeURIComponent(profile)}`);
}

export function resolveGamePath(pageUrl, path) {
  const page = new URL(pageUrl.href);
  page.pathname = `${page.pathname.replace(/\/$/, "")}/`;
  page.search = "";
  page.hash = "";
  return new URL(`./${path}`, page);
}

export function assertItchUrl(value, { allowSubdomains = false } = {}) {
  let url;
  try {
    url = new URL(value);
  } catch (cause) {
    throw new ItchError("Expected an HTTPS itch.io URL", { code: "ITCH_INVALID_URL", cause });
  }
  const validHost = allowSubdomains
    ? /(^|\.)itch\.io$/i.test(url.hostname)
    : url.hostname.toLowerCase() === "itch.io";
  if (url.protocol !== "https:" || !validHost) {
    throw new ItchError("URL must target HTTPS itch.io", { url: url.href, code: "ITCH_INVALID_URL" });
  }
  return url;
}
