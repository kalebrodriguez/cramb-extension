import { useEffect, useState } from 'react';
import {
  type Settings,
  type Provider,
  DEFAULT_SETTINGS,
  loadSettings,
  saveSettings,
  loadApiKey,
  saveApiKey,
} from '@/lib/settings';
import { DataSection } from './DataSection';
import { PROVIDERS, DEFAULT_MODELS } from '@/lib/providers-meta';
import { applyTheme, type ThemePref } from '@/lib/theme';

type TestStatus = 'idle' | 'testing' | 'success' | 'error';

const THEMES: { id: ThemePref; label: string }[] = [
  { id: 'dark', label: 'Dark' },
  { id: 'light', label: 'Light' },
  { id: 'system', label: 'System' },
];

export function Options() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [apiKey, setApiKey] = useState('');
  const [testStatus, setTestStatus] = useState<TestStatus>('idle');
  const [testDetail, setTestDetail] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadSettings().then((s) => {
      if (s) setSettings(s);
    });
    loadApiKey().then((k) => {
      if (k) setApiKey(k);
    });
  }, []);

  function updateProvider(provider: Provider) {
    setSettings((s) => ({
      ...s,
      provider,
      model: DEFAULT_MODELS[provider],
    }));
    setTestStatus('idle');
  }

  async function handleSave() {
    await saveSettings(settings);
    if (settings.provider !== 'ollama' && apiKey) {
      await saveApiKey(apiKey);
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function handleTest() {
    setTestStatus('testing');
    setTestDetail('');

    if (settings.provider !== 'ollama' && apiKey) {
      await saveApiKey(apiKey);
    }
    await saveSettings(settings);

    const result = await chrome.runtime.sendMessage({ type: 'model.test', payload: {} });
    if (result?.ok) {
      setTestStatus('success');
      setTestDetail('');
    } else {
      setTestStatus('error');
      setTestDetail(result?.error?.message ?? 'Connection failed.');
    }
  }

  async function handleThemeChange(theme: ThemePref) {
    const updated = { ...settings, appearance: { ...settings.appearance, theme } };
    setSettings(updated);
    applyTheme(theme); // live preview
    await saveSettings(updated); // persist immediately, no Save needed
  }

  const isOllama = settings.provider === 'ollama';

  return (
    <div className="max-w-[720px] mx-auto p-8 bg-bg text-text min-h-screen">
      <h1 className="text-xl font-bold mb-6">Settings</h1>

      <section className="space-y-4">
        <h2 className="text-md font-semibold text-brand">Model & Key</h2>

        <div>
          <label className="block text-sm font-medium mb-1">Provider</label>
          <select
            value={settings.provider}
            onChange={(e) => updateProvider(e.target.value as Provider)}
            className="w-full bg-input border border-border rounded-md px-3 py-2 text-text"
          >
            {PROVIDERS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        {!isOllama && (
          <div>
            <label className="block text-sm font-medium mb-1">API Key</label>
            <div className="flex gap-2">
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-..."
                className="flex-1 bg-input border border-border rounded-md px-3 py-2 text-text placeholder:text-faint"
              />
              <span className="flex items-center text-sm">
                {testStatus === 'success' && (
                  <span className="text-success">● valid</span>
                )}
                {testStatus === 'error' && (
                  <span className="text-danger">● invalid</span>
                )}
              </span>
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-1">Model</label>
          <input
            type="text"
            value={settings.model}
            onChange={(e) =>
              setSettings((s) => ({ ...s, model: e.target.value }))
            }
            className="w-full bg-input border border-border rounded-md px-3 py-2 text-text"
          />
        </div>

        {isOllama && (
          <div>
            <label className="block text-sm font-medium mb-1">
              Ollama Endpoint
            </label>
            <input
              type="text"
              value={settings.ollamaEndpoint}
              onChange={(e) =>
                setSettings((s) => ({ ...s, ollamaEndpoint: e.target.value }))
              }
              className="w-full bg-input border border-border rounded-md px-3 py-2 text-text"
            />
          </div>
        )}

        <div className="flex gap-3 items-center">
          <button
            onClick={handleTest}
            disabled={testStatus === 'testing'}
            className="px-4 py-2 bg-surface border border-border rounded-md text-sm hover:bg-elevated transition-colors duration-fast disabled:opacity-50"
          >
            {testStatus === 'testing' ? 'Testing…' : 'Test connection'}
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-brand-strong text-on-brand rounded-md text-sm font-medium hover:opacity-90 transition-opacity duration-fast"
          >
            Save
          </button>
          {saved && <span className="text-sm text-success">Saved</span>}
        </div>

        {testDetail && (
          <p className="text-sm text-danger">{testDetail}</p>
        )}

        <p className="text-xs text-faint mt-4">
          Your key and reading stay on this device. Cramb talks directly to
          the provider you choose and nowhere else.
        </p>
      </section>

      <section className="space-y-4 mt-10">
        <h2 className="text-md font-semibold text-brand">Appearance</h2>
        <div>
          <label className="block text-sm font-medium mb-1" id="theme-label">
            Theme
          </label>
          <div className="flex gap-2" role="group" aria-labelledby="theme-label">
            {THEMES.map((t) => {
              const active = settings.appearance.theme === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => handleThemeChange(t.id)}
                  className={
                    'px-4 py-2 rounded-md text-sm border transition-colors duration-fast ' +
                    (active
                      ? 'bg-brand-strong text-on-brand border-transparent'
                      : 'bg-surface border-border text-text hover:bg-elevated')
                  }
                >
                  {t.label}
                </button>
              );
            })}
          </div>
          <p className="text-xs text-faint mt-2">
            “System” follows your operating system’s light/dark setting.
          </p>
        </div>
      </section>

      <DataSection />
    </div>
  );
}
