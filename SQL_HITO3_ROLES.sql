-- HITO 3: Roles, usuarios de clinica y auditoria

create table if not exists clinic_users (
  id uuid primary key default gen_random_uuid(),
  clinic_id text not null,
  user_id uuid,
  email text not null,
  role text not null,
  status text default 'invited',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists clinic_users_clinic_id_idx on clinic_users (clinic_id);
create index if not exists clinic_users_email_idx on clinic_users (email);

create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  clinic_id text not null,
  actor_id text,
  action text not null,
  entity text not null,
  entity_id text not null,
  changes jsonb,
  created_at timestamptz default now()
);

create index if not exists audit_logs_clinic_id_idx on audit_logs (clinic_id);
create index if not exists audit_logs_created_at_idx on audit_logs (created_at desc);

-- Trigger for updated_at
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_clinic_users_updated_at on clinic_users;
create trigger set_clinic_users_updated_at
before update on clinic_users
for each row execute procedure set_updated_at();
