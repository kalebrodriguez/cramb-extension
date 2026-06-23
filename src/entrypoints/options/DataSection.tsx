import { useRef, useState } from 'react';
import { send } from '@/lib/messaging';
import type { Backup } from '@/data/schemas';

type Status = { kind: 'idle' | 'working' | 'ok' | 'error'; message?: string };

function todayStamp(): string {
  return new Date().toISOString().slice(0, 10);
}

export function DataSection() {
  const [status, setStatus] = useState<Status>({ kind: 'idle' });
  const fileInput = useRef<HTMLInputElement>(null);

  async function handleExport() {
    setStatus({ kind: 'working', message: 'Preparing export…' });
    const res = await send<Backup>({ type: 'library.export', payload: {} });
    if (!res.ok) {
      setStatus({ kind: 'error', message: res.error.message });
      return;
    }
    const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cramb-backup-${todayStamp()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    const n = res.data.cards.length;
    setStatus({ kind: 'ok', message: `Exported ${n} card${n === 1 ? '' : 's'}.` });
  }

  async function handleFile(file: File) {
    if (
      !window.confirm(
        'Importing replaces your entire current library (decks, cards, and review history) with the backup. This cannot be undone. Continue?',
      )
    ) {
      return;
    }
    setStatus({ kind: 'working', message: 'Importing…' });
    let parsed: unknown;
    try {
      parsed = JSON.parse(await file.text());
    } catch {
      setStatus({ kind: 'error', message: "That file isn't valid JSON." });
      return;
    }
    const res = await send<{ decks: number; cards: number }>({
      type: 'library.import',
      payload: { backup: parsed },
    });
    if (!res.ok) {
      setStatus({ kind: 'error', message: res.error.message });
      return;
    }
    setStatus({
      kind: 'ok',
      message: `Imported ${res.data.cards} card${res.data.cards === 1 ? '' : 's'} across ${res.data.decks} deck${res.data.decks === 1 ? '' : 's'}.`,
    });
  }

  return (
    <section className="space-y-4 mt-10">
      <h2 className="text-md font-semibold text-brand">Your data</h2>
      <p className="text-sm text-muted">
        Cramb stores everything on this device. Export a backup to move your library to another
        browser, or keep it safe. No API keys are included in exports.
      </p>

      <div className="flex flex-wrap gap-3 items-center">
        <button
          onClick={handleExport}
          disabled={status.kind === 'working'}
          className="px-4 py-2 bg-surface border border-border rounded-md text-sm hover:bg-elevated transition-colors duration-fast disabled:opacity-50"
        >
          Export backup (.json)
        </button>
        <button
          onClick={() => fileInput.current?.click()}
          disabled={status.kind === 'working'}
          className="px-4 py-2 bg-surface border border-border rounded-md text-sm hover:bg-elevated transition-colors duration-fast disabled:opacity-50"
        >
          Import backup…
        </button>
        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            // Reset so selecting the same file again re-triggers onChange.
            e.target.value = '';
            if (file) handleFile(file);
          }}
        />
      </div>

      {status.message && (
        <p className={`text-sm ${status.kind === 'error' ? 'text-danger' : 'text-muted'}`}>
          {status.message}
        </p>
      )}

      <p className="text-xs text-faint">
        Importing <strong>replaces</strong> your current library with the backup's contents.
      </p>
    </section>
  );
}
