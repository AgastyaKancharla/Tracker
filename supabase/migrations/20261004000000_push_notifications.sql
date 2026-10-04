-- Applied to project byfswmgmcfrcuullcbyh. Secrets (VAPID keys, cron_secret, action_secret)
-- live in Supabase Vault and are intentionally not in this file.
create extension if not exists pg_cron;
create extension if not exists pg_net;

create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  timezone text not null default 'Asia/Kolkata',
  user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index push_subscriptions_user_id_idx on public.push_subscriptions(user_id);
alter table public.push_subscriptions enable row level security;
create policy "own subscriptions select" on public.push_subscriptions for select to authenticated using ((select auth.uid()) = user_id);
create policy "own subscriptions insert" on public.push_subscriptions for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "own subscriptions update" on public.push_subscriptions for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "own subscriptions delete" on public.push_subscriptions for delete to authenticated using ((select auth.uid()) = user_id);

-- Written only by the reminder sender (service role); dedupes alerts.
create table public.notification_log (
  fire_key text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  task_id uuid references public.tasks(id) on delete cascade,
  kind text not null,
  sent_at timestamptz not null default now()
);
create index notification_log_sent_at_idx on public.notification_log(sent_at);
alter table public.notification_log enable row level security;

create or replace function public.get_push_secrets()
returns json
language sql
security definer
set search_path = ''
as $$
  select json_object_agg(name, decrypted_secret)
  from vault.decrypted_secrets
  where name in ('vapid_public_key', 'vapid_private_key', 'cron_secret', 'action_secret');
$$;
revoke execute on function public.get_push_secrets() from public, anon, authenticated;
grant execute on function public.get_push_secrets() to service_role;

select cron.schedule(
  'send-task-reminders',
  '* * * * *',
  $$
  select net.http_post(
    url := 'https://byfswmgmcfrcuullcbyh.supabase.co/functions/v1/send-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 20000
  );
  $$
);
