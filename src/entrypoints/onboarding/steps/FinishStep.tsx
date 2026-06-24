const TIPS = [
  {
    title: 'Capture a whole page',
    body: 'Open the Cramb popup on any article and choose “Capture this page.”',
  },
  {
    title: 'Capture a highlight',
    body: 'Select text on a page, right-click, and pick “Make cards from selection.”',
  },
  {
    title: 'Capture a video',
    body: 'On a YouTube video, open the popup and choose “Capture this video.”',
  },
];

export function FinishStep() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <div
          className="w-12 h-12 rounded-xl bg-brand-strong text-on-brand grid place-items-center text-2xl"
          aria-hidden="true"
        >
          ✦
        </div>
        <h1 className="text-2xl font-bold">You&apos;re all set</h1>
        <p className="text-muted">
          Your model is connected and stored on this device. Here&apos;s how to
          turn anything you read into cards.
        </p>
      </div>

      <ul className="flex flex-col gap-3">
        {TIPS.map((t) => (
          <li
            key={t.title}
            className="flex gap-3 p-4 rounded-lg bg-surface border border-border-subtle"
          >
            <span className="text-brand mt-0.5" aria-hidden="true">
              ●
            </span>
            <div>
              <p className="font-medium">{t.title}</p>
              <p className="text-sm text-muted">{t.body}</p>
            </div>
          </li>
        ))}
      </ul>

      <p className="text-sm text-faint">
        Tip: pin Cramb to your toolbar so the popup is always one click away.
      </p>

      <div className="flex items-center gap-3">
        <button
          onClick={() => window.close()}
          className="px-5 py-2.5 bg-brand-strong text-on-brand rounded-md font-medium hover:opacity-90 transition-opacity duration-fast"
        >
          Start reading
        </button>
        <button
          onClick={() => chrome.runtime.openOptionsPage()}
          className="px-4 py-2 text-sm text-muted hover:text-text transition-colors duration-fast"
        >
          Open settings
        </button>
      </div>
    </div>
  );
}
