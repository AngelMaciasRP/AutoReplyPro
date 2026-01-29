-- HITO 4-5: Mensajeria real + Automatizaciones

create table if not exists message_threads (
  id uuid primary key default gen_random_uuid(),
  clinic_id text not null,
  patient_id uuid,
  channel text default 'whatsapp',
  contact_number text not null,
  contact_name text,
  status text default 'open',
  last_message_at timestamptz default now(),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists message_threads_clinic_idx on message_threads (clinic_id);
create index if not exists message_threads_patient_idx on message_threads (patient_id);
create index if not exists message_threads_last_idx on message_threads (last_message_at desc);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  clinic_id text not null,
  thread_id uuid not null references message_threads(id) on delete cascade,
  direction text not null, -- in | out
  body text,
  status text default 'sent',
  created_at timestamptz default now()
);

create index if not exists messages_thread_idx on messages (thread_id, created_at desc);

create table if not exists automation_rules (
  id uuid primary key default gen_random_uuid(),
  clinic_id text not null,
  name text not null,
  trigger text not null, -- appointment_created, appointment_confirmed, reminder_24h, reminder_6h
  channel text not null, -- whatsapp, email
  enabled boolean default true,
  template text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists automation_rules_clinic_idx on automation_rules (clinic_id);

-- Trigger updated_at
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_message_threads_updated_at on message_threads;
create trigger set_message_threads_updated_at
before update on message_threads
for each row execute procedure set_updated_at();

drop trigger if exists set_automation_rules_updated_at on automation_rules;
create trigger set_automation_rules_updated_at
before update on automation_rules
for each row execute procedure set_updated_at();
