import { createClient } from 'npm:@supabase/supabase-js@2';

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'content-type',
};

let actionSecret: Promise<string> | null = null;
function getActionSecret() {
  if (!actionSecret) {
    actionSecret = supabase.rpc('get_push_secrets').then(({ data, error }) => {
      if (error) throw error;
      return (data as { action_secret: string }).action_secret;
    });
  }
  return actionSecret;
}

async function isValidToken(taskId: string, userId: string, token: string) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(await getActionSecret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify']
  );
  const sig = token.match(/^[0-9a-f]{64}$/) ? new Uint8Array(token.match(/../g)!.map((h) => parseInt(h, 16))) : null;
  if (!sig) return false;
  return crypto.subtle.verify('HMAC', key, sig, new TextEncoder().encode(`${taskId}.${userId}`));
}

function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: CORS });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  let body: { action?: string; taskId?: string; userId?: string; token?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid body' }, 400);
  }
  const { action, taskId, userId, token } = body;
  if (action !== 'done' || !taskId || !userId || !token) return json({ error: 'Bad request' }, 400);
  if (!(await isValidToken(taskId, userId, token))) return json({ error: 'Invalid token' }, 403);

  const { data: sub } = await supabase
    .from('push_subscriptions')
    .select('timezone')
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle();
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: sub?.timezone ?? 'Asia/Kolkata' }).format(new Date());

  const { data, error } = await supabase
    .from('tasks')
    .update({ status: 'done', completed_at: today })
    .eq('id', taskId)
    .eq('user_id', userId)
    .select('title')
    .maybeSingle();
  if (error) return json({ error: error.message }, 500);
  if (!data) return json({ error: 'Task not found' }, 404);

  return json({ ok: true, title: data.title });
});
