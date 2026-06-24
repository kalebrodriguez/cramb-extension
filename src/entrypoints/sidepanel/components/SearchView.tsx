import { useRef, useState } from 'react';
import type { SearchResults } from '@/data/repositories/search-repo';
import { send } from '@/lib/messaging';

export function SearchView() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [searching, setSearching] = useState(false);
  const reqId = useRef(0);

  async function run() {
    const q = query.trim();
    if (!q) {
      setResults(null);
      return;
    }
    const id = ++reqId.current;
    setSearching(true);
    const res = await send<SearchResults>({ type: 'search.query', payload: { query: q } });
    // Ignore out-of-order responses if the user kept typing/searching.
    if (id !== reqId.current) return;
    setSearching(false);
    setResults(res.ok ? res.data : { query: q, cards: [], sources: [] });
  }

  const empty =
    results !== null && results.cards.length === 0 && results.sources.length === 0;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        <input
          autoFocus
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') run();
          }}
          placeholder="Search cards and sources…"
          className="flex-1 bg-input border border-border rounded-md px-3 py-2 text-sm text-text placeholder:text-faint"
          aria-label="Search query"
        />
        <button
          onClick={run}
          disabled={searching || !query.trim()}
          className="px-3 py-2 bg-brand-strong text-on-brand rounded-md text-sm disabled:opacity-50"
        >
          {searching ? '…' : 'Search'}
        </button>
      </div>

      {empty && (
        <p className="text-center text-faint text-sm py-6">
          No matches for “{results?.query}”.
        </p>
      )}

      {results && results.cards.length > 0 && (
        <section>
          <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">
            Cards ({results.cards.length})
          </h3>
          <div className="space-y-2">
            {results.cards.map((hit) => (
              <div key={hit.card.id} className="bg-surface border border-border rounded-md p-3 text-sm">
                <p className="break-words whitespace-pre-wrap">{hit.card.front}</p>
                <hr className="border-border-subtle my-2" />
                <p className="break-words whitespace-pre-wrap text-muted">{hit.card.back}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {results && results.sources.length > 0 && (
        <section>
          <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-2 mt-2">
            Sources ({results.sources.length})
          </h3>
          <div className="space-y-2">
            {results.sources.map((hit) => (
              <div key={hit.source.id} className="bg-surface border border-border rounded-md p-3 text-sm">
                <a
                  href={hit.source.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="font-medium text-brand hover:underline break-words"
                >
                  {hit.source.title}
                </a>
                <p className="text-xs text-muted mt-1 break-words">…{hit.snippet}…</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
