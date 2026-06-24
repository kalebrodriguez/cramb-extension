/**
 * YouTube transcript adapter.
 *
 * Pulls the caption track for a video by reading `ytInitialPlayerResponse` from
 * the watch page, then fetching the track's `baseUrl` in JSON3 format. All
 * fetching runs in the background service worker (host permission for
 * youtube.com required); the pure parsers below are unit-tested in isolation.
 *
 * Egress note (CLAUDE.md §2): the only host contacted here is youtube.com, the
 * source the user explicitly chose to capture.
 */

export interface TranscriptSegment {
  /** Start offset within the video, in seconds (floored). */
  start: number;
  text: string;
}

export interface YouTubeTranscript {
  videoId: string;
  title: string;
  author?: string;
  lang: string;
  segments: TranscriptSegment[];
  /** Segments joined into a single readable block for card generation. */
  fullText: string;
}

interface CaptionTrack {
  baseUrl: string;
  languageCode?: string;
  kind?: string; // 'asr' for auto-generated
  name?: { simpleText?: string };
  vssId?: string;
}

/** Extract the 11-char video id from any common YouTube URL shape. */
export function parseVideoId(url: string): string | null {
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return null;
  }
  const host = u.hostname.replace(/^www\./, '');
  if (host === 'youtu.be') {
    const id = u.pathname.slice(1).split('/')[0];
    return isVideoId(id) ? id : null;
  }
  if (host.endsWith('youtube.com')) {
    const v = u.searchParams.get('v');
    if (v && isVideoId(v)) return v;
    // /shorts/ID, /embed/ID, /v/ID
    const m = u.pathname.match(/^\/(?:shorts|embed|v)\/([^/?#]+)/);
    if (m && isVideoId(m[1])) return m[1];
  }
  return null;
}

function isVideoId(id: string | undefined): id is string {
  return !!id && /^[A-Za-z0-9_-]{11}$/.test(id);
}

/** Pull the `ytInitialPlayerResponse` JSON object out of watch-page HTML. */
export function extractPlayerResponse(html: string): unknown | null {
  // The assignment appears as: var ytInitialPlayerResponse = {...};
  const marker = 'ytInitialPlayerResponse';
  const at = html.indexOf(marker);
  if (at === -1) return null;
  const brace = html.indexOf('{', at);
  if (brace === -1) return null;
  const json = sliceBalancedJson(html, brace);
  if (!json) return null;
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

/** Walk from an opening `{` to its matching `}`, respecting strings/escapes. */
function sliceBalancedJson(s: string, start: number): string | null {
  let depth = 0;
  let inStr = false;
  let escaped = false;
  for (let i = start; i < s.length; i++) {
    const ch = s[i];
    if (inStr) {
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === '"') inStr = false;
      continue;
    }
    if (ch === '"') inStr = true;
    else if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) return s.slice(start, i + 1);
    }
  }
  return null;
}

/** Safely read a nested property path from an unknown JSON value. */
function dig(value: unknown, ...path: string[]): unknown {
  let cur = value;
  for (const key of path) {
    if (cur === null || typeof cur !== 'object') return undefined;
    cur = (cur as Record<string, unknown>)[key];
  }
  return cur;
}

function getCaptionTracks(player: unknown): CaptionTrack[] {
  const tracks = dig(player, 'captions', 'playerCaptionsTracklistRenderer', 'captionTracks');
  return Array.isArray(tracks) ? (tracks as CaptionTrack[]) : [];
}

/**
 * Choose a caption track, preferring the requested language and human-authored
 * captions over auto-generated (asr) ones. Falls back to the first track.
 */
export function pickCaptionTrack(player: unknown, preferLang = 'en'): CaptionTrack | null {
  const tracks = getCaptionTracks(player);
  if (tracks.length === 0) return null;
  const score = (t: CaptionTrack): number => {
    let s = 0;
    if (t.languageCode?.startsWith(preferLang)) s += 4;
    if (t.kind !== 'asr') s += 2; // prefer manual captions
    return s;
  };
  return [...tracks].sort((a, b) => score(b) - score(a))[0] ?? null;
}

interface Json3Event {
  tStartMs?: number;
  segs?: { utf8?: string }[];
}

/** Parse YouTube timedtext JSON3 into trimmed, non-empty segments. */
export function parseJson3(raw: unknown): TranscriptSegment[] {
  const events = (raw as { events?: Json3Event[] })?.events;
  if (!Array.isArray(events)) return [];
  const segments: TranscriptSegment[] = [];
  for (const ev of events) {
    if (!ev.segs) continue;
    const text = ev.segs
      .map((s) => s.utf8 ?? '')
      .join('')
      .replace(/\s+/g, ' ')
      .trim();
    if (!text) continue;
    segments.push({ start: Math.floor((ev.tStartMs ?? 0) / 1000), text });
  }
  return segments;
}

/** Build a watch URL that deep-links to a given second of the video. */
export function buildDeepLink(videoId: string, startSeconds: number): string {
  return `https://www.youtube.com/watch?v=${videoId}&t=${Math.max(0, Math.floor(startSeconds))}s`;
}

/** Format seconds as `m:ss` / `h:mm:ss` for display next to a card. */
export function formatTimestamp(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = h > 0 ? String(m).padStart(2, '0') : String(m);
  return `${h > 0 ? `${h}:` : ''}${mm}:${String(sec).padStart(2, '0')}`;
}

function getVideoTitle(player: unknown): string | undefined {
  const title = dig(player, 'videoDetails', 'title');
  return typeof title === 'string' ? title : undefined;
}

function getVideoAuthor(player: unknown): string | undefined {
  const author = dig(player, 'videoDetails', 'author');
  return typeof author === 'string' ? author : undefined;
}

export class NoTranscriptError extends Error {
  constructor(message = 'This video has no captions available.') {
    super(message);
    this.name = 'NoTranscriptError';
  }
}

type FetchImpl = (input: string, init?: RequestInit) => Promise<Response>;

/**
 * Fetch and assemble a transcript for a YouTube URL. Throws on an invalid URL
 * or a network failure, and {@link NoTranscriptError} when the video has no
 * usable caption track (caller should surface the no-transcript fallback).
 */
export async function fetchTranscript(
  url: string,
  fetchImpl: FetchImpl = fetch,
  preferLang = 'en',
): Promise<YouTubeTranscript> {
  const videoId = parseVideoId(url);
  if (!videoId) throw new Error('Not a recognizable YouTube video URL.');

  const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const pageRes = await fetchImpl(watchUrl, { credentials: 'omit' });
  if (!pageRes.ok) throw new Error(`Failed to load video page (${pageRes.status}).`);
  const html = await pageRes.text();

  const player = extractPlayerResponse(html);
  if (!player) throw new Error('Could not read video metadata.');

  const track = pickCaptionTrack(player, preferLang);
  if (!track?.baseUrl) throw new NoTranscriptError();

  const ttUrl = track.baseUrl.includes('fmt=')
    ? track.baseUrl
    : `${track.baseUrl}&fmt=json3`;
  const ttRes = await fetchImpl(ttUrl, { credentials: 'omit' });
  if (!ttRes.ok) throw new Error(`Failed to load captions (${ttRes.status}).`);
  const segments = parseJson3(await ttRes.json());
  if (segments.length === 0) throw new NoTranscriptError();

  return {
    videoId,
    title: getVideoTitle(player) ?? `YouTube video ${videoId}`,
    author: getVideoAuthor(player),
    lang: track.languageCode ?? preferLang,
    segments,
    fullText: segments.map((s) => s.text).join(' '),
  };
}
