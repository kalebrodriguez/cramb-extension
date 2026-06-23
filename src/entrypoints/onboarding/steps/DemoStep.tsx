import { useState } from 'react';
import { send } from '@/lib/messaging';
import type { GeneratedCard } from '@/data/schemas/generation';

// A short, self-contained passage so the demo never depends on a live page.
const SAMPLE_TITLE = 'The forgetting curve';
const SAMPLE_TEXT =
  'In the 1880s, psychologist Hermann Ebbinghaus discovered the "forgetting curve": ' +
  'memory of new information decays rapidly at first and then levels off. ' +
  'He also found that each time you successfully recall something, the curve flattens — ' +
  'the memory lasts longer before it fades. This is the basis of spaced repetition: ' +
  'reviewing material at increasing intervals, right before you would forget it, ' +
  'so each review does the most work for the least effort.';

type State =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'done'; cards: GeneratedCard[] }
  | { kind: 'error'; message: string };

export function DemoStep({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const [state, setState] = useState<State>({ kind: 'idle' });

  async function generate() {
    setState({ kind: 'loading' });
    const result = await send<GeneratedCard[]>({
      type: 'generate.fromText',
      payload: {
        text: SAMPLE_TEXT,
        title: SAMPLE_TITLE,
        options: { maxCards: 3, cardTypes: ['basic', 'cloze'] },
      },
    });
    if (result.ok && result.data.length > 0) {
      setState({ kind: 'done', cards: result.data });
    } else {
      const message = result.ok
        ? 'The model returned no cards. Try again.'
        : (result.error.message ?? 'Generation failed.');
      setState({ kind: 'error', message });
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">Your first cards</h1>
        <p className="text-muted">
          Here&apos;s the whole idea in one tap: turn a passage into flashcards.
          We&apos;ll use a short sample so you can see it work.
        </p>
      </div>

      <blockquote className="p-4 rounded-lg bg-surface border border-border-subtle text-sm text-muted">
        <p className="font-medium text-text mb-1">{SAMPLE_TITLE}</p>
        {SAMPLE_TEXT}
      </blockquote>

      {state.kind === 'idle' && (
        <button
          onClick={generate}
          className="self-start px-5 py-2.5 bg-brand-strong text-on-brand rounded-md font-medium hover:opacity-90 transition-opacity duration-fast"
        >
          Make cards from this
        </button>
      )}

      {state.kind === 'loading' && (
        <div className="flex items-center gap-3 text-muted" role="status">
          <span className="inline-block w-4 h-4 rounded-full border-2 border-border border-t-brand motion-safe:animate-spin" />
          Generating…
        </div>
      )}

      {state.kind === 'error' && (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-danger" role="alert">
            {state.message}
          </p>
          <button
            onClick={generate}
            className="self-start px-4 py-2 bg-surface border border-border rounded-md text-sm hover:bg-elevated transition-colors duration-fast"
          >
            Try again
          </button>
        </div>
      )}

      {state.kind === 'done' && (
        <div className="flex flex-col gap-3">
          <ul className="flex flex-col gap-3">
            {state.cards.map((card, i) => (
              <li
                key={i}
                className="p-4 rounded-lg bg-surface border border-border-subtle"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs uppercase tracking-wide text-brand font-medium">
                    {card.type}
                  </span>
                </div>
                <p className="font-medium">{card.front}</p>
                <p className="text-sm text-muted mt-1">{card.back}</p>
              </li>
            ))}
          </ul>
          <p className="text-sm text-muted">
            In real use you can edit every card before it&apos;s saved — nothing
            enters your deck without your say-so.
          </p>
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="px-4 py-2 text-sm text-muted hover:text-text transition-colors duration-fast"
        >
          Back
        </button>
        <button
          onClick={onNext}
          className="px-5 py-2.5 bg-brand-strong text-on-brand rounded-md font-medium hover:opacity-90 transition-opacity duration-fast"
        >
          {state.kind === 'done' ? 'Finish' : 'Skip for now'}
        </button>
      </div>
    </div>
  );
}
