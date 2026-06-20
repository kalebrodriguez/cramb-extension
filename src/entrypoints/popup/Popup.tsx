import { useEffect, useState } from 'react';
import { cardRepo } from '@/data/repositories';

export function Popup() {
  const [dueCount, setDueCount] = useState<number | null>(null);

  useEffect(() => {
    cardRepo.getDueCount().then(setDueCount);
  }, []);

  async function openSidePanel() {
    const win = await chrome.windows.getCurrent();
    if (win.id !== undefined) {
      await chrome.sidePanel.open({ windowId: win.id });
    }
  }

  function openOptions() {
    chrome.runtime.openOptionsPage();
  }

  return (
    <div className="flex flex-col gap-4 p-4 bg-bg text-text">
      <header className="flex items-center justify-between">
        <h1 className="text-md font-semibold text-brand">✦ mneme</h1>
        <button
          onClick={openOptions}
          className="text-muted hover:text-text transition-colors duration-fast"
          aria-label="Settings"
        >
          ⚙
        </button>
      </header>

      <div className="flex flex-col items-center gap-3 py-4">
        <div className="text-2xl font-bold text-text">
          {dueCount === null ? '…' : dueCount}
        </div>
        <div className="text-sm text-muted">
          {dueCount === 1 ? 'card due today' : 'cards due today'}
        </div>
        <button
          onClick={openSidePanel}
          className="w-full py-2 px-4 bg-brand-strong text-on-brand rounded-md font-medium hover:opacity-90 transition-opacity duration-fast"
        >
          Review now
        </button>
      </div>

      <div className="flex flex-col gap-2">
        <button
          onClick={openSidePanel}
          className="w-full py-2 px-4 bg-surface border border-border rounded-md text-sm text-text hover:bg-elevated transition-colors duration-fast"
        >
          ＋ Capture this page
        </button>
        <button
          onClick={openSidePanel}
          className="w-full py-2 px-4 bg-surface border border-border rounded-md text-sm text-text hover:bg-elevated transition-colors duration-fast"
        >
          ▤ Open workspace
        </button>
      </div>

      <footer className="text-xs text-faint text-center pt-2 border-t border-border-subtle">
        Ready to remember
      </footer>
    </div>
  );
}
