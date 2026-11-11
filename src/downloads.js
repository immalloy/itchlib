import { load } from "cheerio";
import { assertResponse, ItchError, readJson } from "./errors.js";
import { parseUploads } from "./parsers/game.js";
import { resolveGamePath, validateGameUrl } from "./urls.js";

async function getCsrfToken(client, gameUrl, signal) {
  const purchaseUrl = resolveGamePath(gameUrl, "purchase");
  const response = assertResponse(
    await client.request(purchaseUrl, { signal }),
    "Itch.io purchase page failed",
    purchaseUrl,
  );
  const purchaseHtml = await response.text();
  const $ = load(purchaseHtml);
  const token = $('meta[name="csrf_token"]').attr("value") || $('meta[name="csrf_token"]').attr("content");
  if (!token)
    throw new ItchError("Itch.io download token is unavailable", {
      url: purchaseUrl.href,
      code: "ITCH_ACCESS_ERROR",
    });
  return { purchaseUrl, token };
}

async function getDownloadPageUrl(client, gameUrl, token, purchaseUrl, signal) {
  const endpoint = resolveGamePath(gameUrl, "download_url");
  const response = assertResponse(
    await client.request(endpoint, {
      method: "POST",
      signal,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "X-Requested-With": "XMLHttpRequest",
        Referer: purchaseUrl.href,
      },
      body: new URLSearchParams({ csrf_token: token, reward_id: "" }),
    }),
    "Itch.io download page request failed",
    endpoint,
  );
  const result = await readJson(response, "Itch.io download endpoint returned invalid JSON", endpoint);
  const rawUrl = result?.url;
  if (!rawUrl)
    throw new ItchError("Itch.io did not return a download page URL", {
      url: endpoint.href,
      code: "ITCH_ACCESS_ERROR",
    });
  let downloadPageUrl;
  try {
    downloadPageUrl = new URL(rawUrl, gameUrl);
  } catch (cause) {
    throw new ItchError("Itch.io returned an invalid download page URL", {
      url: endpoint.href,
      code: "ITCH_INVALID_RESPONSE",
      cause,
    });
  }
  if (downloadPageUrl.protocol !== "https:")
    throw new ItchError("Itch.io returned an unsupported download page URL", {
      url: downloadPageUrl.href,
      code: "ITCH_INVALID_RESPONSE",
    });
  return downloadPageUrl;
}

export async function getDownloadUploads(client, gameValue, { signal } = {}) {
  const gameUrl = validateGameUrl(gameValue);
  const { purchaseUrl, token } = await getCsrfToken(client, gameUrl, signal);
  const downloadPageUrl = await getDownloadPageUrl(client, gameUrl, token, purchaseUrl, signal);
  const pageResponse = assertResponse(
    await client.request(downloadPageUrl, { signal }),
    "Itch.io download page failed",
    downloadPageUrl,
  );
  return parseUploads(await pageResponse.text());
}

export async function getDownloadUrl(client, gameValue, uploadId, { signal } = {}) {
  const gameUrl = validateGameUrl(gameValue);
  if (!/^\d+$/.test(String(uploadId))) throw new TypeError("uploadId must be a numeric itch.io upload ID");
  const { purchaseUrl, token } = await getCsrfToken(client, gameUrl, signal);
  const downloadPageUrl = await getDownloadPageUrl(client, gameUrl, token, purchaseUrl, signal);
  const pageResponse = assertResponse(
    await client.request(downloadPageUrl, { signal }),
    "Itch.io download page failed",
    downloadPageUrl,
  );
  const upload = parseUploads(await pageResponse.text()).find((item) => item.id === String(uploadId));
  if (!upload)
    throw new ItchError(`Itch.io upload ${uploadId} is unavailable`, {
      url: downloadPageUrl.href,
      code: "ITCH_ACCESS_ERROR",
    });

  const fileEndpoint = resolveGamePath(gameUrl, `file/${encodeURIComponent(uploadId)}?source=game_download`);
  const fileResponse = assertResponse(
    await client.request(fileEndpoint, {
      method: "POST",
      signal,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "X-Requested-With": "XMLHttpRequest",
        Referer: purchaseUrl.href,
      },
      body: new URLSearchParams({ csrf_token: token }),
    }),
    "Itch.io file download request failed",
    fileEndpoint,
  );
  const result = await readJson(fileResponse, "Itch.io file endpoint returned invalid JSON", fileEndpoint);
  if (!result?.url)
    throw new ItchError("Itch.io did not return a download URL", {
      url: fileEndpoint.href,
      code: "ITCH_ACCESS_ERROR",
    });
  let fileUrl;
  try {
    fileUrl = new URL(result.url, gameUrl);
  } catch (cause) {
    throw new ItchError("Itch.io returned an invalid download URL", {
      url: fileEndpoint.href,
      code: "ITCH_INVALID_RESPONSE",
      cause,
    });
  }
  if (!/^https?:$/.test(fileUrl.protocol))
    throw new ItchError("Itch.io returned an unsupported download URL", {
      url: fileUrl.href,
      code: "ITCH_INVALID_RESPONSE",
    });
  return fileUrl.href;
}
