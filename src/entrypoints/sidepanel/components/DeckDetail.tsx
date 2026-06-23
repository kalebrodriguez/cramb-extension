import { useCallback, useEffect, useState } from 'react';
import { cardRepo } from '@/data/repositories';
import type { Card, Deck } from '@/data/schemas';
import { send } from '@/lib/messaging';
import { downloadApkg } from '@/lib/anki/export';

interface DeckDetailProps {
  deck: Deck;
  onBack: () => void;
  /** Bubble up when cards change so parent due counts stay fresh. */
  onChanged: () => void;
}

export function DeckDetail({ deck, onBack, onChanged }: DeckDetailProps) {
  const [cards, setCards] = useState<Card[] | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftFront, setDraftFront] = useState('');
  const [draftBack, setDraftBack] = useState('');
  const [adding, setAdding] = useState(false);
  const [newFront, setNewFront] = useState('');
  const [newBack, setNewBack] = useState('');
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    setCards(await cardRepo.getByDeck(deck.id));
  }, [deck.id]);

  useEffect(() => {
    let active = true;
    cardRepo.getByDeck(deck.id).then((c) => {
      if (active) setCards(c);
    });
    return () => {
      active = false;
    };
  }, [deck.id]);

  async function refreshAll() {
    await reload();
    onChanged();
  }

  function startEdit(card: Card) {
    setEditingId(card.id);
    setDraftFront(card.front);
    setDraftBack(card.back);
  }

  async function saveEdit(cardId: string) {
    const front = draftFront.trim();
    const back = draftBack.trim();
    if (!front || !back) return;
    setBusy(true);
    await send({ type: 'card.update', payload: { cardId, changes: { front, back } } });
    setBusy(false);
    setEditingId(null);
    await refreshAll();
  }

  async function toggleSuspend(card: Card) {
    setBusy(true);
    await send({ type: 'card.suspend', payload: { cardId: card.id, suspended: !card.suspended } });
    setBusy(false);
    await refreshAll();
  }

  async function remove(cardId: string) {
    if (!window.confirm('Delete this card?')) return;
    setBusy(true);
    await send({ type: 'card.delete', payload: { cardId } });
    setBusy(false);
    await refreshAll();
  }

  async function addCard() {
    const front = newFront.trim();
    const back = newBack.trim();
    if (!front || !back) return;
    setBusy(true);
    await send({
      type: 'card.create',
      payload: { deckId: deck.id, type: 'basic', front, back },
    });
    setBusy(false);
    setNewFront('');
    setNewBack('');
    setAdding(false);
    await refreshAll();
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <button
          onClick={onBack}
          className="text-muted hover:text-text text-sm shrink-0"
          aria-label="Back to decks"
        >
          ← Decks
        </button>
        <h2 className="text-sm font-semibold truncate flex-1">{deck.name}</h2>
        <button
          onClick={async () => {
            if (!cards || cards.length === 0) return;
            setBusy(true);
            try {
              await downloadApkg([deck], cards, deck.name);
            } catch (e) {
              alert(`Anki export failed: ${e instanceof Error ? e.message : String(e)}`);
            } finally {
              setBusy(false);
            }
          }}
          disabled={busy || !cards || cards.length === 0}
          className="text-xs text-muted hover:text-text shrink-0 disabled:opacity-40"
          title="Export this deck as an Anki .apkg file"
        >
          ⤓ Anki
        </button>
      </div>

      {adding ? (
        <div className="bg-surface border border-border rounded-md p-3 flex flex-col gap-2">
          <textarea
            autoFocus
            placeholder="Front (question)"
            value={newFront}
            onChange={(e) => setNewFront(e.target.value)}
            rows={2}
            className="w-full bg-input border border-border rounded px-2 py-1 text-sm resize-none"
          />
          <textarea
            placeholder="Back (answer)"
            value={newBack}
            onChange={(e) => setNewBack(e.target.value)}
            rows={2}
            className="w-full bg-input border border-border rounded px-2 py-1 text-sm resize-none"
          />
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => {
                setAdding(false);
                setNewFront('');
                setNewBack('');
              }}
              className="px-3 py-1 text-sm text-muted hover:text-text"
            >
              Cancel
            </button>
            <button
              disabled={busy || !newFront.trim() || !newBack.trim()}
              onClick={addCard}
              className="px-3 py-1 bg-brand-strong text-on-brand rounded text-sm disabled:opacity-50"
            >
              Add card
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="w-full py-2 bg-surface border border-border border-dashed rounded-md text-sm text-muted hover:text-text hover:border-border transition-colors"
        >
          ＋ New card
        </button>
      )}

      {cards === null ? (
        <div className="p-4 text-center text-muted text-sm">Loading cards…</div>
      ) : cards.length === 0 ? (
        <p className="text-center text-faint text-sm py-6">No cards in this deck yet.</p>
      ) : (
        <div className="space-y-2">
          {cards.map((card) => (
            <div
              key={card.id}
              className={`bg-surface border border-border rounded-md p-3 text-sm ${
                card.suspended ? 'opacity-60' : ''
              }`}
            >
              {editingId === card.id ? (
                <div className="flex flex-col gap-2">
                  <textarea
                    value={draftFront}
                    onChange={(e) => setDraftFront(e.target.value)}
                    rows={2}
                    className="w-full bg-input border border-border rounded px-2 py-1 resize-none"
                  />
                  <textarea
                    value={draftBack}
                    onChange={(e) => setDraftBack(e.target.value)}
                    rows={2}
                    className="w-full bg-input border border-border rounded px-2 py-1 resize-none"
                  />
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => setEditingId(null)}
                      className="px-3 py-1 text-muted hover:text-text"
                    >
                      Cancel
                    </button>
                    <button
                      disabled={busy || !draftFront.trim() || !draftBack.trim()}
                      onClick={() => saveEdit(card.id)}
                      className="px-3 py-1 bg-brand-strong text-on-brand rounded disabled:opacity-50"
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="break-words whitespace-pre-wrap">{card.front}</p>
                      <hr className="border-border-subtle my-2" />
                      <p className="break-words whitespace-pre-wrap text-muted">{card.back}</p>
                    </div>
                    {card.suspended && (
                      <span className="text-[10px] text-faint border border-border-subtle rounded px-1 shrink-0">
                        suspended
                      </span>
                    )}
                  </div>
                  <div className="flex gap-3 mt-2 text-xs">
                    <button onClick={() => startEdit(card)} className="text-muted hover:text-text">
                      Edit
                    </button>
                    <button
                      disabled={busy}
                      onClick={() => toggleSuspend(card)}
                      className="text-muted hover:text-text disabled:opacity-40"
                    >
                      {card.suspended ? 'Unsuspend' : 'Suspend'}
                    </button>
                    <button
                      disabled={busy}
                      onClick={() => remove(card.id)}
                      className="text-red-400 hover:text-red-300 disabled:opacity-40"
                    >
                      Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
