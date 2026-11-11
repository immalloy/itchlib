import { ItchError, readJson } from "./errors.js";

async function parseApiResponse(response, endpoint, invalidJsonMessage, failureMessage) {
  if (!response.ok) {
    let result = null;
    try {
      result = await response.clone().json();
    } catch {
      // Some edge and rate-limit responses are HTML, even for JSON endpoints.
    }
    throw new ItchError(result?.errors?.join("; ") || `${failureMessage} (HTTP ${response.status})`, {
      status: response.status,
      url: endpoint.href,
      code: "ITCH_HTTP_ERROR",
    });
  }
  const result = await readJson(response, invalidJsonMessage, endpoint);
  if (result?.errors?.length) {
    throw new ItchError(result.errors.join("; "), {
      status: response.status,
      url: endpoint.href,
      code: "ITCH_API_ERROR",
    });
  }
  return result;
}

export async function apiRequest(client, path, { query, method = "GET", body, headers = {}, signal } = {}) {
  if (!client.apiKey)
    throw new ItchError("An itch.io API key is required for this method", { code: "ITCH_AUTH_REQUIRED" });
  const endpoint = new URL(String(path).replace(/^\//, ""), "https://api.itch.io/");
  if (endpoint.hostname !== "api.itch.io" || endpoint.protocol !== "https:") {
    throw new ItchError("API requests must target api.itch.io", {
      url: endpoint.href,
      code: "ITCH_INVALID_URL",
    });
  }
  for (const [key, value] of Object.entries(query || {})) {
    if (value !== undefined && value !== null)
      endpoint.searchParams.set(key, Array.isArray(value) ? value.join(",") : String(value));
  }
  const requestHeaders = { Authorization: `Bearer ${client.apiKey}`, Accept: "application/json", ...headers };
  const requestOptions = { method, headers: requestHeaders, ...(signal ? { signal } : {}) };
  if (body !== undefined) {
    requestOptions.body = new URLSearchParams(
      Object.entries(body)
        .filter(([, value]) => value !== undefined && value !== null)
        .map(([key, value]) => [key, String(value)]),
    );
    requestHeaders["Content-Type"] = "application/x-www-form-urlencoded";
  }
  const response = await client.request(endpoint, requestOptions);
  return parseApiResponse(response, endpoint, "Itch.io API returned invalid JSON", "Itch.io API failed");
}

export function getLatestVersion(client, { channelName, target, gameId, signal } = {}) {
  if (!channelName || (!target && !gameId) || (target && gameId)) {
    throw new TypeError("Provide channelName and exactly one of target or gameId");
  }
  if (gameId !== undefined) validateApiId(gameId, "gameId");
  const endpoint = new URL("https://api.itch.io/wharf/latest");
  endpoint.searchParams.set("channel_name", channelName);
  if (target) endpoint.searchParams.set("target", target);
  if (gameId) endpoint.searchParams.set("game_id", String(gameId));
  return client
    .request(endpoint, { ...(signal ? { signal } : {}), headers: { Accept: "application/json" } })
    .then((response) =>
      parseApiResponse(
        response,
        endpoint,
        "Itch.io version endpoint returned invalid JSON",
        "Itch.io version request failed",
      ),
    );
}

export async function getAllOwnedKeys(client, { perPage = 500, gameIds, signal } = {}) {
  validatePage(perPage, "perPage", 500);
  validateGameIds(gameIds);
  const keys = [];
  for (let page = 1; ; page += 1) {
    const result = await apiRequest(client, "profile/owned-keys", {
      query: { page, per_page: perPage, game_ids: gameIds },
      signal,
    });
    const current = result.owned_keys || [];
    keys.push(...current);
    if (!current.length) return keys;
  }
}

function validatePage(page, name, maximum = Number.MAX_SAFE_INTEGER) {
  if (!Number.isSafeInteger(page) || page < 1 || page > maximum) {
    throw new TypeError(`${name} must be an integer between 1 and ${maximum}`);
  }
}

export function validateApiId(id, name) {
  if (!/^\d+$/.test(String(id ?? ""))) throw new TypeError(`${name} must be a numeric itch.io ID`);
}

export function validateGameIds(gameIds) {
  if (gameIds !== undefined && (!Array.isArray(gameIds) || gameIds.length > 50)) {
    throw new TypeError("gameIds must be an array with no more than 50 IDs");
  }
  for (const gameId of gameIds || []) validateApiId(gameId, "gameId");
}

export function getApiCredentials(client, options) {
  return apiRequest(client, "credentials/info", options);
}

export function getGameDownloadKey(client, gameId, { downloadKey, userId, email, signal } = {}) {
  validateApiId(gameId, "gameId");
  const identifiers = [downloadKey, userId, email].filter(
    (value) => value !== undefined && value !== null && value !== "",
  );
  if (identifiers.length !== 1) {
    throw new TypeError("Provide exactly one of downloadKey, userId, or email");
  }
  return apiRequest(client, `games/${encodeURIComponent(gameId)}/download_keys`, {
    query: { download_key: downloadKey, user_id: userId, email },
    signal,
  });
}

export function getGamePurchases(client, gameId, { userId, email, signal } = {}) {
  validateApiId(gameId, "gameId");
  if (
    (userId === undefined || userId === null || userId === "") ===
    (email === undefined || email === null || email === "")
  ) {
    throw new TypeError("Provide exactly one of userId or email");
  }
  return apiRequest(client, `games/${encodeURIComponent(gameId)}/purchases`, {
    query: { user_id: userId, email },
    signal,
  });
}

export function getClaimedRewards(client, gameId, { page = 1, signal } = {}) {
  validateApiId(gameId, "gameId");
  validatePage(page, "page");
  return apiRequest(client, `games/${encodeURIComponent(gameId)}/claimed-rewards`, {
    query: { page },
    signal,
  });
}

export async function getAllClaimedRewards(client, gameId, { signal } = {}) {
  validateApiId(gameId, "gameId");
  const rewards = [];
  for (let page = 1; ; page += 1) {
    const result = await getClaimedRewards(client, gameId, { page, signal });
    const current = result.claimed_rewards || [];
    rewards.push(...current);
    if (!current.length) return rewards;
  }
}

export function checkGameOwnership(client, gameId, options) {
  validateApiId(gameId, "gameId");
  return apiRequest(client, `games/${encodeURIComponent(gameId)}/ownership`, options);
}

export function getCollections(client, { gameId, signal } = {}) {
  if (gameId !== undefined && gameId !== null) validateApiId(gameId, "gameId");
  return apiRequest(client, "profile/collections", { query: { game_id: gameId }, signal });
}

export function getCollection(client, collectionId, options) {
  validateApiId(collectionId, "collectionId");
  return apiRequest(client, `collections/${encodeURIComponent(collectionId)}`, options);
}

export function getCollectionGames(client, collectionId, { page = 1, perPage = 100, signal } = {}) {
  validateApiId(collectionId, "collectionId");
  validatePage(page, "page");
  validatePage(perPage, "perPage", 500);
  return apiRequest(client, `collections/${encodeURIComponent(collectionId)}/collection-games`, {
    query: { page, per_page: perPage },
    signal,
  });
}

export async function getAllCollectionGames(client, collectionId, { perPage = 100, signal } = {}) {
  validateApiId(collectionId, "collectionId");
  validatePage(perPage, "perPage", 500);
  const games = [];
  for (let page = 1; ; page += 1) {
    const result = await getCollectionGames(client, collectionId, { page, perPage, signal });
    const current = result.collection_games || [];
    games.push(...current);
    if (!current.length) return games;
  }
}

export function createCollection(client, collection, { signal } = {}) {
  return apiRequest(client, "collections", { method: "POST", body: collection, signal });
}

export function updateCollection(client, collectionId, collection, { signal } = {}) {
  validateApiId(collectionId, "collectionId");
  return apiRequest(client, `collections/${encodeURIComponent(collectionId)}`, {
    method: "POST",
    body: collection,
    signal,
  });
}

export function deleteCollection(client, collectionId, options) {
  validateApiId(collectionId, "collectionId");
  return apiRequest(client, `collections/${encodeURIComponent(collectionId)}/delete`, {
    method: "POST",
    ...options,
  });
}

export function addGameToCollection(client, collectionId, { gameId, blurb }, { signal } = {}) {
  validateApiId(collectionId, "collectionId");
  validateApiId(gameId, "gameId");
  return apiRequest(client, `collections/${encodeURIComponent(collectionId)}/add-game`, {
    method: "POST",
    body: { game_id: gameId, blurb },
    signal,
  });
}

export function removeGameFromCollection(client, collectionId, gameId, { signal } = {}) {
  validateApiId(collectionId, "collectionId");
  validateApiId(gameId, "gameId");
  return apiRequest(client, `collections/${encodeURIComponent(collectionId)}/remove-game`, {
    method: "POST",
    body: { game_id: gameId },
    signal,
  });
}

export function updateCollectionGame(client, collectionId, gameId, { blurb }, { signal } = {}) {
  validateApiId(collectionId, "collectionId");
  validateApiId(gameId, "gameId");
  return apiRequest(
    client,
    `collections/${encodeURIComponent(collectionId)}/collection-games/${encodeURIComponent(gameId)}`,
    { method: "POST", body: { blurb }, signal },
  );
}

export function orderCollection(client, collectionId, { gameIds, removeGameIds }, { signal } = {}) {
  validateApiId(collectionId, "collectionId");
  if (!Array.isArray(gameIds) || gameIds.length > 500) {
    throw new TypeError("gameIds must be an array with no more than 500 IDs");
  }
  if (removeGameIds !== undefined && (!Array.isArray(removeGameIds) || removeGameIds.length > 500)) {
    throw new TypeError("removeGameIds must be an array with no more than 500 IDs");
  }
  for (const gameId of gameIds) validateApiId(gameId, "gameId");
  for (const gameId of removeGameIds || []) validateApiId(gameId, "gameId");
  return apiRequest(client, `collections/${encodeURIComponent(collectionId)}/order`, {
    method: "POST",
    body: {
      game_ids: JSON.stringify(gameIds),
      remove_game_ids: removeGameIds === undefined ? undefined : JSON.stringify(removeGameIds),
    },
    signal,
  });
}
