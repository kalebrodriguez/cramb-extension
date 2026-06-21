/**
 * Parse JSON from an LLM text response, tolerating common wrapping.
 *
 * Models frequently wrap JSON in a ```json … ``` markdown fence or add prose
 * around it, even when asked for raw JSON. We try a direct parse first, then
 * strip a code fence, then fall back to the outermost {…} / […] span. Throws
 * `BAD_LLM_OUTPUT` if nothing parses so the caller can surface a friendly error.
 */
export function parseModelJson(raw: string): unknown {
  const text = raw.trim();

  const attempt = (s: string): unknown | undefined => {
    try {
      return JSON.parse(s);
    } catch {
      return undefined;
    }
  };

  // 1. Direct parse.
  const direct = attempt(text);
  if (direct !== undefined) return direct;

  // 2. Strip a leading/trailing markdown code fence (```json … ``` or ``` … ```).
  const fenced = text.match(/^```(?:json)?\s*\n?([\s\S]*?)\n?```$/i);
  if (fenced) {
    const inner = attempt((fenced[1] ?? '').trim());
    if (inner !== undefined) return inner;
  }

  // 3. Fall back to the outermost object/array span.
  const start = text.search(/[[{]/);
  const end = Math.max(text.lastIndexOf('}'), text.lastIndexOf(']'));
  if (start !== -1 && end > start) {
    const span = attempt(text.slice(start, end + 1));
    if (span !== undefined) return span;
  }

  throw new Error('BAD_LLM_OUTPUT');
}
