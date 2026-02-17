create extension if not exists "pgcrypto";

create table clinics (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);
create type user_role as enum ('clinic_admin', 'clinic_staff', 'client');

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  clinic_id uuid references clinics(id) on delete cascade,
  role user_role not null,
  created_at timestamptz not null default now()
);
create table clients (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references clinics(id) on delete cascade,
  full_name text not null,
  email text,
  phone text,
  created_at timestamptz not null default now()
);

create table client_locations (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  label text,
  address text,
  created_at timestamptz not null default now()
);


create type credit_event_type as enum (
  'purchase',
  'usage',
  'adjustment'
);

create table credit_ledger (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  delta integer not null,
  event_type credit_event_type not null,
  note text,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);


create type session_status as enum (
  'active',
  'ended',
  'auto_ended'
);

create table sessions (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  clinic_id uuid not null references clinics(id) on delete cascade,
  started_at timestamptz not null,
  auto_end_at timestamptz not null,
  ended_at timestamptz,
  status session_status not null,
  ended_reason text
);


create type session_event_type as enum (
  'session_start',
  'session_end',
  'session_auto_end',
  'credit_add',
  'credit_use',
  'client_update'
);

create table session_events (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions(id) on delete cascade,
  client_id uuid not null references clients(id) on delete cascade,
  event_type session_event_type not null,
  note text,
  created_at timestamptz not null default now()
);

create table qr_tokens (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  token_hash text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  rotated_at timestamptz
);

