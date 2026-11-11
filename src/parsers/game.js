import {
  absoluteUrl,
  embedUrls,
  findMeta,
  imageUrls,
  parseHtml,
  readLinks,
  textOf,
  unique,
  videoUrls,
} from "./html.js";

function parseDetails($, baseUrl) {
  const details = [];
  $(".game_info_panel_widget tr").each((_, row) => {
    const cells = $(row).children("th, td");
    if (cells.length < 2) return;
    const label = textOf(cells.first())
      .replace(/\s*\|\s*$/, "")
      .trim();
    if (!label) return;
    const values = cells.slice(1);
    details.push({ label, text: textOf(values), links: readLinks($, values, baseUrl) });
  });
  return details;
}

function parseSize(value) {
  const match = String(value || "").match(/([\d.]+)\s*(B|KB|MB|GB|TB)\b/i);
  if (!match) return 0;
  const units = { B: 1, KB: 1024, MB: 1024 ** 2, GB: 1024 ** 3, TB: 1024 ** 4 };
  return Math.round(Number(match[1]) * units[match[2].toUpperCase()]);
}

export function parseUploads(markup) {
  const $ = parseHtml(markup);
  const uploads = [];
  $(".upload").each((_, element) => {
    const row = $(element);
    const nameNode = row.find(".name").first();
    const name = textOf(nameNode);
    if (!name) return;
    const id =
      row.attr("data-upload_id") ||
      row.attr("data-upload-id") ||
      row.find('[name="upload_id"]').attr("value") ||
      null;
    const size = textOf(row.find(".file_size").first());
    const version = textOf(row).match(/\bVersion\s+([\d][\w.-]*)/i)?.[1] || null;
    const platforms = [];
    row.find(".download_platforms [title]").each((__, platform) => platforms.push($(platform).attr("title")));
    uploads.push({
      id: id && /^\d+$/.test(id) ? id : null,
      name,
      filename: nameNode.attr("title") || name,
      size: parseSize(size),
      version,
      platforms: unique(platforms),
    });
  });
  return uploads;
}

function parseComments($, baseUrl) {
  const comments = [];
  $(".community_post").each((_, element) => {
    const post = $(element);
    const rawData = post.attr("data-post") || "{}";
    let postData = {};
    try {
      postData = JSON.parse(rawData);
    } catch {
      /* Some page versions provide non-JSON values. */
    }
    const id = post.attr("id")?.match(/post-(\d+)/)?.[1] || post.attr("data-post_id") || null;
    const authorLink = post.find(".post_author a, a.user_name").first();
    const author = textOf(authorLink) || null;
    const authorUrl = absoluteUrl(authorLink.attr("href"), baseUrl);
    const date = post.find(".post_date").first();
    const createdAt =
      date.attr("title") || date.find("time").attr("datetime") || date.attr("datetime") || null;
    const body = post.find(".post_body, .community_post_body, .community_post_content").first();
    const text = textOf(body.length ? body : post);
    if (!text) return;
    const postUrl = absoluteUrl(date.find("a[href]").first().attr("href"), baseUrl);
    comments.push({
      id,
      userId: Number(postData.user_id) || null,
      isReply: post.hasClass("is_reply"),
      author,
      authorUrl,
      createdAt,
      text,
      html: body.length ? body.html() : null,
      url: postUrl,
    });
  });
  return comments;
}

export function parseGame(markup, pageUrl) {
  const $ = parseHtml(markup);
  const metaTitle = findMeta($, "og:title");
  const metaDescription = findMeta($, "og:description") || findMeta($, "description");
  const title = metaTitle || textOf($(".game_title").first()) || textOf($("title").first());
  const descriptionNode = $(".formatted_description").first();
  const description = metaDescription || textOf(descriptionNode);
  const descriptionHtml = descriptionNode.html()?.trim() || null;
  const authorLink = $("a.user_name").first();
  const author = textOf(authorLink) || null;
  const authorUrl = absoluteUrl(authorLink.attr("href"), pageUrl);
  const screenshotContainer = $(".screenshot_list").first();
  const screenshotSource = screenshotContainer.length ? screenshotContainer : $("body");
  const images = unique([
    absoluteUrl(findMeta($, "og:image"), pageUrl),
    ...imageUrls($, screenshotSource, pageUrl),
  ]);
  const details = parseDetails($, pageUrl);
  const detail = (label) => details.find((item) => item.label.toLowerCase() === label.toLowerCase());
  const purchase = $("a.buy_btn, a.donate_btn").first();
  const itchPath = findMeta($, "itch:path");
  const numericGameId = itchPath.match(/(?:^|\/)games\/(\d+)/)?.[1];
  const cleanedTitle = String(title).replace(/\s+/g, " ").trim();
  const authors = detail("Authors")?.links || (author ? [{ url: authorUrl, text: author }] : []);
  const tags = detail("Tags")?.links || [];
  const uploads = parseUploads(markup);

  return {
    id: numericGameId ? Number(numericGameId) : null,
    slug: new URL(pageUrl).pathname.replace(/\/$/, "").split("/").pop() || null,
    url: new URL(pageUrl).href,
    title: cleanedTitle,
    author,
    authorUrl,
    authors,
    description,
    descriptionHtml,
    cover: images[0] || null,
    images,
    screenshots: images.slice(1),
    videos: videoUrls($, $("body"), pageUrl),
    embeds: embedUrls($, $("body"), pageUrl),
    links: readLinks($, $("body"), pageUrl),
    price: textOf($(".buy_message").first()) || null,
    purchase: purchase.length
      ? {
          url: absoluteUrl(purchase.attr("href"), pageUrl),
          label: textOf(purchase),
        }
      : null,
    details,
    status: detail("Status")?.text || null,
    pagePlatforms: detail("Platforms")?.links || [],
    genres: detail("Genre")?.links || [],
    tags,
    madeWith: detail("Made with")?.links || [],
    languages: detail("Languages")?.links || [],
    inputs: detail("Inputs")?.links || [],
    accessibility: detail("Accessibility")?.links || [],
    developmentLogs: readLinks($, $(".devlog_list").first(), pageUrl),
    comments: parseComments($, pageUrl),
    uploads,
  };
}
