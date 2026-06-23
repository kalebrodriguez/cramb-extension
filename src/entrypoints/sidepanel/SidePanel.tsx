import { useEffect, useState, useCallback, useMemo } from 'react';
import { cardRepo, deckRepo, sourceRepo } from '@/data/repositories';
import type { Deck, Source, Card } from '@/data/schemas';
import type { GeneratedCard } from '@/data/schemas/generation';
import { getNextIntervals } from '@/lib/scheduler';
import type { Rating } from 'ts-fsrs';
import { create } from 'zustand';
import { DecksView } from './components/DecksView';
import { DeckDetail } from './components/DeckDetail';
import { SearchView } from './components/SearchView';
import { StatsSummary } from './components/StatsSummary';

type View = 'home' | 'review' | 'decks' | 'search' | 'capture';

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

function formatInterval(ms: number): string {
  const mins = ms / 60000;
  if (mins < 60) return `<10m`;
  const hours = mins / 60;
  if (hours < 24) return `${Math.round(hours)}h`;
  const days = hours / 24;
  if (days < 30) return `${Math.round(days)}d`;
  const months = days / 30;
  if (months < 12) return `${Math.round(months)}mo`;
  return `${Math.round(months / 12)}y`;
}

function ReviewEngine({ onComplete }: { onComplete: () => void }) {
  const [queue, setQueue] = useState<Card[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const [reviewStartMs, setReviewStartMs] = useState<number>(0);

  useEffect(() => {
    // Schedule state update to avoid synchronous cascading renders
    queueMicrotask(() => {
      setReviewStartMs(Date.now());
    });
  }, [currentIndex]);

  // Load due cards
  useEffect(() => {
    // Basic queue load: grab all due cards. We should ideally order by due date.
    // For M2, we pull up to 50 due cards at a time to review.
    chrome.runtime.sendMessage({ type: 'review.next', payload: {} }).then((res: { ok?: boolean; data?: { cards?: Card[] } }) => {
       if (res && res.ok && res.data?.cards) {
          setQueue(res.data.cards);
       }
    }).catch(console.error);
  }, []);

  const currentCard = queue[currentIndex];

  const intervals = useMemo(() => {
    if (!currentCard) return null;
    return getNextIntervals(currentCard);
  }, [currentCard]);

  const handleGrade = useCallback(async (rating: Rating) => {
    if (!currentCard) return;
    const durationMs = Date.now() - reviewStartMs;
    
    try {
      await chrome.runtime.sendMessage({
         type: 'review.grade',
         payload: {
            cardId: currentCard.id,
            rating,
            durationMs
         }
      });
      
      // Move to next card
      if (currentIndex + 1 >= queue.length) {
         onComplete();
      } else {
         setCurrentIndex(i => i + 1);
         setIsRevealed(false);
         setReviewStartMs(Date.now());
      }
    } catch (e) {
       console.error("Failed to grade card", e);
    }
  }, [currentCard, currentIndex, queue.length, reviewStartMs, onComplete]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
       if (!currentCard) return;
       
       if (!isRevealed) {
          if (e.code === 'Space') {
            e.preventDefault();
            setIsRevealed(true);
          }
       } else {
          if (e.code === 'Digit1') handleGrade(1);
          if (e.code === 'Digit2') handleGrade(2);
          if (e.code === 'Digit3') handleGrade(3);
          if (e.code === 'Digit4') handleGrade(4);
          if (e.code === 'Space') {
            e.preventDefault();
            handleGrade(3); // Default space to Good
          }
       }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentCard, isRevealed, handleGrade]);

  if (queue.length === 0) {
    return <div className="p-4 text-center text-muted">Loading queue...</div>;
  }

  if (!currentCard) return null;

  return (
    <div className="w-full h-full flex flex-col items-center">
      <div className="text-xs font-semibold text-muted tracking-wider mb-4 mt-2">
         {queue.length - currentIndex} CARDS REMAINING
      </div>
      
      <div className="w-full flex-1 flex flex-col bg-surface border border-border rounded-lg shadow-sm overflow-hidden mb-4 relative">
         <div className="p-6 text-lg text-center flex-1 flex items-center justify-center break-words whitespace-pre-wrap">
            {currentCard.front}
         </div>
         
         {isRevealed && (
           <>
             <div className="w-full h-px bg-border"></div>
             <div className="p-6 text-lg text-center flex-1 flex items-center justify-center break-words whitespace-pre-wrap font-medium">
               {currentCard.back}
             </div>
           </>
         )}
      </div>

      {!isRevealed ? (
         <button 
           className="w-full py-3 bg-brand-strong text-on-brand rounded-md font-semibold hover:opacity-90 transition-opacity mb-4"
           onClick={() => setIsRevealed(true)}
         >
           Show Answer (Space)
         </button>
      ) : (
         <div className="w-full grid grid-cols-4 gap-2 mb-4">
           <button onClick={() => handleGrade(1)} className="flex flex-col items-center py-2 bg-surface hover:bg-elevated border border-border rounded-md transition-colors">
              <span className="text-red-400 font-medium text-sm">Again</span>
              {intervals && <span className="text-xs text-muted mt-1">{formatInterval(intervals[1])}</span>}
              <span className="text-[10px] text-faint mt-1 border border-border-subtle rounded px-1">1</span>
           </button>
           <button onClick={() => handleGrade(2)} className="flex flex-col items-center py-2 bg-surface hover:bg-elevated border border-border rounded-md transition-colors">
              <span className="text-orange-400 font-medium text-sm">Hard</span>
              {intervals && <span className="text-xs text-muted mt-1">{formatInterval(intervals[2])}</span>}
              <span className="text-[10px] text-faint mt-1 border border-border-subtle rounded px-1">2</span>
           </button>
           <button onClick={() => handleGrade(3)} className="flex flex-col items-center py-2 bg-surface hover:bg-elevated border border-border rounded-md transition-colors">
              <span className="text-green-400 font-medium text-sm">Good</span>
              {intervals && <span className="text-xs text-muted mt-1">{formatInterval(intervals[3])}</span>}
              <span className="text-[10px] text-faint mt-1 border border-border-subtle rounded px-1">3 / Sp</span>
           </button>
           <button onClick={() => handleGrade(4)} className="flex flex-col items-center py-2 bg-surface hover:bg-elevated border border-border rounded-md transition-colors">
              <span className="text-blue-400 font-medium text-sm">Easy</span>
              {intervals && <span className="text-xs text-muted mt-1">{formatInterval(intervals[4])}</span>}
              <span className="text-[10px] text-faint mt-1 border border-border-subtle rounded px-1">4</span>
           </button>
         </div>
      )}
    </div>
  );
}

export function SidePanel() {
  const [view, setView] = useState<View>('home');
  const [dueCount, setDueCount] = useState(0);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [activeSource, setActiveSource] = useState<Source | null>(null);
  const [selectedDeck, setSelectedDeck] = useState<Deck | null>(null);

  const refreshCounts = useCallback(() => {
    cardRepo.getDueCount().then(setDueCount);
    deckRepo.listAll().then(setDecks);
  }, []);

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

  // Listen for capture events and check storage on mount
  useEffect(() => {
    // Check if there was an active capture we missed due to race condition
    chrome.storage.local.get(['activeCaptureSourceId']).then((res) => {
      if (typeof res.activeCaptureSourceId === 'string') {
         setSourceId(res.activeCaptureSourceId);
         setView('capture');
      }
    });

    const listener = (msg: unknown) => {
       const typedMsg = msg as { type?: string; sourceId?: string };
       if (typedMsg.type === 'CAPTURE_COMPLETE' && typedMsg.sourceId) {
           setSourceId(typedMsg.sourceId);
           setView('capture');
       }
    };
    chrome.runtime.onMessage.addListener(listener);
    return () => chrome.runtime.onMessage.removeListener(listener);
  }, [setSourceId]);

  useEffect(() => {
    let active = true;
    if (sourceId) {
      sourceRepo.getById(sourceId).then((src) => {
        if (active && src) setActiveSource(src);
      });
    } else {
      // Defer the set state to a microtask so it's not synchronous
      queueMicrotask(() => {
        if (active) setActiveSource(null);
      });
    }
    return () => { active = false; };
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
      if (result.ok && result.data) {
        // Output from generation logic might be GenerationOutput object or Array
        const cards = Array.isArray(result.data) ? result.data : result.data.cards;
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
      await chrome.storage.local.remove('activeCaptureSourceId');
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
        {(['home', 'review', 'decks', 'search'] as const).map((v) => (
          <button
            key={v}
            onClick={() => {
              setSelectedDeck(null);
              setView(v);
            }}
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
            <StatsSummary />
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
          <div className="flex flex-col h-full items-center gap-4 pt-4">
             {dueCount === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-2">
                  <p className="text-xl font-semibold">All caught up!</p>
                  <p className="text-muted text-sm">You have reviewed everything for today.</p>
                  <button onClick={() => setView('home')} className="mt-4 px-4 py-2 bg-surface border border-border rounded-md text-sm hover:bg-elevated transition-colors">Go Home</button>
                </div>
             ) : (
                <ReviewEngine onComplete={() => setDueCount(0)} />
             )}
          </div>
        )}

        {view === 'decks' &&
          (selectedDeck ? (
            <DeckDetail
              deck={selectedDeck}
              onBack={() => setSelectedDeck(null)}
              onChanged={refreshCounts}
            />
          ) : (
            <DecksView onOpenDeck={setSelectedDeck} onChanged={refreshCounts} />
          ))}

        {view === 'search' && <SearchView />}

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
