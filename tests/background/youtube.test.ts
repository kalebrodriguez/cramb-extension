import { describe, it, expect, vi } from 'vitest';
import {
  parseVideoId,
  extractPlayerResponse,
  pickCaptionTrack,
  parseJson3,
  buildDeepLink,
  formatTimestamp,
  fetchTranscript,
  NoTranscriptError,
} from '@/background/sources/youtube';

describe('parseVideoId', () => {
  it('reads the v param from a watch URL', () => {
    expect(parseVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=5s')).toBe('dQw4w9WgXcQ');
  });
  it('reads youtu.be short links', () => {
    expect(parseVideoId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
  });
  it('reads /shorts/ and /embed/ paths', () => {
    expect(parseVideoId('https://www.youtube.com/shorts/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    expect(parseVideoId('https://www.youtube.com/embed/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
  });
  it('rejects non-YouTube and malformed ids', () => {
    expect(parseVideoId('https://example.com/watch?v=dQw4w9WgXcQ')).toBeNull();
    expect(parseVideoId('https://www.youtube.com/watch?v=tooshort')).toBeNull();
    expect(parseVideoId('not a url')).toBeNull();
  });
});

describe('extractPlayerResponse', () => {
  it('extracts a balanced JSON object even with trailing braces in strings', () => {
    const html = `<script>var ytInitialPlayerResponse = {"a":1,"s":"} not the end {"};</script>`;
    expect(extractPlayerResponse(html)).toEqual({ a: 1, s: '} not the end {' });
  });
  it('returns null when the marker is absent', () => {
    expect(extractPlayerResponse('<html></html>')).toBeNull();
  });
});

describe('pickCaptionTrack', () => {
  const player = {
    captions: {
      playerCaptionsTracklistRenderer: {
        captionTracks: [
          { baseUrl: 'u-es', languageCode: 'es', kind: undefined },
          { baseUrl: 'u-en-asr', languageCode: 'en', kind: 'asr' },
          { baseUrl: 'u-en', languageCode: 'en' },
        ],
      },
    },
  };
  it('prefers the requested language and manual captions', () => {
    expect(pickCaptionTrack(player, 'en')?.baseUrl).toBe('u-en');
  });
  it('returns null when there are no tracks', () => {
    expect(pickCaptionTrack({}, 'en')).toBeNull();
  });
});

describe('parseJson3', () => {
  it('joins segs, trims, and floors timestamps; drops empty events', () => {
    const raw = {
      events: [
        { tStartMs: 0, segs: [{ utf8: 'Hello' }, { utf8: ' world' }] },
        { tStartMs: 1500 }, // no segs → skipped
        { tStartMs: 4200, segs: [{ utf8: '\n' }] }, // whitespace only → skipped
        { tStartMs: 8800, segs: [{ utf8: 'next' }] },
      ],
    };
    expect(parseJson3(raw)).toEqual([
      { start: 0, text: 'Hello world' },
      { start: 8, text: 'next' },
    ]);
  });
  it('returns [] for malformed input', () => {
    expect(parseJson3(null)).toEqual([]);
    expect(parseJson3({})).toEqual([]);
  });
});

describe('buildDeepLink / formatTimestamp', () => {
  it('builds a t= deep link', () => {
    expect(buildDeepLink('abc12345678', 95.7)).toBe('https://www.youtube.com/watch?v=abc12345678&t=95s');
  });
  it('formats timestamps with and without hours', () => {
    expect(formatTimestamp(5)).toBe('0:05');
    expect(formatTimestamp(95)).toBe('1:35');
    expect(formatTimestamp(3725)).toBe('1:02:05');
  });
});

describe('fetchTranscript', () => {
  const playerJson = JSON.stringify({
    videoDetails: { title: 'Test Talk', author: 'Speaker' },
    captions: {
      playerCaptionsTracklistRenderer: {
        captionTracks: [{ baseUrl: 'https://yt/timedtext?x=1', languageCode: 'en' }],
      },
    },
  });

  function mockFetch(): typeof fetch {
    return vi.fn(async (input: string) => {
      if (input.includes('/watch')) {
        return new Response(`<script>var ytInitialPlayerResponse = ${playerJson};</script>`);
      }
      // timedtext request
      return new Response(JSON.stringify({ events: [{ tStartMs: 0, segs: [{ utf8: 'transcript body' }] }] }));
    }) as unknown as typeof fetch;
  }

  it('assembles a transcript from page + timedtext', async () => {
    const t = await fetchTranscript('https://www.youtube.com/watch?v=dQw4w9WgXcQ', mockFetch());
    expect(t.title).toBe('Test Talk');
    expect(t.author).toBe('Speaker');
    expect(t.fullText).toBe('transcript body');
    expect(t.segments).toHaveLength(1);
  });

  it('appends fmt=json3 only when not already present', async () => {
    const spy = mockFetch();
    await fetchTranscript('https://youtu.be/dQw4w9WgXcQ', spy);
    const ttCall = (spy as unknown as ReturnType<typeof vi.fn>).mock.calls.find((c) =>
      String(c[0]).includes('timedtext'),
    );
    expect(String(ttCall?.[0])).toContain('fmt=json3');
  });

  it('throws NoTranscriptError when no caption track exists', async () => {
    const noCaptions = vi.fn(async () =>
      new Response(`<script>var ytInitialPlayerResponse = ${JSON.stringify({ videoDetails: { title: 'x' } })};</script>`),
    ) as unknown as typeof fetch;
    await expect(fetchTranscript('https://youtu.be/dQw4w9WgXcQ', noCaptions)).rejects.toBeInstanceOf(
      NoTranscriptError,
    );
  });

  it('rejects a non-YouTube URL', async () => {
    await expect(fetchTranscript('https://example.com', mockFetch())).rejects.toThrow();
  });
});
