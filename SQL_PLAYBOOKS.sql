-- Playbooks odontologicos por tratamiento
-- Ejecutar en Supabase SQL Editor

create table if not exists treatment_playbooks (
  id uuid primary key default uuid_generate_v4(),
  clinic_id uuid not null,
  treatment_id uuid not null,
  title text not null,
  description text,
  steps jsonb not null default '[]'::jsonb,
  supplies jsonb not null default '[]'::jsonb,
  duration_minutes integer,
  notes_template text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create index if not exists idx_playbooks_clinic on treatment_playbooks (clinic_id);
create index if not exists idx_playbooks_treatment on treatment_playbooks (treatment_id);

-- trigger updated_at
create or replace function set_updated_at_playbooks()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_set_updated_at_playbooks on treatment_playbooks;
create trigger trg_set_updated_at_playbooks
before update on treatment_playbooks
for each row execute function set_updated_at_playbooks();
