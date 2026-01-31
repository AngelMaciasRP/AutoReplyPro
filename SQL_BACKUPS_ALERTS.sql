-- Backups + Alertas (capa SaaS)

create table if not exists backups (
  id uuid primary key default gen_random_uuid(),
  clinic_id text not null,
  label text,
  status text default 'completed', -- completed | pending | failed
  storage_url text,
  size_mb numeric,
  created_at timestamptz default now()
);

create index if not exists backups_clinic_idx on backups (clinic_id, created_at desc);

create table if not exists alert_rules (
  id uuid primary key default gen_random_uuid(),
  clinic_id text not null,
  name text not null,
  event_type text not null, -- appointment_created, appointment_cancelled, billing, etc.
  channel text default 'email', -- email | whatsapp | webhook
  target text, -- email/phone/url
  enabled boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists alert_rules_clinic_idx on alert_rules (clinic_id);

create table if not exists alert_notifications (
  id uuid primary key default gen_random_uuid(),
  clinic_id text not null,
  rule_id uuid references alert_rules(id) on delete set null,
  event_type text not null,
  payload jsonb,
  status text default 'sent', -- sent | failed
  created_at timestamptz default now()
);

create index if not exists alert_notifications_clinic_idx on alert_notifications (clinic_id, created_at desc);

-- trigger updated_at for alert_rules
create or replace function set_updated_at_alerts()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_alert_rules_updated_at on alert_rules;
create trigger set_alert_rules_updated_at
before update on alert_rules
for each row execute procedure set_updated_at_alerts();
