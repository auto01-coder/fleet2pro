import type { Vehicle, VehicleProfit, CashFlowMese, DashboardKpi } from './types'

// ── Currency / number formatters ──────────────────────────────────
export function euro(n: number, decimals = 2): string {
  return '€\u202F' + Math.abs(n).toLocaleString('it-IT', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

export function euroSigned(n: number, decimals = 2): string {
  return (n >= 0 ? '+' : '−') + euro(n, decimals)
}

export function pct(n: number): string {
  return n.toFixed(1) + '%'
}

export function num(n: number): string {
  return n.toLocaleString('it-IT')
}

export function shortDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('it-IT', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

// ── Days until a date ─────────────────────────────────────────────
export function daysUntil(iso: string | null | undefined): number | null {
  if (!iso) return null
  const diff = new Date(iso).getTime() - Date.now()
  return Math.round(diff / 86400000)
}

// ── Revisione: 4 anni poi ogni 2 ─────────────────────────────────
export function nextRevisione(immatr: string | null | undefined): Date | null {
  if (!immatr) return null
  const d = new Date(immatr)
  const now = new Date()
  const MS_Y = 365.25 * 86400000
  const prima = new Date(d.getTime() + 4 * MS_Y)
  if (now < prima) return prima
  const years = (now.getTime() - prima.getTime()) / MS_Y
  return new Date(prima.getTime() + Math.ceil(years / 2) * 2 * MS_Y)
}

// ── Core profit engine ────────────────────────────────────────────
export function computeProfit(v: Vehicle): VehicleProfit {
  const fissiMese = (
    (v.costo_assicurazione ?? 0) +
    (v.costo_bollo ?? 0) +
    (v.costo_manutenzione ?? 0) +
    (v.costo_altri ?? 0)
  ) / 12

  const costoTotM = v.costo_mensile + fissiMese
  const costoG    = costoTotM / 30
  const ricavoG   = (v.prezzo_mensile_cliente ?? 0) / 30
  const margineG  = ricavoG - costoG
  const margineM  = (v.prezzo_mensile_cliente ?? 0) - costoTotM
  const margineA  = margineM * 12

  const kmPct = v.km_contratto && v.km_contratto > 0
    ? Math.round((v.km_attuali / v.km_contratto) * 100)
    : null

  const revDate = nextRevisione(v.immatricolazione)
  const giorni = {
    assicurazione: daysUntil(v.assicurazione_data),
    bollo:         daysUntil(v.bollo_data),
    tagliando:     daysUntil(v.tagliando_data),
    revisione:     revDate ? daysUntil(revDate.toISOString()) : null,
  }

  const proxima = Math.min(
    ...Object.values(giorni).filter((g): g is number => g !== null)
  )

  return {
    ...v,
    costo_totale_mensile: +costoTotM.toFixed(2),
    costo_giornaliero:    +costoG.toFixed(2),
    ricavo_giornaliero:   +ricavoG.toFixed(2),
    margine_giornaliero:  +margineG.toFixed(2),
    margine_mensile:      +margineM.toFixed(2),
    margine_annuale:      +margineA.toFixed(2),
    in_perdita:           margineM < 0 && !!v.prezzo_mensile_cliente,
    km_percentuale:       kmPct,
    giorni_assicurazione: giorni.assicurazione,
    giorni_bollo:         giorni.bollo,
    giorni_tagliando:     giorni.tagliando,
    giorni_revisione:     giorni.revisione,
    prossima_scadenza_giorni: isFinite(proxima) ? proxima : null,
  }
}

// ── Aggregate KPIs ────────────────────────────────────────────────
export function buildKpi(vehicles: VehicleProfit[]): DashboardKpi {
  const costoTot   = vehicles.reduce((s, v) => s + v.costo_totale_mensile, 0)
  const ricaviTot  = vehicles.reduce((s, v) => s + (v.prezzo_mensile_cliente ?? 0), 0)
  const margineTot = ricaviTot - costoTot
  const inPerdita  = vehicles.filter(v => v.in_perdita).length
  const alerts     = vehicles.filter(v =>
    (v.prossima_scadenza_giorni !== null && v.prossima_scadenza_giorni <= 30) ||
    (v.km_percentuale !== null && v.km_percentuale >= 85)
  ).length

  return {
    totale_veicoli:         vehicles.length,
    costo_mensile_totale:   +costoTot.toFixed(2),
    ricavi_mensile_totale:  +ricaviTot.toFixed(2),
    margine_mensile_totale: +margineTot.toFixed(2),
    veicoli_in_perdita:     inPerdita,
    alert_scadenze:         alerts,
    margine_annuale_stimato:+(margineTot * 12).toFixed(2),
  }
}

// ── Simulated cashflow (use real data when you have it) ───────────
export function buildCashFlow(vehicles: VehicleProfit[], months = 12): CashFlowMese[] {
  const now = new Date()

  function getLastMonths(n = months) {
    const arr: { label: string; year: number; month: number; monthStart: Date; monthEnd: Date }[] = []
    for (let i = n - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const year = d.getFullYear()
      const month = d.getMonth()
      const monthStart = new Date(year, month, 1)
      const monthEnd = new Date(year, month + 1, 0)
      arr.push({ label: d.toLocaleString('it-IT', { month: 'short' }), year, month, monthStart, monthEnd })
    }
    return arr
  }

  // Precompute per-vehicle monthly cost and revenue according to rules, keep vehicle reference
  const vehicleMonthly = vehicles.map(v => {
    const isLease = v.tipologia === 'leasing' || v.tipologia === 'nlt'
    const costoMensile = isLease
      ? (v.costo_mensile ?? 0)
      : (((v.costo_assicurazione ?? 0) + (v.costo_bollo ?? 0) + (v.costo_manutenzione ?? 0) + (v.costo_altri ?? 0)) / 12)

    const ricavoMensile = v.tipo_noleggio === 'giornaliero'
      ? ((v.prezzo_giorno ?? 0) * 30)
      : (v.tipo_noleggio === 'medio_termine' ? (v.prezzo_mensile_cliente ?? 0) : (v.prezzo_mensile_cliente ?? 0))

    return {
      v,
      costoMensile: +costoMensile,
      ricavoMensile: +ricavoMensile,
    }
  })

  const monthsArr = getLastMonths(months)

  // Build monthly series respecting created_at (if present)
  const series = monthsArr.map(m => {
    const costo = vehicleMonthly.reduce((s, vm) => {
      if (vm.v.created_at) {
        const created = new Date(vm.v.created_at)
        if (created > m.monthEnd) return s
      }
      return s + vm.costoMensile
    }, 0)

    const ricavo = vehicleMonthly.reduce((s, vm) => {
      if (vm.v.created_at) {
        const created = new Date(vm.v.created_at)
        if (created > m.monthEnd) return s
      }
      return s + vm.ricavoMensile
    }, 0)

    const margine = +(ricavo - costo)

    const costoFixed = +costo.toFixed(2)
    const ricavoFixed = +ricavo.toFixed(2)

    return {
      mese: m.label,
      anno: m.year,
      label: `${m.label} ${m.year}`,
      custo: undefined,
      // singular
      costo: costoFixed,
      ricavo: ricavoFixed,
      margine: +margine.toFixed(2),
      // plural (backwards compatibility)
      costi: costoFixed,
      ricavi: ricavoFixed,
    }
  })

  // If there is no historical data (all months except the latest are zero), fallback to repeating current totals
  const hasHistory = series.some((item, idx) => idx < series.length - 1 && (item.costo !== 0 || item.ricavo !== 0))
  if (!hasHistory) {
    const totalCost = vehicleMonthly.reduce((s, vm) => s + vm.costoMensile, 0)
    const totalRev = vehicleMonthly.reduce((s, vm) => s + vm.ricavoMensile, 0)
    const costFixed = +totalCost.toFixed(2)
    const revFixed = +totalRev.toFixed(2)
    return monthsArr.map(m => ({
      mese: m.label,
      anno: m.year,
      label: `${m.label} ${m.year}`,
      costo: costFixed,
      ricavo: revFixed,
      margine: +(revFixed - costFixed).toFixed(2),
      costi: costFixed,
      ricavi: revFixed,
    }))
  }

  return series
}

// ── Alert level ───────────────────────────────────────────────────
export type AlertLevel = 'critico' | 'warning' | 'ok'

export function alertLevel(giorni: number | null): AlertLevel {
  if (giorni === null) return 'ok'
  if (giorni < 0)     return 'critico'
  if (giorni < 15)    return 'critico'
  if (giorni < 30)    return 'warning'
  return 'ok'
}

export const ALERT_COLOR: Record<AlertLevel, string> = {
  critico: '#ef4444',
  warning: '#f59e0b',
  ok:      '#10b981',
}

// ── Tailwind class merger ─────────────────────────────────────────
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
