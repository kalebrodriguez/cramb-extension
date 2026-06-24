/**
 * `fetch()` wrapper that retries transient provider failures with bounded
 * exponential backoff + jitter, honoring a numeric `Retry-After` header when the
 * server sends one.
 *
 * Retried: HTTP 429 and 5xx, plus network errors. NOT retried: an aborted
 * request (the per-attempt timeout signal is shared, so an abort means the
 * overall deadline was hit) and any other 4xx (the caller maps those to a
 * terminal error code). Reusing the caller's `AbortSignal` across attempts keeps
 * an overall time budget rather than letting retries run unbounded.
 */
export interface RetryOptions {
  /** Max *additional* attempts after the first. Default 2 (so up to 3 total). */
  retries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  /** Injectable sleep, for tests. */
  sleep?: (ms: number) => Promise<void>;
}

const isTransient = (status: number) => status === 429 || (status >= 500 && status < 600);

function isAbort(e: unknown): boolean {
  return e instanceof DOMException && e.name === 'AbortError';
}

/** Parse a numeric `Retry-After` (seconds). HTTP-date form is ignored. */
function retryAfterMs(res: Response): number | null {
  const header = res.headers.get('Retry-After');
  if (!header) return null;
  const seconds = Number(header);
  return Number.isFinite(seconds) && seconds >= 0 ? seconds * 1000 : null;
}

function backoffMs(attempt: number, base: number, max: number): number {
  const exp = Math.min(max, base * 2 ** attempt);
  return Math.round(exp / 2 + Math.random() * (exp / 2)); // full-ish jitter
}

export async function fetchWithRetry(
  input: RequestInfo | URL,
  init: RequestInit,
  opts: RetryOptions = {},
): Promise<Response> {
  const retries = opts.retries ?? 2;
  const base = opts.baseDelayMs ?? 500;
  const max = opts.maxDelayMs ?? 8000;
  const sleep = opts.sleep ?? ((ms: number) => new Promise<void>((r) => setTimeout(r, ms)));

  let attempt = 0;
  for (;;) {
    try {
      const res = await fetch(input, init);
      if (attempt < retries && isTransient(res.status)) {
        const delay = retryAfterMs(res) ?? backoffMs(attempt, base, max);
        await sleep(Math.min(delay, max));
        attempt++;
        continue;
      }
      return res;
    } catch (e) {
      if (attempt < retries && !isAbort(e)) {
        await sleep(backoffMs(attempt, base, max));
        attempt++;
        continue;
      }
      throw e;
    }
  }
}
