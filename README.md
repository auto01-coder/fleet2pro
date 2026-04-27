# FleetPro — Gestione Flotta

Dashboard SaaS per gestione e analisi flotta auto.  
**Stack**: Next.js 14.2.5 · TypeScript · Tailwind CSS · Supabase · Recharts

---

## 🚀 Avvio rapido

```bash
# 1. Installa
npm install

# 2. Configura .env.local
cp .env.example .env.local
# → inserisci NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY

# 3. Setup database
# Vai su Supabase → SQL Editor → incolla supabase_schema.sql → Esegui

# 4. Avvia
npm run dev
```

Apri [http://localhost:3000](http://localhost:3000)

---

## 🗂 Struttura

```
app/
  (auth)/login/         ← login page (dark)
  (app)/
    layout.tsx          ← auth check client-side (niente middleware)
    dashboard/          ← KPI + grafici Bloomberg-style
    flotta/             ← lista veicoli
    flotta/[id]/        ← dettaglio + P&L
    flotta/nuova/       ← aggiungi veicolo
    flotta/[id]/modifica/ ← modifica veicolo
lib/
  supabaseClient.ts     ← singleton Supabase browser client
  types.ts              ← tutti i tipi TypeScript
  utils.ts              ← logica business pura (margini, alert, revisione)
  api.ts                ← query Supabase
  actions.ts            ← server actions per i form
components/
  ui/index.tsx          ← StatCard, ChartCard, Badge, Button, Input...
  Sidebar.tsx           ← sidebar fissa sinistra
  dashboard/ProfitChart.tsx ← grafici Recharts
  flotta/VehicleTable.tsx   ← tabella avanzata
  flotta/VehicleForm.tsx    ← form completo con P&L live
```

---

## 💰 Logica Business

```
costo_totale_mensile = costo_mensile + (assic + bollo + manu) / 12
costo_giornaliero    = costo_totale / 30
ricavo_giornaliero   = prezzo_cliente / 30
margine_mensile      = ricavo_mensile - costo_totale_mensile
```

### Alert scadenze
- Critico  → < 0 giorni (scaduto)
- Warning  → < 15 giorni
- OK       → > 15 giorni

### Revisione auto
- Prima revisione: 4 anni dopo immatricolazione
- Poi ogni 2 anni

---

## ⚙️ .env.local

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

---

## 🚢 Deploy Vercel

```bash
npx vercel --prod
```

Aggiungi le stesse variabili su Vercel → Settings → Environment Variables.

---

## 🔧 Perché NO middleware

L'auth check è fatto **lato client** nel layout `(app)/layout.tsx`.  
Questo evita:
- Loop redirect
- Errori webpack cache con Node 24
- Crash build Vercel
- Complessità inutile con `@supabase/ssr`

La sessione viene verificata con `supabase.auth.getSession()` al mount.
