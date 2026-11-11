export class ItchError extends Error {
  constructor(message, { status, url, code = "ITCH_ERROR", cause } = {}) {
    super(message, { cause });
    this.name = "ItchError";
    this.code = code;
    if (status !== undefined) this.status = status;
    if (url) this.url = url;
  }
}

export function assertResponse(response, message, url) {
  if (!response.ok) {
    throw new ItchError(`${message} (HTTP ${response.status})`, {
      status: response.status,
      url: String(url),
      code: "ITCH_HTTP_ERROR",
    });
  }
  return response;
}

export async function readJson(response, message, url) {
  try {
    return await response.json();
  } catch (cause) {
    throw new ItchError(message, {
      status: response.status,
      url: String(url),
      code: "ITCH_INVALID_RESPONSE",
      cause,
    });
  }
}
