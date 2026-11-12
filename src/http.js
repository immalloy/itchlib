import { ItchError } from "./errors.js";

const DEFAULT_TIMEOUT_MS = 15_000;
const DEFAULT_ATTEMPTS = 3;
const DEFAULT_MAX_RETRY_DELAY_MS = 30_000;
const RETRYABLE_STATUS = new Set([408, 429]);
const RETRYABLE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

function retryDelay(response, attempt) {
  const retryAfter = response.headers?.get?.("retry-after");
  const seconds = Number(retryAfter);
  if (retryAfter && Number.isFinite(seconds) && seconds >= 0) return seconds * 1000;
  if (retryAfter) {
    const timestamp = Date.parse(retryAfter);
    if (Number.isFinite(timestamp)) return Math.max(0, timestamp - Date.now());
  }
  const base = response.status === 429 ? 2_000 : 500;
  return Math.round(base * 2 ** (attempt - 1) * (0.8 + Math.random() * 0.4));
}

function isRetryableStatus(status) {
  return RETRYABLE_STATUS.has(status) || status >= 500;
}

export class ItchTransport {
  constructor({
    fetch: fetchImpl = globalThis.fetch,
    timeout = DEFAULT_TIMEOUT_MS,
    headers = {},
    userAgent = "itchlib/1.0.1",
    maxRetryDelay = DEFAULT_MAX_RETRY_DELAY_MS,
  } = {}) {
    if (typeof fetchImpl !== "function") throw new TypeError("A Fetch API implementation is required");
    if (!Number.isFinite(timeout) || timeout <= 0)
      throw new TypeError("timeout must be a positive number of milliseconds");
    if (!Number.isFinite(maxRetryDelay) || maxRetryDelay < 0)
      throw new TypeError("maxRetryDelay must be a non-negative number of milliseconds");
    this.fetch = fetchImpl;
    this.timeout = timeout;
    this.maxRetryDelay = maxRetryDelay;
    this.headers = { "User-Agent": userAgent, Accept: "text/html,application/xhtml+xml", ...headers };
  }

  async request(url, options = {}) {
    const timeout = options.timeout ?? this.timeout;
    const { timeout: _timeout, maxRetryDelay: _maxRetryDelay, ...fetchOptions } = options;
    const method = String(fetchOptions.method || "GET").toUpperCase();
    const canRetry = RETRYABLE_METHODS.has(method);
    let lastError;

    for (let attempt = 1; attempt <= DEFAULT_ATTEMPTS; attempt += 1) {
      const controller = new AbortController();
      const externalSignal = fetchOptions.signal;
      const abortFromCaller = () => controller.abort(externalSignal.reason);
      if (externalSignal?.aborted)
        throw new ItchError("Itch.io request was aborted", { url: String(url), code: "ITCH_ABORTED" });
      externalSignal?.addEventListener("abort", abortFromCaller, { once: true });
      const timer = setTimeout(
        () => controller.abort(new Error(`Request timed out after ${timeout} ms`)),
        timeout,
      );

      try {
        const response = await this.fetch(url, {
          ...fetchOptions,
          headers: { ...this.headers, ...fetchOptions.headers },
          signal: controller.signal,
        });
        if (!canRetry || !isRetryableStatus(response.status) || attempt === DEFAULT_ATTEMPTS) return response;
        const delay = retryDelay(response, attempt);
        if (delay > this.maxRetryDelay) return response;
        try {
          await response.body?.cancel?.();
        } catch {
          /* A body may already have been consumed or closed. */
        }
        lastError = new ItchError(`Itch.io request failed with HTTP ${response.status}`, {
          status: response.status,
          url: String(url),
          code: "ITCH_HTTP_ERROR",
        });
        await new Promise((resolve) => setTimeout(resolve, delay));
      } catch (cause) {
        if (externalSignal?.aborted)
          throw new ItchError("Itch.io request was aborted", {
            url: String(url),
            code: "ITCH_ABORTED",
            cause,
          });
        lastError = new ItchError(`Itch.io request failed: ${cause.message}`, {
          url: String(url),
          code: "ITCH_NETWORK_ERROR",
          cause,
        });
        if (!canRetry || attempt === DEFAULT_ATTEMPTS) throw lastError;
        await new Promise((resolve) =>
          setTimeout(resolve, Math.round(500 * 2 ** (attempt - 1) * (0.8 + Math.random() * 0.4))),
        );
      } finally {
        clearTimeout(timer);
        externalSignal?.removeEventListener("abort", abortFromCaller);
      }
    }
    throw lastError;
  }
}
