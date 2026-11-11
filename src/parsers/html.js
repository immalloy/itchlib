import { load } from "cheerio";

export function parseHtml(markup, options = {}) {
  return load(String(markup ?? ""), { decodeEntities: true, ...options });
}

export function textOf(element) {
  if (!element?.length) return "";
  const copy = element.clone();
  copy.find("script, style, template").remove();
  return copy.text().replace(/\s+/g, " ").trim();
}

export function absoluteUrl(value, base) {
  if (typeof value !== "string" || !value.trim() || /^(?:data|javascript|mailto|tel):/i.test(value.trim()))
    return null;
  try {
    const url = new URL(value, base);
    return ["https:", "http:"].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}

function linkUrl(value, base) {
  if (typeof value !== "string" || !value.trim()) return null;
  const trimmed = value.trim();
  if (/^(?:mailto|tel|itch):/i.test(trimmed)) return trimmed;
  return absoluteUrl(trimmed, base);
}

export function findMeta($, key) {
  const wanted = key.toLowerCase();
  let result = "";
  $("meta[property], meta[name], meta[itemprop]").each((_, element) => {
    const meta = $(element);
    const name = (meta.attr("property") || meta.attr("name") || meta.attr("itemprop") || "").toLowerCase();
    if (!result && name === wanted) result = meta.attr("content") || "";
  });
  return result;
}

export function readLinks($, scope, base) {
  const links = [];
  const seen = new Set();
  scope.find("a[href]").each((_, element) => {
    const anchor = $(element);
    const url = linkUrl(anchor.attr("href"), base);
    if (!url) return;
    const text = textOf(anchor);
    const title = anchor.attr("title");
    const key = `${url}\n${text}\n${title || ""}`;
    if (seen.has(key)) return;
    seen.add(key);
    links.push({ url, text, ...(title ? { title } : {}) });
  });
  return links;
}

export function imageUrls($, scope, base) {
  const urls = [];
  scope
    .find('a[data-image_lightbox="true"][href]')
    .each((_, el) => urls.push(absoluteUrl($(el).attr("href"), base)));
  scope.find("img").each((_, el) => {
    const img = $(el);
    const source = img.attr("src") || img.attr("data-src") || img.attr("data-original") || img.attr("poster");
    if (source) urls.push(absoluteUrl(source, base));
    const srcset = img.attr("srcset") || img.attr("data-srcset") || img.attr("data-lazy_srcset");
    if (srcset)
      for (const candidate of srcset.split(","))
        urls.push(absoluteUrl(candidate.trim().split(/\s+/)[0], base));
  });
  return unique(urls);
}

export function videoUrls($, scope, base) {
  const urls = [];
  scope.find("video, source").each((_, el) => {
    const node = $(el);
    const value = node.attr("src") || node.attr("data-src") || node.attr("data-video-url");
    const url = absoluteUrl(value, base);
    if (
      url &&
      (el.tagName === "video" ||
        /video\//i.test(node.attr("type") || "") ||
        /\.(?:mp4|webm|mov|m4v)(?:$|\?)/i.test(url))
    )
      urls.push(url);
  });
  scope.find("iframe").each((_, el) => {
    const url = absoluteUrl($(el).attr("src") || $(el).attr("data-src"), base);
    if (
      url &&
      /(?:youtube(?:-nocookie)?\.com|youtu\.be|vimeo\.com|dailymotion\.com|player\.twitch\.tv|streamable\.com)/i.test(
        url,
      )
    )
      urls.push(url);
  });
  return unique(urls);
}

export function embedUrls($, scope, base) {
  const urls = [];
  scope
    .find("iframe")
    .each((_, el) => urls.push(absoluteUrl($(el).attr("src") || $(el).attr("data-src"), base)));
  return unique(urls);
}

export function unique(values) {
  return [...new Set(values.filter(Boolean))];
}
