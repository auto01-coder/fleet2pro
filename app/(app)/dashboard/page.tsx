'use server'
import Link from 'next/link'
import React from 'react'
import { getVehicles } from '@/lib/api'
import { buildKpi, buildCashFlow, euro, euroSigned, daysUntil } from '@/lib/utils'
import type { VehicleProfit, CashFlowMese } from '@/lib/types'
import { StatCard, ChartCard, Badge } from '@/components/ui'
import { MargineChart, CostiRicaviChart, CashFlowChart } from '@/components/dashboard/ProfitChart'
import MarginBarChart from '@/components/dashboard/MarginBarChart'
import ProfitDistributionPie from '@/components/dashboard/ProfitDistributionPie'
import VehicleTable from '@/components/flotta/VehicleTable'

async function getDashboardData() {
  const vehicles = await getVehicles()

  const enriched = vehicles.map(v => {
    // Financial model per vehicle
    const isLease = v.tipologia === 'leasing' || v.tipologia === 'nlt'

    // 1) costo mensile
    const costoMensile = isLease
      ? (v.costo_mensile ?? 0)
      : (((v.costo_assicurazione ?? 0) + (v.costo_bollo ?? 0) + (v.costo_manutenzione ?? 0) + (v.costo_altri ?? 0)) / 12)

    // 2) costo giornaliero
    const costoGiorno = +(costoMensile / 30)

    // 3) ricavo giornaliero
    const ricavoGiorno = v.tipo_noleggio === 'giornaliero'
      ? (v.prezzo_giorno ?? 0)
      : (v.tipo_noleggio === 'medio_termine' ? ((v.prezzo_mensile_cliente ?? 0) / 30) : 0)

    // 4) ricavo mensile
    const ricavoMensile = v.tipo_noleggio === 'giornaliero'
      ? ((v.prezzo_giorno ?? 0) * 30)
      : (v.prezzo_mensile_cliente ?? 0)

    // 5) margini
    const margineGiorno = +(ricavoGiorno - costoGiorno)
    const margineMensile = +(ricavoMensile - costoMensile)

    // Use only data_fine_noleggio_cliente for expiration alerts
    const giorniContratto = daysUntil((v as any).data_fine_noleggio_cliente ?? null)

    return {
      ...v,
      // camelCase fields (new naming for UI clarity)
      spesaGiorno: +costoGiorno.toFixed(2),
      incassoGiorno: +ricavoGiorno.toFixed(2),
      differenzaGiorno: +margineGiorno.toFixed(2),
      spesaMese: +costoMensile.toFixed(2),
      incassoMese: +ricavoMensile.toFixed(2),
      differenzaMese: +margineMensile.toFixed(2),

      // backwards-compatible camel/snake (some components still expect these)
      costoGiorno: +costoGiorno.toFixed(2),
      ricavoGiorno: +ricavoGiorno.toFixed(2),
      margineGiorno: +margineGiorno.toFixed(2),
      costoMensile: +costoMensile.toFixed(2),
      ricavoMensile: +ricavoMensile.toFixed(2),
      margineMensile: +margineMensile.toFixed(2),

      // snake_case aliases
      spesa_giorno: +costoGiorno.toFixed(2),
      incasso_giorno: +ricavoGiorno.toFixed(2),
      differenza_giorno: +margineGiorno.toFixed(2),
      spesa_mese: +costoMensile.toFixed(2),
      incasso_mese: +ricavoMensile.toFixed(2),
      differenza_mese: +margineMensile.toFixed(2),

      // legacy keys for compatibility
      costo_giornaliero: +costoGiorno.toFixed(2),
      ricavo_giornaliero: +ricavoGiorno.toFixed(2),
      margine_giornaliero: +margineGiorno.toFixed(2),
      costo_totale_mensile: +costoMensile.toFixed(2),
      ricavo_mensile: +ricavoMensile.toFixed(2),
      margine_mensile: +margineMensile.toFixed(2),

      // keep `margine` as monthly margin for existing visualizations
      margine: +margineMensile.toFixed(2),
      giorniContratto,
    }
  })

  const margineMensileTotale = enriched.reduce((s, x) => s + (x.margine || 0), 0)
  const margineGiornalieroTotale = enriched.reduce((s, x) => s + ((x as any).differenzaGiorno ?? (x as any).margineGiorno ?? (x as any).margine_giornaliero ?? 0), 0)
  const spesaGiornoTotale = enriched.reduce((s, x) => s + ((x as any).spesaGiorno ?? (x as any).costoGiorno ?? (x as any).costo_giornaliero ?? 0), 0)
  const incassoGiornoTotale = enriched.reduce((s, x) => s + ((x as any).incassoGiorno ?? (x as any).ricavoGiorno ?? (x as any).ricavo_giornaliero ?? 0), 0)
  const spesaMeseTotale = enriched.reduce((s, x) => s + ((x as any).spesaMese ?? (x as any).costoMensile ?? (x as any).costo_totale_mensile ?? 0), 0)
  const incassoMeseTotale = enriched.reduce((s, x) => s + ((x as any).incassoMese ?? (x as any).ricavoMensile ?? (x as any).ricavo_mensile ?? 0), 0)
  const veicoliAttivi = vehicles.length
  // list of vehicles currently in perdita (monthly profit < 0)
  const veicoliInPerditaList = enriched.filter(v => ((v as any).differenzaMese ?? v.margine ?? 0) < 0)
  const veicoliInPerdita = veicoliInPerditaList.length
  const totalePerditaMensile = veicoliInPerditaList.reduce((s, v) => s + ((v as any).differenzaMese ?? v.margine ?? 0), 0)
  const scadenze = enriched.filter(v => v.giorniContratto !== null && v.giorniContratto <= 7 && v.giorniContratto >= 0).length

  const kpi = buildKpi(vehicles)
  const cashFlow = buildCashFlow(enriched as any, 12)

  // Top 3 worst vehicles (by monthly loss)
  const worstVehicles = veicoliInPerditaList
    .slice()
    .sort((a,b) => ((a as any).differenzaMese ?? a.margine) - ((b as any).differenzaMese ?? b.margine))
    .slice(0,3)
    .map(v => ({ id: v.id, targa: v.targa, modello: v.modello, perdita: Math.abs(((v as any).differenzaMese ?? v.margine) ?? 0) }))

  return {
    vehicles,
    enriched,
    kpi,
    cashFlow,
    totals: {
      // monthly/daily totals
      margineTotale: margineMensileTotale,
      margineGiornalieroTotale,
      spesaGiornoTotale,
      incassoGiornoTotale,
      spesaMeseTotale,
      incassoMeseTotale,
      differenzaGiornoTotale: margineGiornalieroTotale,
      differenzaMeseTotale: margineMensileTotale,
      veicoliAttivi,
      veicoliInPerdita,
      totalePerditaMensile,
      worstVehicles,
      scadenze,
    },
  }
}

export default async function DashboardPage() {
  const now = new Date().toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const { vehicles, enriched, kpi, cashFlow, totals } = await getDashboardData()

  const margineMedio = vehicles.length > 0 ? totals.margineTotale / vehicles.length : 0

  // Daily series (last 30 days) using per-vehicle daily values
  const DAYS = 30
  const SHORT_MONTHS = ['Gen','Feb','Mar','Apr','Mag','Giu','Lug','Ago','Set','Ott','Nov','Dic']
  const today = new Date()
  const dailyFlow = Array.from({ length: DAYS }, (_, i) => {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - (DAYS - 1 - i))
    const label = `${d.getDate()} ${SHORT_MONTHS[d.getMonth()]}`
    const costi = enriched.reduce((s, v) => s + ((v as any).spesaGiorno ?? (v as any).costoGiorno ?? (v as any).costo_giornaliero ?? 0), 0)
    const ricavi = enriched.reduce((s, v) => s + ((v as any).incassoGiorno ?? (v as any).ricavoGiorno ?? (v as any).ricavo_giornaliero ?? 0), 0)
    const profit = +(ricavi - costi)
    return { label, costi: +costi.toFixed(2), ricavi: +ricavi.toFixed(2), margine: +profit.toFixed(2) }
  })

  const barData = enriched
    .slice()
    .sort((a, b) => a.margine - b.margine)
    .map(v => ({ targa: v.targa, margine: Math.round(v.margine) }))
  const profitCount = enriched.filter(v => ((v as any).differenzaMese ?? v.margine ?? 0) >= 0).length
  const lossCount = enriched.length - profitCount
  const pieData = [
    { name: 'Profittevoli', value: profitCount },
    { name: 'In perdita', value: lossCount },
  ]

  const soonExpiring = enriched.filter(v => v.giorniContratto !== null && v.giorniContratto <= 7).sort((a,b) => (a.giorniContratto ?? 0) - (b.giorniContratto ?? 0))

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="sticky top-0 z-10 bg-white border-b border-slate-100 shadow-sm px-8 h-16 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Dashboard</h1>
          <p className="text-xs text-slate-400 capitalize">{now}</p>
        </div>
        <div className="flex items-center gap-3">
          {kpi && kpi.alert_scadenze > 0 && <Badge variant="red" dot>{kpi.alert_scadenze} alert</Badge>}
          {kpi && kpi.veicoli_in_perdita > 0 && <Badge variant="yellow" dot>{kpi.veicoli_in_perdita} perdita</Badge>}
          <Link href="/flotta/nuova" className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-all">Aggiungi Auto</Link>
        </div>
      </div>

      <div className="px-8 py-8 max-w-[1400px] mx-auto space-y-6">
        {/* ALERT PANEL */}
        {soonExpiring.length > 0 && (
          <div className="bg-white rounded-2xl border border-amber-50 shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="text-2xl">🔔</div>
                <div>
                  <div className="text-sm font-semibold">Contratti in scadenza</div>
                  <div className="text-xs text-slate-500">{soonExpiring.length} contratti scaduti o in scadenza entro 7 giorni</div>
                </div>
              </div>
              <Link href="/flotta" className="text-xs text-slate-500">Gestisci →</Link>
            </div>
            <div className="mt-3 grid grid-cols-4 gap-3">
              {soonExpiring.slice(0,6).map(v => (
                <div key={v.id} className="bg-slate-50 rounded-xl px-3 py-2 text-xs flex items-center justify-between">
                  <div>
                    <div className="font-mono font-semibold text-slate-900">{v.targa}</div>
                    <div className="text-[11px] text-slate-500">{v.marca} {v.modello}</div>
                  </div>
                  <div className="text-sm font-semibold" style={{ color: v.giorniContratto !== null && v.giorniContratto < 0 ? '#ef4444' : '#f59e0b' }}>
                    {v.giorniContratto !== null ? (v.giorniContratto < 0 ? `${Math.abs(v.giorniContratto)}gg fa` : `${v.giorniContratto}gg`) : '—'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Fleet loss banner (detailed) */}
        {totals.veicoliInPerdita > 0 && (
          <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-red-700">
            <div className="flex items-start gap-4">
              <div className="text-2xl">⚠️</div>
              <div className="flex-1">
                {totals.veicoliInPerdita === 1 ? (
                  <div className="font-semibold">L’auto {totals.worstVehicles?.[0]?.targa} - {totals.worstVehicles?.[0]?.modello} è in perdita di {'-'}{euro(Math.abs(totals.worstVehicles?.[0]?.perdita ?? 0))}</div>
                ) : (
                  <div className="font-semibold">{totals.veicoliInPerdita} veicoli in perdita (totale {'-'}{euro(Math.abs(totals.totalePerditaMensile ?? 0))}/mese)</div>
                )}
                {totals.worstVehicles && totals.worstVehicles.length > 0 && (
                  <div className="mt-2 text-sm text-red-700">
                    <div className="font-semibold text-xs text-slate-700">Top {totals.worstVehicles.length} veicoli peggiori</div>
                    <ul className="mt-2 space-y-1">
                      {totals.worstVehicles.map((w: any) => (
                        <li key={w.id} className="text-xs text-slate-700">{w.targa} · {w.modello} — {'-'}{euro(Math.abs(w.perdita))}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Profit-first KPI row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <StatCard
            label="Profitto Giornaliero"
            value={euroSigned(totals.differenzaGiornoTotale)}
            sub={totals.differenzaGiornoTotale >= 0 ? 'GUADAGNO' : 'PERDITA'}
            icon="📊"
            accentColor={totals.differenzaGiornoTotale >= 0 ? '#10b981' : '#ef4444'}
            valueClassName="text-3xl"
          />
          <StatCard
            label="Profitto Mensile"
            value={euroSigned(totals.differenzaMeseTotale)}
            sub={totals.differenzaMeseTotale >= 0 ? 'GUADAGNO' : 'PERDITA'}
            icon="💰"
            accentColor={totals.differenzaMeseTotale >= 0 ? '#10b981' : '#ef4444'}
            valueClassName="text-3xl"
          />
        </div>

        {/* Secondary cards: incasso / spesa (day / month) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Incasso Giornaliero" value={euroSigned(totals.incassoGiornoTotale)} sub="Incasso giorno" icon="📈" accentColor="#10b981" />
          <StatCard label="Spesa Giornaliera" value={euroSigned(-totals.spesaGiornoTotale)} sub="Spesa giorno" icon="💸" accentColor="#ef4444" />
          <StatCard label="Incasso Mensile" value={euroSigned(totals.incassoMeseTotale)} sub="Incasso mese" icon="💰" accentColor="#10b981" />
          <StatCard label="Spesa Mensile" value={euroSigned(-totals.spesaMeseTotale)} sub="Spesa mese" icon="🧾" accentColor="#ef4444" />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
            <div className="mb-3 flex items-center justify-between">
                <div>
                <div className="text-sm font-semibold text-slate-800">Profitto per Veicolo</div>
                <div className="text-xs text-slate-400">Ordinato per targa</div>
              </div>
            </div>
            <MarginBarChart data={barData} />
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
            <div className="mb-3">
              <div className="text-sm font-semibold text-slate-800">Distribuzione</div>
              <div className="text-xs text-slate-400">Profittevoli vs In perdita</div>
            </div>
            <ProfitDistributionPie data={pieData} />
          </div>
        </div>

        {/* Secondary charts: Spesa vs Incasso */}
        <div className="grid lg:grid-cols-3 gap-4">
          <ChartCard title="Spesa vs Incasso (12 mesi)" className="lg:col-span-2">
            <CostiRicaviChart data={cashFlow} />
          </ChartCard>
          <ChartCard title="Spesa vs Incasso (30 giorni)">
            <CostiRicaviChart data={dailyFlow as any} />
          </ChartCard>
        </div>

        {/* Vehicles table */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Veicoli</h2>
              <div className="text-xs text-slate-400">Lista completa dei veicoli</div>
            </div>
            <Link href="/flotta" className="text-xs text-slate-500">Gestisci flotta →</Link>
          </div>
          <VehicleTable vehicles={enriched as any} />
        </div>

      </div>
    </div>
  )
}
