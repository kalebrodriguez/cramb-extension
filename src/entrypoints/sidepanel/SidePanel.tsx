import { useEffect, useState } from 'react';
import { cardRepo, deckRepo, sourceRepo } from '@/data/repositories';
import type { Deck, Source } from '@/data/schemas';
import type { GeneratedCard } from '@/data/schemas/generation';
import { create } from 'zustand';

type View = 'home' | 'review' | 'decks' | 'capture';

// Simple global state for the capture flow
interface CaptureStore {
  sourceId: string | null;
  generatedCards: GeneratedCard[];
  isGenerating: boolean;
  setSourceId: (id: string | null) => void;
  setGeneratedCards: (cards: GeneratedCard[]) => void;
  setIsGenerating: (val: boolean) => void;
  removeGeneratedCard: (index: number) => void;
  updateGeneratedCard: (index: number, card: GeneratedCard) => void;
  clear: () => void;
}

const useCaptureStore = create<CaptureStore>((set) => ({
  sourceId: null,
  generatedCards: [],
  isGenerating: false,
  setSourceId: (id) => set({ sourceId: id }),
  setGeneratedCards: (cards) => set({ generatedCards: cards }),
  setIsGenerating: (val) => set({ isGenerating: val }),
  removeGeneratedCard: (index) =>
    set((state) => ({
      generatedCards: state.generatedCards.filter((_, i) => i !== index),
    })),
  updateGeneratedCard: (index, card) =>
    set((state) => ({
      generatedCards: state.generatedCards.map((c, i) => (i === index ? card : c)),
    })),
  clear: () => set({ sourceId: null, generatedCards: [], isGenerating: false }),
}));

export function SidePanel() {
  const [view, setView] = useState<View>('home');
  const [dueCount, setDueCount] = useState(0);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [activeSource, setActiveSource] = useState<Source | null>(null);

  const {
    sourceId,
    generatedCards,
    isGenerating,
    setSourceId,
    setGeneratedCards,
    setIsGenerating,
    removeGeneratedCard,
    updateGeneratedCard,
    clear,
  } = useCaptureStore();

  useEffect(() => {
    cardRepo.getDueCount().then(setDueCount);
    deckRepo.listAll().then(setDecks);
  }, []);

  // Listen for capture events
  useEffect(() => {
    // When the background finishes a capture and generates a source, 
    // it will be saved to Dexie. We could poll or use a message here.
    // Let's rely on standard chrome message passing.
    const listener = (msg: any) => {
       if (msg.type === 'CAPTURE_COMPLETE') {
           setSourceId(msg.sourceId);
           setView('capture');
       }
    };
    chrome.runtime.onMessage.addListener(listener);
    return () => chrome.runtime.onMessage.removeListener(listener);
  }, [setSourceId]);

  useEffect(() => {
    if (sourceId) {
      sourceRepo.getById(sourceId).then((src) => {
        if (src) setActiveSource(src);
      });
    } else {
      setActiveSource(null);
    }
  }, [sourceId]);

  const handleGenerateCards = async () => {
    if (!sourceId) return;
    setIsGenerating(true);
    try {
      const result = await chrome.runtime.sendMessage({
        type: 'generate.cards',
        payload: {
          sourceId,
          options: { maxCards: 8, cardTypes: ['basic', 'cloze'] },
        },
      });
      if (result.ok && result.value) {
        // Output from generation logic might be GenerationOutput object or Array
        const cards = Array.isArray(result.value) ? result.value : result.value.cards;
        setGeneratedCards(cards || []);
      } else {
        // Better error handling surfacing
        if (result.error?.code === 'NO_MODEL_CONFIG') {
          alert('No AI model configured. Please go to Options (⚙) to set up your API key.');
        } else if (result.error?.code === 'INVALID_KEY') {
          alert('Invalid API Key. Please check your settings in Options.');
        } else if (result.error?.code === 'RATE_LIMITED') {
          alert('Rate limited by the AI provider. Please try again later.');
        } else {
          alert(result.error?.message || 'Failed to generate cards.');
        }
      }
    } catch (e) {
      alert('Generation error: ' + String(e));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveCards = async () => {
    if (!sourceId || !activeSource) return;
    
    try {
      // Find a deck for this source
      let deckId: string | undefined;
      const allDecks = await deckRepo.listAll();
      const existingDeck = allDecks.find(d => d.sourceId === sourceId);
      
      if (existingDeck) {
        deckId = existingDeck.id;
      } else {
        const deck = await deckRepo.create({ name: activeSource.title, sourceId });
        deckId = deck.id;
      }

      await chrome.runtime.sendMessage({
        type: 'cards.save',
        payload: {
          deckId,
          cards: generatedCards,
        },
      });

      // Clear state and go home
      clear();
      setView('home');
      
      // Refresh count
      cardRepo.getDueCount().then(setDueCount);
      deckRepo.listAll().then(setDecks);
    } catch (e) {
      alert('Save failed: ' + String(e));
    }
  };

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

        {view === 'capture' && activeSource && (
           <div className="flex flex-col gap-4">
             <div className="p-3 border border-border rounded-md bg-surface">
               <h3 className="font-semibold text-sm truncate">{activeSource.title}</h3>
               <p className="text-xs text-muted mt-1 truncate">{activeSource.excerpt}</p>
             </div>

             {generatedCards.length === 0 ? (
               <div className="flex flex-col gap-2">
                 <button 
                   onClick={handleGenerateCards}
                   disabled={isGenerating}
                   className="w-full py-2 bg-brand-strong text-on-brand rounded-md font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
                 >
                   {isGenerating ? 'Generating...' : 'Generate Cards'}
                 </button>
               </div>
             ) : (
               <div className="flex flex-col gap-4">
                 <div className="flex justify-between items-center">
                   <h3 className="font-medium text-sm">Generated Cards ({generatedCards.length})</h3>
                   <button onClick={handleSaveCards} className="px-3 py-1 bg-brand-strong text-on-brand rounded text-xs">Save All</button>
                 </div>
                 <div className="space-y-3">
                   {generatedCards.map((card, idx) => (
                     <div key={idx} className="p-3 border border-border rounded-md bg-surface text-sm flex flex-col gap-2 relative group">
                       <button onClick={() => removeGeneratedCard(idx)} className="absolute top-2 right-2 text-muted hover:text-red-400">✕</button>
                       <div>
                         <span className="text-xs font-semibold text-brand mb-1 block uppercase">{card.type}</span>
                         <textarea 
                           className="w-full bg-transparent border-none resize-none focus:outline-none mb-2" 
                           value={card.front}
                           onChange={(e) => updateGeneratedCard(idx, { ...card, front: e.target.value })}
                           rows={2}
                         />
                         <hr className="border-border my-2" />
                         <textarea 
                           className="w-full bg-transparent border-none resize-none focus:outline-none" 
                           value={card.back}
                           onChange={(e) => updateGeneratedCard(idx, { ...card, back: e.target.value })}
                           rows={2}
                         />
                       </div>
                     </div>
                   ))}
                 </div>
               </div>
             )}
           </div>
        )}
      </main>
    </div>
  );
}
