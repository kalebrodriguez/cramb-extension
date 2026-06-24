import { describe, it, expect, vi, afterEach } from 'vitest';
import { fetchWithRetry } from '@/background/providers/fetch';

const noSleep = () => Promise.resolve();

function res(status: number, headers: Record<string, string> = {}): Response {
  return new Response(status === 204 ? null : 'body', { status, headers });
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('fetchWithRetry', () => {
  it('returns immediately on success without retrying', async () => {
    const fetchMock = vi.fn().mockResolvedValue(res(200));
    vi.stubGlobal('fetch', fetchMock);

    const r = await fetchWithRetry('https://x', {}, { sleep: noSleep });

    expect(r.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('retries on 429 then succeeds', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(res(429))
      .mockResolvedValueOnce(res(200));
    vi.stubGlobal('fetch', fetchMock);

    const r = await fetchWithRetry('https://x', {}, { sleep: noSleep });

    expect(r.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('retries on 503 then succeeds', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(res(503))
      .mockResolvedValueOnce(res(200));
    vi.stubGlobal('fetch', fetchMock);

    const r = await fetchWithRetry('https://x', {}, { sleep: noSleep });
    expect(r.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('gives up after exhausting retries and returns the last transient response', async () => {
    const fetchMock = vi.fn().mockResolvedValue(res(429));
    vi.stubGlobal('fetch', fetchMock);

    const r = await fetchWithRetry('https://x', {}, { retries: 2, sleep: noSleep });

    expect(r.status).toBe(429);
    expect(fetchMock).toHaveBeenCalledTimes(3); // 1 + 2 retries
  });

  it('does not retry a non-transient 4xx', async () => {
    const fetchMock = vi.fn().mockResolvedValue(res(401));
    vi.stubGlobal('fetch', fetchMock);

    const r = await fetchWithRetry('https://x', {}, { sleep: noSleep });

    expect(r.status).toBe(401);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('honors a numeric Retry-After header', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(res(429, { 'Retry-After': '2' }))
      .mockResolvedValueOnce(res(200));
    vi.stubGlobal('fetch', fetchMock);

    const slept: number[] = [];
    const sleep = (ms: number) => {
      slept.push(ms);
      return Promise.resolve();
    };

    const r = await fetchWithRetry('https://x', {}, { sleep, maxDelayMs: 8000 });

    expect(r.status).toBe(200);
    expect(slept).toEqual([2000]); // 2s from Retry-After, under the 8s cap
  });

  it('retries a network error then succeeds', async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new TypeError('network down'))
      .mockResolvedValueOnce(res(200));
    vi.stubGlobal('fetch', fetchMock);

    const r = await fetchWithRetry('https://x', {}, { sleep: noSleep });
    expect(r.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('does not retry an aborted request (timeout)', async () => {
    const abort = new DOMException('aborted', 'AbortError');
    const fetchMock = vi.fn().mockRejectedValue(abort);
    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchWithRetry('https://x', {}, { sleep: noSleep })).rejects.toBe(abort);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
