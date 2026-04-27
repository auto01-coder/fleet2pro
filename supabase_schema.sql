-- ================================================================
--  FleetPro — Supabase Schema
--  Esegui nel SQL Editor di Supabase
-- ================================================================

-- ── VEHICLES ────────────────────────────────────────────────────
create table if not exists public.vehicles (
  id           uuid primary key default gen_random_uuid(),

  -- Anagrafica
  targa        text not null unique,
  marca        text not null,
  modello      text not null,
  anno         smallint not null check (anno between 1990 and 2035),
  carburante   text not null default 'diesel',
  km_attuali   integer not null default 0,

  -- Contratto
  tipologia    text not null default 'leasing' check (tipologia in ('proprieta','leasing','nlt')),
  tipo_noleggio text check (tipo_noleggio in ('giornaliero','medio_termine','nessuno')),
  stato        text not null default 'disponibile' check (stato in ('disponibile','noleggiato','manutenzione','fermo')),
  km_contratto        integer,
  data_fine_contratto date,

  -- Costi IVA esclusa
  costo_mensile        numeric(10,2) not null default 0,
  costo_assicurazione  numeric(8,2),
  costo_bollo          numeric(8,2),
  costo_manutenzione   numeric(8,2),
  costo_altri          numeric(8,2),

  -- Prezzo cliente
  prezzo_mensile_cliente numeric(10,2),

  -- Scadenze
  assicurazione_data date,
  bollo_data         date,
  tagliando_data     date,
  immatricolazione   date,

  -- Documenti (path privato)
  libretto_path      text,
  assicurazione_path text,
  bollo_path         text,

  note       text,
  attivo     boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Auto updated_at
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger vehicles_updated_at
  before update on public.vehicles
  for each row execute procedure public.touch_updated_at();

-- Indici
create index if not exists idx_vehicles_attivo    on public.vehicles(attivo);
create index if not exists idx_vehicles_tipologia on public.vehicles(tipologia);
create index if not exists idx_vehicles_stato     on public.vehicles(stato);

-- ── RLS ─────────────────────────────────────────────────────────
alter table public.vehicles enable row level security;

create policy "vehicles_authenticated_all" on public.vehicles
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- ── STORAGE ─────────────────────────────────────────────────────
-- Crea manualmente il bucket "documenti" in Supabase → Storage → New Bucket
-- Settings: Private, max 20MB

-- ── DATI ESEMPIO ────────────────────────────────────────────────
-- Decommentare per inserire dati di test:
/*
insert into public.vehicles
  (targa, marca, modello, anno, carburante, km_attuali, tipologia, tipo_noleggio, stato,
   costo_mensile, prezzo_mensile_cliente, costo_assicurazione, costo_bollo,
   assicurazione_data, bollo_data, km_contratto, immatricolazione)
values
  ('AB123CD', 'BMW',       '320d Sport',   2022, 'diesel',   28000, 'leasing', 'giornaliero', 'noleggiato',  680, 1200, 1400, 280, '2025-06-30', '2025-03-31', 60000, '2022-01-15'),
  ('EF456GH', 'Mercedes',  'Classe C 220', 2023, 'diesel',   15000, 'nlt',     'medio_termine','disponibile', 750, 1100, 1200, 320, '2025-09-30', '2025-06-30', 80000, '2023-03-20'),
  ('IL789MN', 'Volkswagen','Golf 8',       2021, 'benzina',  42000, 'leasing', 'giornaliero', 'noleggiato',  420,  700,  900, 180, '2024-12-31', '2025-01-31', 50000, '2021-06-10'),
  ('OP012QR', 'Audi',      'A4 2.0 TDI',  2023, 'diesel',    8000, 'nlt',     'nessuno',     'manutenzione',800,    0, 1600, 350, '2025-12-31', '2025-12-31', 90000, '2023-09-01'),
  ('ST345UV', 'Tesla',     'Model 3',      2024, 'elettrico', 5000, 'leasing', 'giornaliero', 'disponibile', 920, 1400,  800,   0, '2026-01-31', '2025-09-30', 70000, '2024-01-20');
*/
