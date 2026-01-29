-- HITO 6: Billing + Observabilidad + Backups/Compliance (estructuras base)

create table if not exists billing_plans (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price_cents int not null,
  currency text default 'USD',
  interval text default 'month',
  limits jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create table if not exists billing_subscriptions (
  id uuid primary key default gen_random_uuid(),
  clinic_id text not null,
  plan_id uuid references billing_plans(id),
  status text default 'trial',
  current_period_end timestamptz,
  created_at timestamptz default now()
);

create index if not exists billing_subscriptions_clinic_idx on billing_subscriptions (clinic_id);

create table if not exists system_events (
  id uuid primary key default gen_random_uuid(),
  clinic_id text,
  event_type text not null,
  payload jsonb,
  created_at timestamptz default now()
);

create index if not exists system_events_type_idx on system_events (event_type);
