-- ─────────────────────────────────────────────────────────────────────────────
-- 004_push_notifications.sql
-- Web push subscription storage and deduplication log.
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── push_subscriptions ───────────────────────────────────────────────────────
-- One row per browser/device. Stores the PushSubscription object returned by
-- PushManager.subscribe() plus the user's timezone and notification preferences
-- so the server-side cron can send at the right local time.

create table if not exists public.push_subscriptions (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references auth.users(id) on delete cascade,
  endpoint           text not null,
  p256dh             text not null,
  auth_key           text not null,
  timezone           text not null default 'UTC',
  notification_prefs jsonb not null default '{}',
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  unique (user_id, endpoint)
);

alter table public.push_subscriptions enable row level security;

create policy "own data"
  on public.push_subscriptions for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ─── push_notification_log ────────────────────────────────────────────────────
-- Prevents duplicate notifications on the same day. The cron upserts a row
-- before sending; if the unique constraint fires, it skips that notification.

create table if not exists public.push_notification_log (
  id        uuid primary key default gen_random_uuid(),
  user_id   uuid not null references auth.users(id) on delete cascade,
  type      text not null,
  sent_date date not null default current_date,
  sent_at   timestamptz not null default now(),
  unique (user_id, type, sent_date)
);

alter table public.push_notification_log enable row level security;

create policy "own data"
  on public.push_notification_log for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
