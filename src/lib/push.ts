import { createClient } from '@/lib/supabase/client';

const VAPID_PUBLIC_KEY =
  'BLSMzcl8R-mkp91_vy3TFfyeea8TaEvTQN5wrKbYTFxjBKI4GjytsW11RAbv3YfXfTm--QtZ1xAElSRqMbu2pWQ';

export type PushState = 'unsupported' | 'denied' | 'off' | 'on';

export function isPushSupported() {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

export function registerServiceWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
  navigator.serviceWorker.register('/sw.js').catch(() => {});
}

function urlBase64ToUint8Array(base64: string) {
  const padded = (base64 + '='.repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/');
  return Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
}

async function saveSubscription(sub: PushSubscription) {
  const json = sub.toJSON();
  const supabase = createClient();
  const { error } = await supabase.from('push_subscriptions').upsert(
    {
      endpoint: sub.endpoint,
      p256dh: json.keys?.p256dh,
      auth: json.keys?.auth,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata',
      user_agent: navigator.userAgent.slice(0, 300),
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'endpoint' }
  );
  if (error) throw error;
}

export async function getPushState(): Promise<PushState> {
  if (!isPushSupported()) return 'unsupported';
  if (Notification.permission === 'denied') return 'denied';
  const reg = await navigator.serviceWorker.getRegistration();
  const sub = await reg?.pushManager.getSubscription();
  if (sub && Notification.permission === 'granted') {
    // Keep the server copy fresh (timezone changes, rotated keys, re-logins).
    saveSubscription(sub).catch(() => {});
    return 'on';
  }
  return 'off';
}

export async function enablePush(): Promise<PushState> {
  if (!isPushSupported()) return 'unsupported';
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return permission === 'denied' ? 'denied' : 'off';

  const reg = await navigator.serviceWorker.register('/sw.js');
  await navigator.serviceWorker.ready;
  const sub =
    (await reg.pushManager.getSubscription()) ??
    (await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    }));
  await saveSubscription(sub);
  return 'on';
}

export async function disablePush(): Promise<PushState> {
  const reg = await navigator.serviceWorker.getRegistration();
  const sub = await reg?.pushManager.getSubscription();
  if (sub) {
    const supabase = createClient();
    await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
    await sub.unsubscribe();
  }
  return 'off';
}
