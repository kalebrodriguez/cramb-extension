import type { Result } from './errors';

/**
 * Typed wrapper over `chrome.runtime.sendMessage`. The background message hub
 * always responds with a `Result<T>`, so callers get `{ ok, data } | { ok, error }`
 * without re-stating the shape at every call site.
 */
export async function send<T = unknown>(msg: unknown): Promise<Result<T>> {
  return (await chrome.runtime.sendMessage(msg)) as Result<T>;
}
