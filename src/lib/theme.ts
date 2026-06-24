import { loadSettings, SETTINGS_KEY, type Settings } from './settings';

export type ThemePref = Settings['appearance']['theme']; // 'dark' | 'light' | 'system'

const lightMedia = () => window.matchMedia('(prefers-color-scheme: light)');

/** Resolve a preference (including 'system') to a concrete theme. */
export function resolveTheme(pref: ThemePref): 'dark' | 'light' {
  if (pref === 'system') return lightMedia().matches ? 'light' : 'dark';
  return pref;
}

/** Apply a preference to the document root (drives the [data-theme] tokens). */
export function applyTheme(pref: ThemePref): void {
  document.documentElement.dataset.theme = resolveTheme(pref);
}

async function reapply(): Promise<void> {
  const s = await loadSettings();
  applyTheme(s?.appearance.theme ?? 'dark');
}

/**
 * Apply the persisted theme and keep it in sync. Each UI entrypoint calls this
 * once on mount: it reflects the saved preference, follows OS changes while the
 * preference is 'system', and live-updates when the options page saves a new
 * theme (storage change broadcasts to every open surface).
 */
export async function initTheme(): Promise<void> {
  await reapply();

  lightMedia().addEventListener('change', () => {
    void reapply();
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes[SETTINGS_KEY]) void reapply();
  });
}
