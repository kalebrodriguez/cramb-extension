import { useEffect, useState } from 'react';
import {
  type Settings,
  DEFAULT_SETTINGS,
  loadSettings,
  loadApiKey,
} from '@/lib/settings';
import { WelcomeStep } from './steps/WelcomeStep';
import { ConnectStep } from './steps/ConnectStep';
import { DemoStep } from './steps/DemoStep';
import { FinishStep } from './steps/FinishStep';

const STEPS = ['Welcome', 'Connect a model', 'Your first cards', 'Done'] as const;

export function Onboarding() {
  const [step, setStep] = useState(0);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [apiKey, setApiKey] = useState('');

  // Pre-fill from any existing config so re-running onboarding isn't destructive.
  useEffect(() => {
    loadSettings().then((s) => {
      if (s) setSettings(s);
    });
    loadApiKey().then((k) => {
      if (k) setApiKey(k);
    });
  }, []);

  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  return (
    <div className="min-h-screen bg-bg text-text flex flex-col items-center">
      <div className="w-full max-w-[560px] px-6 py-10 flex flex-col gap-8">
        <ProgressBar step={step} />

        {step === 0 && <WelcomeStep onNext={next} />}
        {step === 1 && (
          <ConnectStep
            settings={settings}
            apiKey={apiKey}
            onSettingsChange={setSettings}
            onApiKeyChange={setApiKey}
            onNext={next}
            onBack={back}
          />
        )}
        {step === 2 && <DemoStep onNext={next} onBack={back} />}
        {step === 3 && <FinishStep />}
      </div>
    </div>
  );
}

function ProgressBar({ step }: { step: number }) {
  return (
    <div>
      <ol className="flex items-center gap-2" aria-label="Setup progress">
        {STEPS.map((label, i) => {
          const state = i < step ? 'done' : i === step ? 'current' : 'upcoming';
          return (
            <li key={label} className="flex-1 flex flex-col gap-1.5">
              <div
                className={
                  'h-1 rounded-full transition-colors duration-base ' +
                  (state === 'upcoming' ? 'bg-border' : 'bg-brand')
                }
              />
              <span
                className={
                  'text-xs ' +
                  (state === 'current'
                    ? 'text-text font-medium'
                    : state === 'done'
                      ? 'text-muted'
                      : 'text-faint')
                }
                aria-current={state === 'current' ? 'step' : undefined}
              >
                {label}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
