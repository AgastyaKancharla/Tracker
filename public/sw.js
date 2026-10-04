const ICON = '/icons/icon-192.png';
const BADGE = '/icons/badge-96.png';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

self.addEventListener('push', (event) => {
  let msg = {};
  try {
    msg = event.data ? event.data.json() : {};
  } catch {
    msg = { title: 'ChronoTrack', body: event.data ? event.data.text() : '' };
  }
  event.waitUntil(
    self.registration.showNotification(msg.title || 'ChronoTrack', {
      body: msg.body || '',
      tag: msg.tag,
      renotify: Boolean(msg.tag),
      requireInteraction: Boolean(msg.requireInteraction),
      icon: ICON,
      badge: BADGE,
      vibrate: [200, 100, 200],
      timestamp: Date.now(),
      actions: msg.actions || [],
      data: msg.data || {},
    })
  );
});

async function broadcast(message) {
  const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
  windows.forEach((w) => w.postMessage(message));
}

async function openApp(url) {
  const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
  const existing = windows.find((w) => new URL(w.url).origin === self.location.origin);
  if (existing) {
    await existing.focus();
    existing.postMessage({ type: 'open-url', url });
    return;
  }
  await self.clients.openWindow(url);
}

async function markDone(notification) {
  const d = notification.data || {};
  try {
    const res = await fetch(d.actionUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action: 'done', taskId: d.taskId, userId: d.userId, token: d.actionToken }),
    });
    if (!res.ok) throw new Error(String(res.status));
    await broadcast({ type: 'tasks-changed' });
    await self.registration.showNotification('Marked done', {
      body: notification.title.replace(/^(Now|In \d+ min): /, ''),
      tag: notification.tag,
      icon: ICON,
      badge: BADGE,
      silent: true,
    });
    await new Promise((r) => setTimeout(r, 3000));
    const shown = await self.registration.getNotifications({ tag: notification.tag });
    shown.forEach((n) => n.close());
  } catch {
    await openApp(d.url || '/');
  }
}

self.addEventListener('notificationclick', (event) => {
  const notification = event.notification;
  const d = notification.data || {};
  notification.close();

  if (event.action === 'done' && d.taskId) {
    event.waitUntil(markDone(notification));
  } else if (event.action === 'reschedule' && d.taskId) {
    event.waitUntil(openApp(`/?reschedule=${d.taskId}`));
  } else {
    event.waitUntil(openApp(d.url || '/'));
  }
});
