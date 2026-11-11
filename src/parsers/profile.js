import { absoluteUrl, findMeta, parseHtml, readLinks, textOf } from "./html.js";
import { parseGameCards } from "./cards.js";

export function parseProfile(markup, pageUrl) {
  const $ = parseHtml(markup);
  const canonicalUrl = new URL(pageUrl);
  const title = findMeta($, "og:title") || textOf($("h1").first()) || textOf($("title").first());
  const avatarNode = $(".user_avatar img, .user_cover img, .user_avatar, .user_cover").first();
  const styleUrl = avatarNode.attr("style")?.match(/url\(["']?([^"')]+)["']?\)/i)?.[1];
  const avatar = absoluteUrl(
    findMeta($, "og:image") || avatarNode.attr("src") || avatarNode.attr("data-src") || styleUrl,
    canonicalUrl,
  );
  const bioNode = $(".user_bio").first();
  const description = findMeta($, "og:description") || textOf(bioNode);
  const itchPath = findMeta($, "itch:path");
  const profilePathUserId = itchPath.match(/users\/(\d+)/)?.[1];
  const username = canonicalUrl.hostname.endsWith(".itch.io")
    ? canonicalUrl.hostname.slice(0, -".itch.io".length)
    : canonicalUrl.pathname.split("/").filter(Boolean).at(-1) || null;

  return {
    id: Number(profilePathUserId) || null,
    username,
    displayName: title.replace(/\s*(?:\||-)\s*itch\.io\s*$/i, "") || username || "",
    url: canonicalUrl.href,
    avatar,
    bio: description,
    bioHtml: bioNode.html()?.trim() || null,
    links: readLinks($, $(".user_links").first(), canonicalUrl),
    games: parseGameCards(markup, canonicalUrl),
  };
}
