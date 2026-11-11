import { absoluteUrl, parseHtml, textOf } from "./html.js";

export function parseGameCards(markup, baseUrl) {
  const $ = parseHtml(markup);
  const games = [];
  $(".game_cell").each((_, element) => {
    const card = $(element);
    const anchor = card.find("a.title[href]").first().length
      ? card.find("a.title[href]").first()
      : card.find("a[href]").first();
    const url = absoluteUrl(anchor.attr("href"), baseUrl);
    const image = card.find("img").first();
    const title = textOf(anchor) || image.attr("alt") || "";
    if (!url || !title) return;
    const id = Number(card.attr("data-game_id")) || null;
    const cover = absoluteUrl(
      image.attr("src") || image.attr("data-src") || image.attr("data-lazy_src"),
      baseUrl,
    );
    const description = textOf(card.find(".game_text").first());
    const author = textOf(card.find(".game_author").first());
    const genre = textOf(card.find(".game_genre").first());
    const platforms = textOf(card.find(".game_platform").first());
    games.push({
      id,
      title,
      url,
      cover,
      description: description || null,
      author: author || null,
      genre: genre || null,
      platforms: platforms || null,
    });
  });
  return games;
}
