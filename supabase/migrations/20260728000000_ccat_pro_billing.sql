-- ===========================================================================
-- CCAT Prep Pro — billing & entitlements
--
-- Design note: users can READ their own entitlement but can never WRITE one.
-- Rows are created exclusively by the `stripe-webhook` Edge Function, which
-- authenticates with the service-role key and therefore bypasses RLS. That is
-- what makes "is this person paid?" a server-side fact rather than a client
-- claim.
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- Entitlements — one row per paying user.
-- ---------------------------------------------------------------------------
create table if not exists public.ccat_entitlements (
  user_id             uuid primary key references auth.users (id) on delete cascade,
  plan                text        not null check (plan in ('sprint', 'lifetime')),
  status              text        not null default 'active'
                                  check (status in ('active', 'refunded', 'revoked')),
  -- NULL means "never expires" (the lifetime plan).
  expires_at          timestamptz,
  stripe_customer_id  text,
  stripe_session_id   text unique,
  amount_total        integer,
  currency            text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

comment on table public.ccat_entitlements is
  'Paid access to CCAT Prep Pro. Written only by the stripe-webhook Edge Function.';

alter table public.ccat_entitlements enable row level security;

drop policy if exists "read own entitlement" on public.ccat_entitlements;
create policy "read own entitlement"
  on public.ccat_entitlements
  for select
  to authenticated
  using (auth.uid() = user_id);

-- Deliberately no insert/update/delete policies: anon and authenticated keys
-- cannot grant themselves access.

-- ---------------------------------------------------------------------------
-- Progress sync — a Pro perk, so score history follows you across devices.
-- ---------------------------------------------------------------------------
create table if not exists public.ccat_progress (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  data       jsonb       not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.ccat_progress enable row level security;

drop policy if exists "read own progress"   on public.ccat_progress;
drop policy if exists "insert own progress" on public.ccat_progress;
drop policy if exists "update own progress" on public.ccat_progress;

create policy "read own progress"
  on public.ccat_progress for select to authenticated
  using (auth.uid() = user_id);

create policy "insert own progress"
  on public.ccat_progress for insert to authenticated
  with check (auth.uid() = user_id);

create policy "update own progress"
  on public.ccat_progress for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Stripe event log — an audit trail that doubles as the webhook's idempotency
-- key. Stripe retries deliveries, so the same event id must only ever be
-- processed once.
-- ---------------------------------------------------------------------------
create table if not exists public.ccat_stripe_events (
  id          text primary key,
  type        text        not null,
  payload     jsonb       not null,
  received_at timestamptz not null default now()
);

alter table public.ccat_stripe_events enable row level security;
-- No policies at all: service role only.

-- ---------------------------------------------------------------------------
-- keep updated_at honest
-- ---------------------------------------------------------------------------
create or replace function public.ccat_touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists ccat_entitlements_touch on public.ccat_entitlements;
create trigger ccat_entitlements_touch
  before update on public.ccat_entitlements
  for each row execute function public.ccat_touch_updated_at();

drop trigger if exists ccat_progress_touch on public.ccat_progress;
create trigger ccat_progress_touch
  before update on public.ccat_progress
  for each row execute function public.ccat_touch_updated_at();
