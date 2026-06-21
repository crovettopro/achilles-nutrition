-- Aquiles Nutrition — esquema Supabase Postgres
-- Pega TODO esto en Supabase → SQL Editor → New query → Run.
-- Es idempotente: puedes ejecutarlo varias veces sin romper nada.

-- ---------- users ----------
create table if not exists public.users (
  id            text primary key,
  email         text unique not null,
  password_hash text not null,
  role          text not null check (role in ('athlete', 'coach')),
  name          text not null,
  coach_code    text,
  coach_id      text references public.users (id) on delete set null,
  created_at    timestamptz not null default now()
);
create index if not exists users_email_idx      on public.users (lower(email));
create index if not exists users_coach_code_idx  on public.users (coach_code);
create index if not exists users_coach_id_idx     on public.users (coach_id);

-- ---------- profiles (1:1 con users) ----------
create table if not exists public.profiles (
  user_id   text primary key references public.users (id) on delete cascade,
  goal      text,
  age       integer,
  weight    numeric,
  height    numeric,
  activity  text,
  onboarded boolean not null default false
);

-- ---------- meals (un array jsonb por usuario; se reemplaza entero) ----------
create table if not exists public.meals (
  user_id text primary key references public.users (id) on delete cascade,
  items   jsonb not null default '[]'::jsonb
);

-- ---------- checkins (un array jsonb por usuario; se reemplaza entero) ----------
create table if not exists public.checkins (
  user_id text primary key references public.users (id) on delete cascade,
  items   jsonb not null default '[]'::jsonb
);

-- ---------- alcohol (un array jsonb por usuario; se reemplaza entero) ----------
create table if not exists public.alcohol (
  user_id text primary key references public.users (id) on delete cascade,
  items   jsonb not null default '[]'::jsonb
);

-- ---------- messages (coach ↔ athlete) ----------
create table if not exists public.messages (
  id         text primary key,
  from_id    text not null references public.users (id) on delete cascade,
  to_id      text not null references public.users (id) on delete cascade,
  text       text not null,
  created_at timestamptz not null default now()
);
create index if not exists messages_pair_idx on public.messages (from_id, to_id, created_at);

-- ---------- Seguridad ----------
-- Activamos RLS sin políticas públicas: el servidor entra con la SERVICE_ROLE key
-- (que se salta RLS), y la anon/public key NO puede leer ni escribir nada.
alter table public.users    enable row level security;
alter table public.profiles enable row level security;
alter table public.meals    enable row level security;
alter table public.checkins enable row level security;
alter table public.alcohol  enable row level security;
alter table public.messages enable row level security;
