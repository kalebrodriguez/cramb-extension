import { useCallback, useEffect, useState } from 'react';
import { deckRepo } from '@/data/repositories';
import type { Deck } from '@/data/schemas';
import { send } from '@/lib/messaging';

interface DeckStats {
  deck: Deck;
  cardCount: number;
  dueCount: number;
}

/** Load every deck plus its card/due counts for display. */
async function loadDeckStats(): Promise<DeckStats[]> {
  const decks = await deckRepo.listAll();
  const stats = await Promise.all(
    decks.map(async (deck) => ({
      deck,
      cardCount: await deckRepo.getCardCount(deck.id),
      dueCount: await deckRepo.getDueCount(deck.id),
    })),
  );
  return stats.sort((a, b) => a.deck.name.localeCompare(b.deck.name));
}

interface DecksViewProps {
  /** Open a deck's detail view. */
  onOpenDeck: (deck: Deck) => void;
  /** Bubble up when decks/cards change so the parent can refresh due counts. */
  onChanged: () => void;
}

export function DecksView({ onOpenDeck, onChanged }: DecksViewProps) {
  const [stats, setStats] = useState<DeckStats[] | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [mergeTarget, setMergeTarget] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    setStats(await loadDeckStats());
  }, []);

  useEffect(() => {
    let active = true;
    loadDeckStats().then((s) => {
      if (active) setStats(s);
    });
    return () => {
      active = false;
    };
  }, []);

  async function refreshAll() {
    await reload();
    onChanged();
  }

  async function rename(deckId: string) {
    const name = renameValue.trim();
    setRenamingId(null);
    if (!name) return;
    setBusy(true);
    await send({ type: 'deck.rename', payload: { deckId, name } });
    setBusy(false);
    await refreshAll();
  }

  async function suspendAll(deckId: string, suspended: boolean) {
    setBusy(true);
    await send({ type: 'card.suspend', payload: { deckId, suspended } });
    setBusy(false);
    await refreshAll();
  }

  async function merge(sourceDeckId: string) {
    const targetDeckId = mergeTarget[sourceDeckId];
    if (!targetDeckId) return;
    setBusy(true);
    await send({ type: 'deck.merge', payload: { sourceDeckId, targetDeckId } });
    setBusy(false);
    setExpandedId(null);
    await refreshAll();
  }

  async function remove(deckId: string, name: string, cardCount: number) {
    const msg =
      cardCount > 0
        ? `Delete "${name}" and its ${cardCount} card${cardCount === 1 ? '' : 's'}? This can't be undone.`
        : `Delete "${name}"?`;
    if (!window.confirm(msg)) return;
    setBusy(true);
    await send({ type: 'deck.delete', payload: { deckId, deleteCards: true } });
    setBusy(false);
    setExpandedId(null);
    await refreshAll();
  }

  if (stats === null) {
    return <div className="p-4 text-center text-muted text-sm">Loading decks…</div>;
  }

  if (stats.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted">No decks yet.</p>
        <p className="text-sm text-faint mt-1">Capture a page or video to get started.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {stats.map(({ deck, cardCount, dueCount }) => {
        const others = stats.filter((s) => s.deck.id !== deck.id);
        const isExpanded = expandedId === deck.id;
        return (
          <div key={deck.id} className="bg-surface border border-border rounded-md overflow-hidden">
            <div className="p-3 flex items-center justify-between gap-2">
              {renamingId === deck.id ? (
                <input
                  autoFocus
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') rename(deck.id);
                    if (e.key === 'Escape') setRenamingId(null);
                  }}
                  onBlur={() => rename(deck.id)}
                  className="flex-1 bg-input border border-border rounded px-2 py-1 text-sm text-text"
                  aria-label="Deck name"
                />
              ) : (
                <button
                  onClick={() => onOpenDeck(deck)}
                  className="flex-1 text-left min-w-0"
                  title="Open deck"
                >
                  <span className="text-sm font-medium block truncate">{deck.name}</span>
                  <span className="text-xs text-muted">
                    {cardCount} card{cardCount === 1 ? '' : 's'}
                    {dueCount > 0 && <span className="text-brand"> · {dueCount} due</span>}
                  </span>
                </button>
              )}
              <button
                onClick={() => setExpandedId(isExpanded ? null : deck.id)}
                className="text-muted hover:text-text px-2 shrink-0"
                aria-label="Deck actions"
                aria-expanded={isExpanded}
              >
                ⋯
              </button>
            </div>

            {isExpanded && (
              <div className="border-t border-border-subtle p-3 flex flex-col gap-2 text-sm">
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      setRenameValue(deck.name);
                      setRenamingId(deck.id);
                      setExpandedId(null);
                    }}
                    className="px-2 py-1 bg-elevated border border-border rounded hover:bg-bg transition-colors"
                  >
                    Rename
                  </button>
                  <button
                    disabled={busy || cardCount === 0}
                    onClick={() => suspendAll(deck.id, true)}
                    className="px-2 py-1 bg-elevated border border-border rounded hover:bg-bg transition-colors disabled:opacity-40"
                  >
                    Suspend all
                  </button>
                  <button
                    disabled={busy || cardCount === 0}
                    onClick={() => suspendAll(deck.id, false)}
                    className="px-2 py-1 bg-elevated border border-border rounded hover:bg-bg transition-colors disabled:opacity-40"
                  >
                    Unsuspend all
                  </button>
                  <button
                    disabled={busy}
                    onClick={() => remove(deck.id, deck.name, cardCount)}
                    className="px-2 py-1 border border-border rounded text-danger hover:bg-elevated transition-colors disabled:opacity-40"
                  >
                    Delete
                  </button>
                </div>

                {others.length > 0 && (
                  <div className="flex items-center gap-2">
                    <select
                      value={mergeTarget[deck.id] ?? ''}
                      onChange={(e) =>
                        setMergeTarget((m) => ({ ...m, [deck.id]: e.target.value }))
                      }
                      className="flex-1 bg-input border border-border rounded px-2 py-1 text-text"
                      aria-label="Merge into deck"
                    >
                      <option value="">Merge into…</option>
                      {others.map((o) => (
                        <option key={o.deck.id} value={o.deck.id}>
                          {o.deck.name}
                        </option>
                      ))}
                    </select>
                    <button
                      disabled={busy || !mergeTarget[deck.id]}
                      onClick={() => merge(deck.id)}
                      className="px-2 py-1 bg-elevated border border-border rounded hover:bg-bg transition-colors disabled:opacity-40"
                    >
                      Merge
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
