import { useEffect, useState } from 'react';
import { cardRepo } from '@/data/repositories';
import { deckRepo } from '@/data/repositories';
import type { Deck } from '@/data/schemas';

type View = 'home' | 'review' | 'decks';

export function SidePanel() {
  const [view, setView] = useState<View>('home');
  const [dueCount, setDueCount] = useState(0);
  const [decks, setDecks] = useState<Deck[]>([]);

  useEffect(() => {
    cardRepo.getDueCount().then(setDueCount);
    deckRepo.listAll().then(setDecks);
  }, []);

  return (
    <div className="flex flex-col h-screen bg-bg text-text">
      <nav className="flex border-b border-border">
        {(['home', 'review', 'decks'] as const).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`flex-1 py-3 text-sm font-medium capitalize transition-colors duration-fast ${
              view === v
                ? 'text-brand border-b-2 border-brand'
                : 'text-muted hover:text-text'
            }`}
          >
            {v}
          </button>
        ))}
      </nav>

      <main className="flex-1 overflow-y-auto p-4">
        {view === 'home' && (
          <div className="flex flex-col items-center gap-4 pt-8">
            <div className="text-2xl font-bold">{dueCount}</div>
            <div className="text-sm text-muted">cards due today</div>
            {dueCount > 0 ? (
              <button
                onClick={() => setView('review')}
                className="px-6 py-2 bg-brand-strong text-on-brand rounded-md font-medium hover:opacity-90 transition-opacity duration-fast"
              >
                Review now
              </button>
            ) : (
              <p className="text-muted text-sm">All caught up — nice.</p>
            )}
            {decks.length > 0 && (
              <div className="w-full mt-6">
                <h3 className="text-sm font-medium text-muted mb-2">Your decks</h3>
                <ul className="space-y-2">
                  {decks.map((d) => (
                    <li
                      key={d.id}
                      className="p-3 bg-surface border border-border rounded-md text-sm"
                    >
                      {d.name}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {view === 'review' && (
          <div className="flex flex-col items-center gap-4 pt-8">
            {dueCount === 0 ? (
              <p className="text-muted">All caught up — nice.</p>
            ) : (
              <p className="text-muted text-sm">
                Review engine coming in Milestone 2.
              </p>
            )}
          </div>
        )}

        {view === 'decks' && (
          <div className="space-y-2">
            {decks.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted">No decks yet.</p>
                <p className="text-sm text-faint mt-1">
                  Capture your first page to get started.
                </p>
              </div>
            ) : (
              decks.map((d) => (
                <div
                  key={d.id}
                  className="p-3 bg-surface border border-border rounded-md flex justify-between items-center"
                >
                  <span className="text-sm font-medium">{d.name}</span>
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
}
