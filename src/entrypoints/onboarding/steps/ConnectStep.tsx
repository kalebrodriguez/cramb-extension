import { useState } from 'react';
import {
  type Settings,
  type Provider,
  saveSettings,
  saveApiKey,
} from '@/lib/settings';
import { PROVIDERS, DEFAULT_MODELS, KEY_HELP } from '@/lib/providers-meta';

type TestStatus = 'idle' | 'testing' | 'success' | 'error';

interface Props {
  settings: Settings;
  apiKey: string;
  onSettingsChange: (s: Settings) => void;
  onApiKeyChange: (k: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export function ConnectStep({
  settings,
  apiKey,
  onSettingsChange,
  onApiKeyChange,
  onNext,
  onBack,
}: Props) {
  const [status, setStatus] = useState<TestStatus>('idle');
  const [detail, setDetail] = useState('');

  const isOllama = settings.provider === 'ollama';
  const keyHelp = KEY_HELP[settings.provider];
  const needsKey = !isOllama;

  function updateProvider(provider: Provider) {
    onSettingsChange({ ...settings, provider, model: DEFAULT_MODELS[provider] });
    setStatus('idle');
    setDetail('');
  }

  async function handleTest() {
    setStatus('testing');
    setDetail('');
    // Persist before testing — the background worker reads the saved key/settings.
    if (needsKey && apiKey) await saveApiKey(apiKey);
    await saveSettings(settings);

    const result = await chrome.runtime.sendMessage({ type: 'model.test', payload: {} });
    if (result?.ok) {
      setStatus('success');
    } else {
      setStatus('error');
      setDetail(result?.error?.message ?? 'Connection failed.');
    }
  }

  const canContinue = status === 'success';

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">Connect a model</h1>
        <p className="text-muted">
          Cramb sends your reading only to the provider you choose here. Your key
          stays on this device and is never logged or exported.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <div>
          <label htmlFor="ob-provider" className="block text-sm font-medium mb-1">
            Provider
          </label>
          <select
            id="ob-provider"
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

        {needsKey && (
          <div>
            <label htmlFor="ob-key" className="block text-sm font-medium mb-1">
              API key
            </label>
            <input
              id="ob-key"
              type="password"
              value={apiKey}
              onChange={(e) => {
                onApiKeyChange(e.target.value);
                setStatus('idle');
              }}
              placeholder="sk-…"
              className="w-full bg-input border border-border rounded-md px-3 py-2 text-text placeholder:text-faint"
            />
            {keyHelp && (
              <p className="text-xs text-faint mt-1">
                Get one at{' '}
                <a
                  href={keyHelp.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-brand underline"
                >
                  {keyHelp.label}
                </a>
                .
              </p>
            )}
          </div>
        )}

        <div>
          <label htmlFor="ob-model" className="block text-sm font-medium mb-1">
            Model
          </label>
          <input
            id="ob-model"
            type="text"
            value={settings.model}
            onChange={(e) => {
              onSettingsChange({ ...settings, model: e.target.value });
              setStatus('idle');
            }}
            className="w-full bg-input border border-border rounded-md px-3 py-2 text-text"
          />
        </div>

        {isOllama && (
          <div>
            <label htmlFor="ob-endpoint" className="block text-sm font-medium mb-1">
              Ollama endpoint
            </label>
            <input
              id="ob-endpoint"
              type="text"
              value={settings.ollamaEndpoint}
              onChange={(e) =>
                onSettingsChange({ ...settings, ollamaEndpoint: e.target.value })
              }
              className="w-full bg-input border border-border rounded-md px-3 py-2 text-text"
            />
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            onClick={handleTest}
            disabled={status === 'testing' || (needsKey && !apiKey)}
            className="px-4 py-2 bg-surface border border-border rounded-md text-sm hover:bg-elevated transition-colors duration-fast disabled:opacity-50"
          >
            {status === 'testing' ? 'Testing…' : 'Test connection'}
          </button>
          {status === 'success' && (
            <span className="text-sm text-success" role="status">
              ● Connected
            </span>
          )}
          {status === 'error' && (
            <span className="text-sm text-danger" role="status">
              ● Couldn&apos;t connect
            </span>
          )}
        </div>

        {detail && <p className="text-sm text-danger">{detail}</p>}
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="px-4 py-2 text-sm text-muted hover:text-text transition-colors duration-fast"
        >
          Back
        </button>
        <button
          onClick={onNext}
          disabled={!canContinue}
          className="px-5 py-2.5 bg-brand-strong text-on-brand rounded-md font-medium hover:opacity-90 transition-opacity duration-fast disabled:opacity-40"
          title={canContinue ? undefined : 'Test the connection first'}
        >
          Continue
        </button>
      </div>
    </div>
  );
}
