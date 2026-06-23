import { useEffect, useState } from 'react';
import { cardRepo } from '@/data/repositories';
import { ToastViewport } from '@/components/ToastViewport';
import { toast } from '@/lib/toast';

function isYouTubeWatchUrl(url: string | undefined): boolean {
  if (!url) return false;
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, '');
    return (
      (host.endsWith('youtube.com') && (u.searchParams.has('v') || u.pathname.startsWith('/shorts/'))) ||
      host === 'youtu.be'
    );
  } catch {
    return false;
  }
}

export function Popup() {
  const [dueCount, setDueCount] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<chrome.tabs.Tab | null>(null);

  useEffect(() => {
    cardRepo.getDueCount().then(setDueCount);
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      setActiveTab(tabs[0] ?? null);
    });
  }, []);

  const onYouTube = isYouTubeWatchUrl(activeTab?.url);

  function captureVideo() {
    if (!activeTab?.url) return;
    chrome.runtime.sendMessage(
      { type: 'capture.fromVideo', payload: { url: activeTab.url } },
      (response) => {
        if (response && response.ok === false) {
          toast.error(`Couldn't capture video: ${response.error?.message ?? 'unknown error'}`);
        }
      },
    );
    openSidePanel();
  }

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
        <h1 className="text-md font-semibold text-brand">✦ cramb</h1>
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
          onClick={async () => {
            await openSidePanel(); // Open side panel first!
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
              const activeTab = tabs[0];
              if (activeTab?.id && activeTab.url) {
                chrome.runtime.sendMessage({
                  type: 'capture.fromPage',
                  payload: {
                    url: activeTab.url,
                  },
                }, (response) => {
                   if (response && response.error) {
                     const errMsg =
                       typeof response.error === 'object'
                         ? (response.error.message ?? 'unknown error')
                         : response.error;
                     toast.error(`Failed to capture: ${errMsg}`);
                   }
                });
              }
            });
          }}
          className="w-full py-2 px-4 bg-surface border border-border rounded-md text-sm text-text hover:bg-elevated transition-colors duration-fast"
        >
          ＋ Capture this page
        </button>
        {onYouTube && (
          <button
            onClick={captureVideo}
            className="w-full py-2 px-4 bg-surface border border-border rounded-md text-sm text-text hover:bg-elevated transition-colors duration-fast"
          >
            ▶ Capture this video
          </button>
        )}
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
      <ToastViewport />
    </div>
  );
}
