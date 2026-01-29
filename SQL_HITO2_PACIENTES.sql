-- HITO 2: Pacientes + Historia Clinica + Archivos + Sobreturnos

-- 1) Pacientes
create table if not exists patients (
  id uuid primary key default uuid_generate_v4(),
  clinic_id text not null,
  full_name text not null,
  phone text,
  email text,
  dob date,
  address text,
  notes text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamp default now(),
  updated_at timestamp default now(),
  unique (clinic_id, phone)
);

create index if not exists idx_patients_clinic on patients (clinic_id);
create index if not exists idx_patients_name on patients (full_name);

-- 2) Historia clinica
create table if not exists patient_history (
  id uuid primary key default uuid_generate_v4(),
  clinic_id text not null,
  patient_id uuid not null,
  appointment_id uuid,
  treatment_id uuid,
  notes text,
  visited_at timestamp default now(),
  next_treatment_id uuid,
  next_visit_at timestamp,
  created_at timestamp default now(),
  updated_at timestamp default now(),
  foreign key (patient_id) references patients(id) on delete cascade,
  foreign key (appointment_id) references appointments(id) on delete set null,
  foreign key (treatment_id) references treatments(id) on delete set null,
  foreign key (next_treatment_id) references treatments(id) on delete set null
);

create index if not exists idx_patient_history_clinic on patient_history (clinic_id);
create index if not exists idx_patient_history_patient on patient_history (patient_id);
create index if not exists idx_patient_history_visit on patient_history (visited_at desc);

-- 3) Archivos clinicos (radiografias/panoramicas)
create table if not exists patient_files (
  id uuid primary key default uuid_generate_v4(),
  clinic_id text not null,
  patient_id uuid not null,
  file_url text not null,
  storage_path text,
  file_name text,
  file_type text default 'other',
  taken_at date,
  notes text,
  created_at timestamp default now(),
  updated_at timestamp default now(),
  foreign key (patient_id) references patients(id) on delete cascade
);

create index if not exists idx_patient_files_clinic on patient_files (clinic_id);
create index if not exists idx_patient_files_patient on patient_files (patient_id);

-- 4) Sobreturnos y multiples pacientes por slot
alter table clinic_settings
  add column if not exists max_appointments_per_slot int default 2,
  add column if not exists overbooking_extra_fee numeric(10,2) default 0,
  add column if not exists overbooking_fee_type text default 'fixed',
  add column if not exists language text default 'es';

-- 5) Datos extra en turnos
alter table appointments
  add column if not exists patient_id uuid,
  add column if not exists overbooked boolean default false,
  add column if not exists extra_fee numeric(10,2) default 0;

create index if not exists idx_appointments_patient on appointments (patient_id);

-- 6) Historial de cambios de turnos (opcional)
create table if not exists appointment_changes (
  id uuid primary key default uuid_generate_v4(),
  clinic_id text not null,
  appointment_id uuid not null,
  change_type text check (change_type in ('reschedule','confirm','cancel','create')),
  old_value jsonb,
  new_value jsonb,
  changed_by text,
  changed_at timestamp default now(),
  foreign key (appointment_id) references appointments(id) on delete cascade
);

create index if not exists idx_appointment_changes_clinic on appointment_changes (clinic_id);
create index if not exists idx_appointment_changes_changed on appointment_changes (changed_at desc);
