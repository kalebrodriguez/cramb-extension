import { useEffect, useState } from 'react';
import { cardRepo, reviewRepo } from '@/data/repositories';
import { computeStats, type Stats } from '@/lib/stats';

/** Short weekday labels for the forecast bars, starting at "Today". */
function forecastLabels(count: number, now: number): string[] {
  const labels: string[] = [];
  for (let i = 0; i < count; i++) {
    if (i === 0) {
      labels.push('Today');
    } else {
      const d = new Date(now + i * 86_400_000);
      labels.push(d.toLocaleDateString(undefined, { weekday: 'short' }));
    }
  }
  return labels;
}

export function StatsSummary() {
  // Capture `now` alongside the stats so render stays pure (no Date.now() in render).
  const [data, setData] = useState<{ stats: Stats; now: number } | null>(null);

  useEffect(() => {
    let active = true;
    const now = Date.now();
    Promise.all([cardRepo.getAll(), reviewRepo.getAll()]).then(([cards, reviews]) => {
      if (active) setData({ stats: computeStats(cards, reviews, now), now });
    });
    return () => {
      active = false;
    };
  }, []);

  // Nothing to show until there's at least one card.
  if (!data || data.stats.totalCards === 0) return null;

  const { stats, now } = data;
  const labels = forecastLabels(stats.forecast.length, now);
  const maxBar = Math.max(1, ...stats.forecast);
  const retentionPct =
    stats.retention === null ? '—' : `${Math.round(stats.retention * 100)}%`;

  return (
    <div className="w-full mt-6 space-y-4">
      <div className="grid grid-cols-3 gap-2 text-center">
        <Stat label="Streak" value={`${stats.streak}🔥`} />
        <Stat label="Retention" value={retentionPct} />
        <Stat label="Reviews" value={String(stats.totalReviews)} />
      </div>

      <div>
        <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">
          Due — next {stats.forecast.length} days
        </h3>
        <div className="flex items-end justify-between gap-1 h-20">
          {stats.forecast.map((count, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1 min-w-0">
              <span className="text-[10px] text-faint h-3">{count > 0 ? count : ''}</span>
              <div
                className="w-full bg-brand-strong rounded-sm transition-[height] duration-fast"
                style={{ height: `${(count / maxBar) * 100}%`, minHeight: count > 0 ? 4 : 1 }}
                title={`${count} due ${labels[i]}`}
              />
              <span className="text-[10px] text-faint truncate w-full text-center">{labels[i]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface border border-border rounded-md py-2">
      <div className="text-lg font-bold text-text">{value}</div>
      <div className="text-[11px] text-muted">{label}</div>
    </div>
  );
}
