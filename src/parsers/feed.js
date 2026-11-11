import { load } from "cheerio";
import { parseHtml, textOf } from "./html.js";

function elementText($, scope, name) {
  const localName = name.includes(":") ? name.split(":").at(-1) : name;
  let value;
  scope.find("*").each((_, element) => {
    if (!value && element.name?.split(":").at(-1)?.toLowerCase() === localName.toLowerCase()) {
      value = textOf($(element));
    }
  });
  return value || "";
}

export function parseFeed(markup, feed, url) {
  const $ = load(String(markup ?? ""), { xmlMode: true, decodeEntities: true });
  const items = [];
  $("item").each((_, element) => {
    const item = $(element);
    const field = (selector, fallbackName = selector) =>
      textOf(item.find(selector).first()) || elementText($, item, fallbackName);
    items.push({
      title: field("title"),
      url: field("link"),
      description: textOf(parseHtml(field("description"))("body")),
      publishedAt: field("pubDate"),
      author: field("dc\\:creator", "dc:creator") || null,
    });
  });
  return { feed, url, items };
}
