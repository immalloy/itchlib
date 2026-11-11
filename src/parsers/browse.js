import { absoluteUrl, parseHtml, readLinks, textOf } from "./html.js";
import { parseGameCards } from "./cards.js";

function parseFilterPickers($, baseUrl) {
  const pickers = [];
  $(".filter_picker_widget").each((_, element) => {
    const picker = $(element);
    const options = [];
    picker.find(".filter_option").each((__, optionElement) => {
      const option = $(optionElement);
      options.push({
        label: textOf(option),
        url: absoluteUrl(option.attr("href"), baseUrl),
        value: option.attr("data-value") || null,
        selected: option.hasClass("selected"),
      });
    });
    if (options.length)
      pickers.push({
        id: picker.attr("id") || null,
        selected: textOf(picker.find(".value_label").first()) || null,
        options,
      });
  });
  return pickers;
}

function parseFilterGroups($, baseUrl) {
  const groups = [];
  $(".browse_filter_group_widget").each((_, element) => {
    const group = $(element);
    const options = [];
    group.find("a[href]").each((__, optionElement) => {
      const option = $(optionElement);
      const href = option.attr("href");
      if (!href || href === "#") return;
      options.push({
        label: textOf(option),
        url: absoluteUrl(href, baseUrl),
        value: option.attr("data-value") || null,
        selected: option.hasClass("selected"),
      });
    });
    const label = textOf(group.find(".filter_group_label").first());
    if (label && options.length) groups.push({ id: group.attr("id") || null, label, options });
  });
  return groups;
}

function parseFacets($, baseUrl) {
  const facets = [];
  $(".facet_group").each((_, element) => {
    const group = $(element);
    const label = textOf(group.find(".facet_group_label").first());
    const values = [];
    group.find("a.facet_value[href]").each((__, valueElement) => {
      const value = $(valueElement);
      const countText = textOf(value.find(".facet_count").first()).replace(/,/g, "");
      values.push({
        label: textOf(value.find(".facet_name").first()) || textOf(value),
        count: Number(countText) || null,
        url: absoluteUrl(value.attr("href"), baseUrl),
      });
    });
    if (label && values.length) facets.push({ label, values });
  });
  return facets;
}

function parseJams($, baseUrl) {
  const jams = [];
  $(".jam_cell").each((_, element) => {
    const cell = $(element);
    const anchor = cell.find("a[href]").first();
    const url = absoluteUrl(anchor.attr("href"), baseUrl);
    if (!url) return;
    const count = textOf(cell.find(".joined_count").first()).match(/[\d,]+/)?.[0];
    jams.push({ title: textOf(anchor), url, joinedCount: count ? Number(count.replace(/,/g, "")) : null });
  });
  return jams;
}

function parseTags($, baseUrl) {
  const tags = [];
  $(".tag_cell").each((_, element) => {
    const cell = $(element);
    const anchor = cell.find(".tag_title[href]").first().length
      ? cell.find(".tag_title[href]").first()
      : cell.find("a[href]").first();
    const url = absoluteUrl(anchor.attr("href"), baseUrl);
    if (!url) return;
    const image = cell.find("img").first();
    tags.push({
      title: textOf(anchor),
      url,
      cover: absoluteUrl(image.attr("src") || image.attr("data-lazy_src"), baseUrl),
      count: textOf(cell.find(".games_count").first()) || null,
      description: textOf(cell.find(".tag_description").first()) || null,
    });
  });
  return tags;
}

function parseBlogPosts($, baseUrl, allLinks) {
  const posts = [];
  $(".post_preview").each((_, element) => {
    const preview = $(element);
    const summaryLink = preview.find("a.summary_link[href]").first();
    const localTitle = preview.find("a.title[href]").first();
    const url = absoluteUrl(localTitle.attr("href") || summaryLink.attr("href"), baseUrl);
    if (!url) return;
    const title =
      textOf(localTitle) ||
      allLinks.find((link) => link.url === url && !/continue reading/i.test(link.text))?.text;
    if (!title) return;
    posts.push({ title, url, summary: textOf(preview.find(".summary_text").first()) || null });
  });
  return posts;
}

function parseDevlogs($, baseUrl) {
  const posts = [];
  $(".post_title").each((_, element) => {
    const anchor = $(element).find("a[href]").first();
    const url = absoluteUrl(anchor.attr("href"), baseUrl);
    const title = textOf(anchor);
    if (url && title) posts.push({ title, url });
  });
  return posts;
}

function parseTopics($, allLinks) {
  const topics = [];
  $(".topic_title").each((_, element) => {
    const title = textOf($(element));
    const link = allLinks.find((candidate) => candidate.text.includes(title) && /\/t\//.test(candidate.url));
    if (title && link) topics.push({ title, url: link.url });
  });
  return topics;
}

function parseCategories($, baseUrl) {
  const categories = [];
  $(".category_row").each((_, element) => {
    const row = $(element);
    const titleLink = row.find(".category_title a[href]").first();
    const url = absoluteUrl(titleLink.attr("href"), baseUrl);
    const title = textOf(titleLink);
    if (!url || !title) return;
    const latestTopicLink = row.find(".last_topic[href], .last_topic a[href]").first();
    const latestTopicUrl = absoluteUrl(latestTopicLink.attr("href"), baseUrl);
    const latestTopicTitle = textOf(latestTopicLink.find(".topic_title").first());
    const topicCount = textOf(row.find(".topics_count").first()).match(/[\d,]+/)?.[0];
    categories.push({
      title,
      url,
      description: textOf(row.find(".short_description").first()) || null,
      topicCount: topicCount ? Number(topicCount.replace(/,/g, "")) : null,
      latestTopic:
        latestTopicUrl && latestTopicTitle
          ? {
              title: latestTopicTitle,
              url: latestTopicUrl,
              author: textOf(row.find(".last_topic_author").first()) || null,
            }
          : null,
    });
  });
  return categories;
}

function parseSales($, baseUrl) {
  const sales = [];
  $(".sale_row").each((_, element) => {
    const row = $(element);
    const titleLink = row.find(".sale_title a[href]").first();
    const url = absoluteUrl(titleLink.attr("href"), baseUrl);
    const title = textOf(titleLink);
    if (!url || !title) return;
    const authorLink = row.find(".sale_author a[href]").first();
    const itemCount = textOf(row.find(".game_count").first()).match(/[\d,]+/)?.[0];
    const endsAt = row.find(".sale_end .date_format").first().attr("title") || null;
    const platforms = [];
    row.find(".game_platforms [title]").each((__, label) => platforms.push($(label).attr("title")));
    sales.push({
      id: row.attr("data-sale_id") || null,
      type: row.attr("data-sale_type") || null,
      title,
      url,
      author: authorLink.length
        ? { url: absoluteUrl(authorLink.attr("href"), baseUrl), text: textOf(authorLink) }
        : null,
      itemCount: itemCount ? Number(itemCount.replace(/,/g, "")) : null,
      endsAt,
      platforms: [...new Set(platforms.filter(Boolean))],
      covers: row
        .find("img.game_thumb")
        .map((__, image) => absoluteUrl($(image).attr("data-lazy_src") || $(image).attr("src"), baseUrl))
        .get()
        .filter(Boolean),
    });
  });
  return sales;
}

export function parseBrowsePage(markup, pageUrl) {
  const $ = parseHtml(markup);
  const allLinks = readLinks($, $("body"), pageUrl);
  const sortRoot = $(".browse_sort_options_widget .sorts").first();
  const mobileSort = $(".sort_options_mobile .filter_option.selected").first();
  const activeButton = sortRoot.find("button.active").first();
  const activeSort = textOf(mobileSort) || textOf(activeButton) || null;
  const sortOptions = readLinks($, sortRoot, pageUrl).map((option) => ({
    ...option,
    selected: option.text === activeSort,
  }));
  if (activeSort && !sortOptions.some((option) => option.selected))
    sortOptions.unshift({ text: activeSort, url: pageUrl, selected: true });
  const countText = textOf($(".game_count").first());
  const nextHref = $("a[rel~='next']").first().attr("href");
  const sales = parseSales($, pageUrl);
  const bundleUrls = new Set(sales.filter((sale) => sale.type === "bundle").map((sale) => sale.url));
  const bundleLinks = allLinks.filter((link) => /\/b\/\d+\//.test(link.url) && !bundleUrls.has(link.url));

  return {
    url: pageUrl,
    title: textOf($("title").first()),
    query: new URL(pageUrl).searchParams.get("q"),
    resultCount: Number(countText.match(/[\d,]+/)?.[0]?.replace(/,/g, "")) || null,
    games: parseGameCards(markup, pageUrl),
    jams: parseJams($, pageUrl),
    categories: parseCategories($, pageUrl),
    tags: parseTags($, pageUrl),
    bundles: [...sales.filter((sale) => sale.type === "bundle"), ...bundleLinks],
    sales,
    devlogs: parseDevlogs($, pageUrl),
    blogPosts: parseBlogPosts($, pageUrl, allLinks),
    topics: parseTopics($, allLinks),
    filters: parseFilterGroups($, pageUrl),
    filterPickers: parseFilterPickers($, pageUrl),
    facets: parseFacets($, pageUrl),
    sortOptions,
    activeSort,
    relatedTags: readLinks($, $(".browse_top_tags").first(), pageUrl),
    nextPageUrl: absoluteUrl(nextHref, pageUrl),
  };
}
