import * as api from "./api.js";
import { getDownloadUploads, getDownloadUrl } from "./downloads.js";
import { ItchError, assertResponse, readJson } from "./errors.js";
import { ItchTransport } from "./http.js";
import { parseBrowsePage } from "./parsers/browse.js";
import { parseFeed } from "./parsers/feed.js";
import { parseGame } from "./parsers/game.js";
import { parseProfile } from "./parsers/profile.js";
import { ITCH_BROWSE_PAGES } from "./routes.js";
import { assertItchUrl, normalizeProfileUrl, validateGameUrl } from "./urls.js";

const FEEDS = Object.freeze({
  new: "https://itch.io/feed/new.xml",
  featured: "https://itch.io/feed/featured.xml",
  sales: "https://itch.io/feed/sales.xml",
});

export class ItchClient {
  constructor(options = {}) {
    const { apiKey, accessToken, token, ...transportOptions } = options;
    this.apiKey = accessToken || token || apiKey;
    this.transport = new ItchTransport(transportOptions);
  }

  request(url, options) {
    return this.transport.request(url, options);
  }

  async getGame(gameValue, { signal } = {}) {
    const url = validateGameUrl(gameValue);
    const response = assertResponse(await this.request(url, { signal }), "Itch.io game page failed", url);
    return parseGame(await response.text(), response.url || url.href);
  }

  async getUploads(gameUrl, options) {
    return (await this.getGame(gameUrl, options)).uploads;
  }

  getDownloadUploads(gameUrl, options) {
    return getDownloadUploads(this, gameUrl, options);
  }

  getDownloadUrl(gameUrl, uploadId, options) {
    return getDownloadUrl(this, gameUrl, uploadId, options);
  }

  async getComments(gameUrl, options) {
    return (await this.getGame(gameUrl, options)).comments;
  }

  async getProfile(profile, { signal } = {}) {
    const url = normalizeProfileUrl(profile);
    const response = assertResponse(await this.request(url, { signal }), "Itch.io profile page failed", url);
    return parseProfile(await response.text(), response.url || url.href);
  }

  async getBrowsePage(section = "games", { query, page, params = {}, signal } = {}) {
    const route = ITCH_BROWSE_PAGES[section] || section;
    let url;
    try {
      url = /^https:\/\//i.test(route) ? new URL(route) : new URL(route, "https://itch.io");
    } catch (cause) {
      throw new ItchError("Expected a valid itch.io route or URL", { code: "ITCH_INVALID_URL", cause });
    }
    assertItchUrl(url, { allowSubdomains: false });
    if (query !== undefined && query !== null) url.searchParams.set("q", String(query));
    if (page !== undefined && page !== null) url.searchParams.set("page", String(page));
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null) continue;
      url.searchParams.delete(key);
      for (const item of Array.isArray(value) ? value : [value]) url.searchParams.append(key, String(item));
    }
    const response = assertResponse(
      await this.request(url, { signal }),
      "Itch.io browse request failed",
      url,
    );
    return parseBrowsePage(await response.text(), url.href);
  }

  searchGames(query, { page = 1, signal, ...params } = {}) {
    return this.getBrowsePage("search", { query, page, params, signal });
  }

  async getSuggestions(query, { signal } = {}) {
    const url = new URL("https://itch.io/autocomplete");
    url.searchParams.set("query", String(query));
    const response = assertResponse(
      await this.request(url, { signal, headers: { Accept: "application/json" } }),
      "Itch.io suggestions request failed",
      url,
    );
    return readJson(response, "Itch.io suggestions returned invalid JSON", url);
  }

  async getFeed(feed = "new", { signal } = {}) {
    let url;
    try {
      const browseRoute = ITCH_BROWSE_PAGES[feed];
      const source = FEEDS[feed] || (browseRoute ? `${browseRoute}.xml` : feed);
      url = /^https:\/\//i.test(source) ? new URL(source) : new URL(source, "https://itch.io");
    } catch (cause) {
      throw new ItchError("Expected an itch.io feed name or URL", { code: "ITCH_INVALID_URL", cause });
    }
    assertItchUrl(url);
    if (!url.pathname.endsWith(".xml"))
      throw new ItchError("Expected an itch.io RSS feed URL ending in .xml", {
        url: url.href,
        code: "ITCH_INVALID_URL",
      });
    const response = assertResponse(
      await this.request(url, {
        signal,
        headers: { Accept: "application/rss+xml, application/xml, text/xml" },
      }),
      "Itch.io feed request failed",
      url,
    );
    return parseFeed(await response.text(), feed, url.href);
  }

  apiRequest(path, options) {
    return api.apiRequest(this, path, options);
  }

  getApiCredentials(options) {
    return api.getApiCredentials(this, options);
  }

  getApiProfile(options) {
    return this.apiRequest("profile", options);
  }

  getDeveloperGames(options) {
    return this.apiRequest("profile/games", options);
  }

  getApiUploads(gameId, options) {
    api.validateApiId(gameId, "gameId");
    return this.apiRequest(`games/${encodeURIComponent(gameId)}/uploads`, options);
  }

  getApiDownloadUrl(uploadId, options) {
    api.validateApiId(uploadId, "uploadId");
    return this.apiRequest(`uploads/${encodeURIComponent(uploadId)}/download`, options);
  }

  getGameDownloadKey(gameId, options) {
    return api.getGameDownloadKey(this, gameId, options);
  }

  getGamePurchases(gameId, options) {
    return api.getGamePurchases(this, gameId, options);
  }

  getClaimedRewards(gameId, options) {
    return api.getClaimedRewards(this, gameId, options);
  }

  getAllClaimedRewards(gameId, options) {
    return api.getAllClaimedRewards(this, gameId, options);
  }

  checkGameOwnership(gameId, options) {
    return api.checkGameOwnership(this, gameId, options);
  }

  getCollections(options) {
    return api.getCollections(this, options);
  }

  getCollection(collectionId, options) {
    return api.getCollection(this, collectionId, options);
  }

  getCollectionGames(collectionId, options) {
    return api.getCollectionGames(this, collectionId, options);
  }

  getAllCollectionGames(collectionId, options) {
    return api.getAllCollectionGames(this, collectionId, options);
  }

  createCollection(collection, options) {
    return api.createCollection(this, collection, options);
  }

  updateCollection(collectionId, collection, options) {
    return api.updateCollection(this, collectionId, collection, options);
  }

  deleteCollection(collectionId, options) {
    return api.deleteCollection(this, collectionId, options);
  }

  addGameToCollection(collectionId, game, options) {
    return api.addGameToCollection(this, collectionId, game, options);
  }

  removeGameFromCollection(collectionId, gameId, options) {
    return api.removeGameFromCollection(this, collectionId, gameId, options);
  }

  updateCollectionGame(collectionId, gameId, game, options) {
    return api.updateCollectionGame(this, collectionId, gameId, game, options);
  }

  orderCollection(collectionId, order, options) {
    return api.orderCollection(this, collectionId, order, options);
  }

  getLatestVersion(options) {
    return api.getLatestVersion(this, options);
  }

  getOwnedKeys({ page = 1, perPage = 500, gameIds, ...options } = {}) {
    if (!Number.isSafeInteger(page) || page < 1) throw new TypeError("page must be a positive integer");
    if (!Number.isSafeInteger(perPage) || perPage < 1 || perPage > 500) {
      throw new TypeError("perPage must be an integer between 1 and 500");
    }
    api.validateGameIds(gameIds);
    return this.apiRequest("profile/owned-keys", {
      query: { page, per_page: perPage, game_ids: gameIds },
      ...options,
    });
  }

  getAllOwnedKeys(options) {
    return api.getAllOwnedKeys(this, options);
  }
}
