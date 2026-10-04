'use client';

import React, { useEffect, useState } from 'react';
import { Bell, BellOff, BellRing, Download } from 'lucide-react';
import { PushState, disablePush, enablePush, getPushState } from '@/lib/push';

type InstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

let deferredInstall: InstallPromptEvent | null = null;

const BUTTON =
  'p-2 md:p-1.5 rounded-lg text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 md:border md:border-neutral-200 transition-colors disabled:opacity-50';

export const AppAlertsButton: React.FC = () => {
  const [state, setState] = useState<PushState | null>(null);
  const [busy, setBusy] = useState(false);
  const [canInstall, setCanInstall] = useState(false);

  useEffect(() => {
    getPushState().then(setState);

    const onPrompt = (e: Event) => {
      e.preventDefault();
      deferredInstall = e as InstallPromptEvent;
      setCanInstall(true);
    };
    const onInstalled = () => {
      deferredInstall = null;
      setCanInstall(false);
    };
    if (deferredInstall) setCanInstall(true);
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const toggleAlerts = async () => {
    if (state === 'denied') {
      alert('Alerts are blocked for this app. Allow notifications in your browser or Android app settings, then try again.');
      return;
    }
    if (state === 'on' && !confirm('Turn off task alerts on this device?')) return;
    setBusy(true);
    try {
      setState(state === 'on' ? await disablePush() : await enablePush());
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not change alert settings.');
    } finally {
      setBusy(false);
    }
  };

  const install = async () => {
    if (!deferredInstall) return;
    await deferredInstall.prompt();
    await deferredInstall.userChoice;
    deferredInstall = null;
    setCanInstall(false);
  };

  if (state === null || state === 'unsupported') return null;

  const Icon = state === 'on' ? BellRing : state === 'denied' ? BellOff : Bell;
  const title =
    state === 'on'
      ? 'Task alerts are on for this device (tap to turn off)'
      : state === 'denied'
        ? 'Alerts are blocked in settings'
        : 'Turn on task alerts';

  return (
    <>
      {canInstall && (
        <button onClick={install} className={BUTTON} title="Install ChronoTrack as an app">
          <Download className="w-4 h-4 md:w-3.5 md:h-3.5" />
        </button>
      )}
      <button onClick={toggleAlerts} disabled={busy} className={BUTTON} title={title}>
        <Icon className={`w-4 h-4 md:w-3.5 md:h-3.5 ${state === 'on' ? 'text-neutral-900' : ''}`} />
      </button>
    </>
  );
};
