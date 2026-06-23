const PROMISES = [
  {
    title: 'Your key, your device',
    body: 'Cramb uses your own LLM key (or local Ollama). Nothing is bundled, nothing is shared.',
  },
  {
    title: 'No backend, no accounts',
    body: 'Your reading and your cards live in this browser. Cramb talks only to the model you pick.',
  },
  {
    title: 'Anki-compatible',
    body: 'Export any deck to a standard .apkg file. You are never locked in.',
  },
];

export function WelcomeStep({ onNext }: { onNext: () => void }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <div
          className="w-12 h-12 rounded-xl bg-brand-strong text-on-brand grid place-items-center text-2xl"
          aria-hidden="true"
        >
          ✦
        </div>
        <h1 className="text-2xl font-bold">Welcome to Cramb</h1>
        <p className="text-muted">
          Turn what you read and watch into spaced-repetition flashcards, so you
          actually remember it. Let&apos;s get you to your first cards in under
          three minutes.
        </p>
      </div>

      <ul className="flex flex-col gap-3">
        {PROMISES.map((p) => (
          <li
            key={p.title}
            className="flex gap-3 p-4 rounded-lg bg-surface border border-border-subtle"
          >
            <span className="text-brand mt-0.5" aria-hidden="true">
              ●
            </span>
            <div>
              <p className="font-medium">{p.title}</p>
              <p className="text-sm text-muted">{p.body}</p>
            </div>
          </li>
        ))}
      </ul>

      <button
        onClick={onNext}
        className="self-start px-5 py-2.5 bg-brand-strong text-on-brand rounded-md font-medium hover:opacity-90 transition-opacity duration-fast"
      >
        Get started
      </button>
    </div>
  );
}
