import { createClient } from 'npm:@supabase/supabase-js@2';
import webpush from 'npm:web-push@3.6.7';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const supabase = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

const LEAD_MINUTES = 10;
const SUMMARY_HOUR = 8;
// How late an alert may still go out if a cron tick was missed or delayed.
const CATCH_UP_MS = 15 * 60_000;

type Secrets = {
  vapid_public_key: string;
  vapid_private_key: string;
  cron_secret: string;
  action_secret: string;
};

type Subscription = {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  timezone: string;
};

type Task = {
  id: string;
  user_id: string;
  title: string;
  workspace: string;
  priority: string;
  status: string;
  due_date: string | null;
  due_time: string | null;
  clients: { name: string } | null;
};

type Outgoing = {
  fire_key: string;
  user_id: string;
  task_id: string | null;
  kind: string;
  payload: Record<string, unknown>;
};

let secretsPromise: Promise<Secrets> | null = null;
function getSecrets(): Promise<Secrets> {
  if (!secretsPromise) {
    secretsPromise = supabase.rpc('get_push_secrets').then(({ data, error }) => {
      if (error) throw error;
      return data as Secrets;
    });
  }
  return secretsPromise;
}

function zonedParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(date);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  return { y: get('year'), m: get('month'), d: get('day'), hh: get('hour'), mm: get('minute'), ss: get('second') };
}

function offsetMs(date: Date, timeZone: string) {
  const p = zonedParts(date, timeZone);
  return Date.UTC(p.y, p.m - 1, p.d, p.hh, p.mm, p.ss) - Math.floor(date.getTime() / 1000) * 1000;
}

// Task dates/times are stored as wall-clock values in the user's own timezone.
function zonedToUtcMs(dateStr: string, timeStr: string, timeZone: string) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const [hh, mm] = timeStr.split(':').map(Number);
  const wall = Date.UTC(y, m - 1, d, hh, mm);
  let utc = wall - offsetMs(new Date(wall), timeZone);
  utc = wall - offsetMs(new Date(utc), timeZone);
  return utc;
}

function localDateString(date: Date, timeZone: string) {
  const p = zonedParts(date, timeZone);
  return `${p.y}-${String(p.m).padStart(2, '0')}-${String(p.d).padStart(2, '0')}`;
}

function format12h(timeStr: string) {
  const [h, m] = timeStr.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${suffix}`;
}

async function actionToken(secret: string, taskId: string, userId: string) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${taskId}.${userId}`));
  return Array.from(new Uint8Array(sig), (b) => b.toString(16).padStart(2, '0')).join('');
}

function taskBody(task: Task) {
  const bits = [task.due_time ? format12h(task.due_time) : null, task.clients?.name ?? task.workspace, task.priority];
  return bits.filter(Boolean).join(' · ');
}

async function taskAlert(task: Task, kind: 'before' | 'due', minutesLeft: number, secrets: Secrets) {
  const title = kind === 'due' ? `Now: ${task.title}` : `In ${minutesLeft} min: ${task.title}`;
  return {
    title,
    body: taskBody(task),
    tag: `task-${task.id}`,
    requireInteraction: kind === 'due',
    actions: [
      { action: 'done', title: 'Done' },
      { action: 'reschedule', title: 'Reschedule' },
    ],
    data: {
      taskId: task.id,
      userId: task.user_id,
      url: `/?task=${task.id}`,
      actionUrl: `${SUPABASE_URL}/functions/v1/notification-action`,
      actionToken: await actionToken(secrets.action_secret, task.id, task.user_id),
    },
  };
}

async function summaryAlert(userId: string, today: string) {
  const { data, error } = await supabase
    .from('tasks')
    .select('title, due_date, due_time')
    .eq('user_id', userId)
    .neq('status', 'done')
    .lte('due_date', today)
    .order('due_time', { ascending: true, nullsFirst: false });
  if (error) throw error;
  const todays = (data ?? []).filter((t) => t.due_date === today);
  const overdue = (data ?? []).length - todays.length;

  const lines = todays.slice(0, 5).map((t) => (t.due_time ? `${format12h(t.due_time)} ${t.title}` : t.title));
  if (todays.length > 5) lines.push(`+${todays.length - 5} more`);
  if (overdue > 0) lines.push(`${overdue} overdue`);

  return {
    title: todays.length ? `Today: ${todays.length} task${todays.length === 1 ? '' : 's'}` : 'Nothing due today',
    body: lines.join('\n') || 'Enjoy the clear day.',
    tag: `summary-${today}`,
    data: { url: '/' },
  };
}

Deno.serve(async (req) => {
  const secrets = await getSecrets();
  if (req.headers.get('x-cron-secret') !== secrets.cron_secret) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { data: subs, error: subsError } = await supabase
    .from('push_subscriptions')
    .select('id, user_id, endpoint, p256dh, auth, timezone');
  if (subsError) return Response.json({ error: subsError.message }, { status: 500 });
  if (!subs?.length) return Response.json({ sent: 0 });

  const subsByUser = new Map<string, Subscription[]>();
  for (const s of subs as Subscription[]) {
    subsByUser.set(s.user_id, [...(subsByUser.get(s.user_id) ?? []), s]);
  }

  const now = new Date();
  const nowMs = now.getTime();
  const windowStart = new Date(nowMs - 2 * 86_400_000).toISOString().slice(0, 10);
  const windowEnd = new Date(nowMs + 2 * 86_400_000).toISOString().slice(0, 10);

  const { data: tasks, error: tasksError } = await supabase
    .from('tasks')
    .select('id, user_id, title, workspace, priority, status, due_date, due_time, clients(name)')
    .in('user_id', [...subsByUser.keys()])
    .neq('status', 'done')
    .not('due_time', 'is', null)
    .gte('due_date', windowStart)
    .lte('due_date', windowEnd);
  if (tasksError) return Response.json({ error: tasksError.message }, { status: 500 });

  const outgoing: Outgoing[] = [];

  for (const task of (tasks ?? []) as unknown as Task[]) {
    const tz = subsByUser.get(task.user_id)![0].timezone;
    const dueMs = zonedToUtcMs(task.due_date!, task.due_time!, tz);
    const stamp = `${task.due_date}T${task.due_time!.slice(0, 5)}`;

    let kind: 'before' | 'due' | null = null;
    if (nowMs >= dueMs && nowMs - dueMs < CATCH_UP_MS) kind = 'due';
    else if (nowMs < dueMs && nowMs >= dueMs - LEAD_MINUTES * 60_000) kind = 'before';
    if (!kind) continue;

    const minutesLeft = Math.max(1, Math.ceil((dueMs - nowMs) / 60_000));
    outgoing.push({
      fire_key: `${task.id}:${kind}:${stamp}`,
      user_id: task.user_id,
      task_id: task.id,
      kind,
      payload: await taskAlert(task, kind, minutesLeft, secrets),
    });
  }

  for (const [userId, userSubs] of subsByUser) {
    const tz = userSubs[0].timezone;
    const local = zonedParts(now, tz);
    if (local.hh === SUMMARY_HOUR && local.mm < 15) {
      const today = localDateString(now, tz);
      outgoing.push({
        fire_key: `summary:${userId}:${today}`,
        user_id: userId,
        task_id: null,
        kind: 'summary',
        payload: await summaryAlert(userId, today),
      });
    }
  }

  if (!outgoing.length) return Response.json({ sent: 0 });

  // Claim each alert first so overlapping cron runs can never double-send.
  const { data: claimed, error: claimError } = await supabase
    .from('notification_log')
    .upsert(
      outgoing.map(({ fire_key, user_id, task_id, kind }) => ({ fire_key, user_id, task_id, kind })),
      { onConflict: 'fire_key', ignoreDuplicates: true }
    )
    .select('fire_key');
  if (claimError) return Response.json({ error: claimError.message }, { status: 500 });
  const claimedKeys = new Set((claimed ?? []).map((c) => c.fire_key));

  webpush.setVapidDetails(SUPABASE_URL, secrets.vapid_public_key, secrets.vapid_private_key);

  let sent = 0;
  const deadSubs = new Set<string>();
  await Promise.all(
    outgoing
      .filter((o) => claimedKeys.has(o.fire_key))
      .flatMap((o) =>
        subsByUser.get(o.user_id)!.map(async (s) => {
          try {
            await webpush.sendNotification(
              { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
              JSON.stringify(o.payload),
              { TTL: 3600, urgency: 'high' }
            );
            sent++;
          } catch (err) {
            const status = (err as { statusCode?: number }).statusCode;
            if (status === 404 || status === 410) deadSubs.add(s.id);
            else console.error('push failed', status, (err as Error).message);
          }
        })
      )
  );

  if (deadSubs.size) await supabase.from('push_subscriptions').delete().in('id', [...deadSubs]);
  if (now.getUTCMinutes() === 0) {
    await supabase.from('notification_log').delete().lt('sent_at', new Date(nowMs - 30 * 86_400_000).toISOString());
  }

  return Response.json({ sent, removed: deadSubs.size });
});
