create extension if not exists "pgcrypto";

create table if not exists public.payment_events (
  id uuid primary key default gen_random_uuid(),
  payment_event_id text not null unique,
  profile_id bigint,
  submission_index integer,
  event_type text not null,
  amount_cents integer,
  currency text default 'usd',
  stripe_payment_intent_id text,
  stripe_charge_id text,
  stripe_refund_id text,
  refund_type text,
  reason text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.refund_events (
  id uuid primary key default gen_random_uuid(),
  payment_event_id text not null,
  stripe_charge_id text,
  stripe_refund_id text,
  amount_cents integer not null,
  currency text default 'usd',
  reason text,
  refund_type text,
  status text not null default 'pending',
  initiated_by text,
  idempotency_key text unique,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_payment_events_profile_submission
  on public.payment_events (profile_id, submission_index);

create index if not exists idx_refund_events_payment_event
  on public.refund_events (payment_event_id);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_payment_events_updated_at on public.payment_events;
create trigger trg_payment_events_updated_at
before update on public.payment_events
for each row execute function public.touch_updated_at();

drop trigger if exists trg_refund_events_updated_at on public.refund_events;
create trigger trg_refund_events_updated_at
before update on public.refund_events
for each row execute function public.touch_updated_at();
