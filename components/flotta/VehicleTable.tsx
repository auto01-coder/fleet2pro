'use client'
import { useState, useMemo } from 'react'
import Link from 'next/link'
import type { VehicleProfit } from '@/lib/types'
import { euro, alertLevel, ALERT_COLOR } from '@/lib/utils'
import { Badge, ProgressBar, EmptyState } from '@/components/ui'

type FilterKey = 'tutti' | 'leasing' | 'nlt' | 'proprieta' | 'perdita' | 'scadenza'

export default function VehicleTable({ vehicles }: { vehicles: VehicleProfit[] }) {
  const [search, setSearch]   = useState('')
  const [filter, setFilter]   = useState<FilterKey>('tutti')
  const [sortKey, setSortKey] = useState('marca')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  const counts: Record<FilterKey, number> = {
    tutti:     vehicles.length,
    leasing:   vehicles.filter(v => v.tipologia === 'leasing').length,
    nlt:       vehicles.filter(v => v.tipologia === 'nlt').length,
    proprieta: vehicles.filter(v => v.tipologia === 'proprieta').length,
    perdita:   vehicles.filter(v => v.in_perdita).length,
    scadenza:  vehicles.filter(v => (v as any).prossima_scadenza_giorni !== null && (v as any).prossima_scadenza_giorni <= 30).length,
  }

  const FILTERS: { key: FilterKey; label: string }[] = [
    { key: 'tutti',     label: 'Tutti' },
    { key: 'leasing',   label: 'Leasing' },
    { key: 'nlt',       label: 'NLT' },
    { key: 'proprieta', label: 'Proprietà' },
    { key: 'perdita',   label: '⚠ In Perdita' },
    { key: 'scadenza',  label: '⏰ In Scadenza' },
  ]

  const filtered = useMemo(() => {
    let r = [...vehicles]
    if (search.trim()) {
      const q = search.toLowerCase()
      r = r.filter(v =>
        v.targa.toLowerCase().includes(q) ||
        v.marca.toLowerCase().includes(q) ||
        v.modello.toLowerCase().includes(q)
      )
    }
    switch (filter) {
      case 'leasing':   r = r.filter(v => v.tipologia === 'leasing'); break
      case 'nlt':       r = r.filter(v => v.tipologia === 'nlt'); break
      case 'proprieta': r = r.filter(v => v.tipologia === 'proprieta'); break
      case 'perdita':   r = r.filter(v => v.in_perdita); break
      case 'scadenza':  r = r.filter(v => (v as any).prossima_scadenza_giorni !== null && (v as any).prossima_scadenza_giorni <= 30); break
    }
    r.sort((a, b) => {
      const av = (a as unknown as Record<string, unknown>)[sortKey] ?? ''
      const bv = (b as unknown as Record<string, unknown>)[sortKey] ?? ''
      const cmp = typeof av === 'number'
        ? (av as number) - (bv as number)
        : String(av).localeCompare(String(bv), 'it-IT')
      return sortDir === 'asc' ? cmp : -cmp
    })
    return r
  }, [vehicles, search, filter, sortKey, sortDir])

  function toggleSort(k: string) {
    if (sortKey === k) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(k); setSortDir('asc') }
  }

  const tipologiaStyle: Record<string, { variant: 'blue' | 'purple' | 'green'; label: string }> = {
    leasing:   { variant: 'blue',   label: 'Leasing'   },
    nlt:       { variant: 'purple', label: 'NLT'       },
    proprieta: { variant: 'green',  label: 'Proprietà' },
  }

  const statoStyle: Record<string, 'green' | 'blue' | 'yellow' | 'gray'> = {
    disponibile:  'green',
    noleggiato:   'blue',
    manutenzione: 'yellow',
    fermo:        'gray',
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.4"/>
            <path d="M10 10l2.5 2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cerca targa, marca…"
            className="h-9 w-52 rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-700 outline-none shadow-sm focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-medium transition-all ${
                filter === f.key
                  ? 'border-slate-800 bg-slate-900 text-white'
                  : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
              }`}
            >
              {f.label}
              <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ${
                filter === f.key ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
              }`}>{counts[f.key]}</span>
            </button>
          ))}
        </div>

        <span className="ml-auto text-xs text-slate-400">{filtered.length} di {vehicles.length}</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70">
                {[
                  { k: 'targa',              l: 'Targa'          },
                  { k: 'modello',            l: 'Veicolo'        },
                  { k: 'tipologia',          l: 'Tipo'           },
                  { k: 'stato',              l: 'Stato'          },
                  { k: null,                 l: 'Scadenza'       },
                  { k: 'km_percentuale',     l: 'KM'             },
                  { k: 'spesa_giorno',       l: 'Spesa/g'        },
                  { k: 'incasso_giorno',     l: 'Incasso/g'      },
                  { k: 'differenza_giorno',  l: 'Δ/g'            },
                  { k: 'spesa_mese',         l: 'Spesa/mese'     },
                  { k: 'incasso_mese',       l: 'Incasso/mese'   },
                  { k: 'differenza_mese',    l: 'Δ/mese'         },
                  { k: null,                 l: ''               },
                ].map((col, i) => (
                  <th
                    key={i}
                    onClick={() => col.k && toggleSort(col.k)}
                    className={`whitespace-nowrap px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400 ${col.k ? 'cursor-pointer hover:text-slate-600 select-none' : ''}`}>
                    {col.l}
                    {col.k && sortKey === col.k && (
                      <span className="ml-1 text-slate-600">{sortDir === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={13}>
                    <EmptyState icon="🚗" title="Nessun veicolo trovato" description="Prova a cambiare i filtri o la ricerca" />
                  </td>
                </tr>
              ) : filtered.map(v => {
                const ts = tipologiaStyle[v.tipologia] ?? { variant: 'gray' as const, label: v.tipologia }
                const ss = statoStyle[v.stato] ?? 'gray'
                const scadGG = (v as any).prossima_scadenza_giorni ?? (v as any).giorniContratto ?? null
                const scadAlert = alertLevel(scadGG)
                const km = v.km_percentuale

                const spesaG = (v as any).spesaGiorno ?? (v as any).spesa_giorno ?? (v as any).costoGiorno ?? (v as any).costo_giornaliero ?? 0
                const incassoG = (v as any).incassoGiorno ?? (v as any).incasso_giorno ?? (v as any).ricavoGiorno ?? (v as any).ricavo_giornaliero ?? 0
                const diffG = (v as any).differenzaGiorno ?? (v as any).differenza_giorno ?? (v as any).margineGiorno ?? (v as any).margine_giornaliero ?? 0
                const spesaM = (v as any).spesaMese ?? (v as any).spesa_mese ?? (v as any).costoMensile ?? (v as any).costo_totale_mensile ?? 0
                const incassoM = (v as any).incassoMese ?? (v as any).incasso_mese ?? (v as any).ricavoMensile ?? (v as any).ricavo_mensile ?? 0
                const diffM = (v as any).differenzaMese ?? (v as any).differenza_mese ?? (v as any).margineMensile ?? (v as any).margine_mensile ?? 0

                return (
                  <tr
                    key={v.id}
                    className="group cursor-pointer hover:bg-slate-50/80 transition-colors"
                    onClick={() => { window.location.href = `/flotta/${v.id}` }}
                  >
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        {diffG < 0 ? (
                          <Badge variant="red">Perde soldi</Badge>
                        ) : diffG > 0 ? (
                          <Badge variant="green">Profitto</Badge>
                        ) : null}
                        <span className="font-mono text-sm font-bold text-slate-900">{v.targa}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-medium text-slate-900">{v.marca} {v.modello}</div>
                      <div className="text-xs text-slate-400">{v.anno} · {v.carburante}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge variant={ts.variant as 'blue' | 'purple' | 'green'}>{ts.label}</Badge>
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge variant={ss} dot>
                        {v.stato === 'disponibile' ? 'Disponibile'
                          : v.stato === 'noleggiato' ? 'Noleggiato'
                          : v.stato === 'manutenzione' ? 'Manutenzione' : 'Fermo'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5">
                      {scadGG !== null ? (
                        <span className="font-mono text-xs font-semibold" style={{ color: ALERT_COLOR[scadAlert] }}>
                          {scadGG < 0 ? `${Math.abs(scadGG)}gg fa` : scadGG === 0 ? 'Oggi' : `${scadGG}gg`}
                        </span>
                      ) : <span className="text-slate-300 text-xs">—</span>}
                    </td>
                    <td className="px-4 py-3.5">
                      {km !== null ? (
                        <div className="w-20">
                          <ProgressBar value={km} />
                        </div>
                      ) : <span className="text-slate-300 text-xs">—</span>}
                    </td>

                    <td className="px-4 py-3.5 font-mono text-sm font-bold text-slate-900">
                      {euro(spesaG)}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-sm font-bold text-slate-900">
                      {incassoG > 0 ? euro(incassoG) : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`font-mono text-sm font-bold ${diffG >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                        {diffG >= 0 ? '+' : '−'}{euro(Math.abs(diffG))}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 font-mono text-sm font-bold text-slate-900">
                      {euro(spesaM)}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-sm font-bold text-slate-900">
                      {incassoM > 0 ? euro(incassoM) : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`font-mono text-sm font-bold ${diffM >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                        {diffM >= 0 ? '+' : '−'}{euro(Math.abs(diffM))}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-right">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-slate-200 group-hover:text-slate-400 ml-auto transition-colors">
                        <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
