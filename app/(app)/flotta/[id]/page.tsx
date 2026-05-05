'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getVehicleById, deleteVehicle } from '@/lib/api'
import { euro, euroSigned, shortDate, ALERT_COLOR, alertLevel } from '@/lib/utils'
import type { VehicleProfit } from '@/lib/types'
import { Card, Badge, Button, ProgressBar, Modal } from '@/components/ui'
import Link from 'next/link'
import { getContrattoSignedUrl } from '@/components/flotta/VehicleForm'

function ScadenzaRow({ label, giorni, icon }: { label: string; giorni: number | null; icon: string }) {
  if (giorni === null) return null
  const lvl  = alertLevel(giorni)
  const clr  = ALERT_COLOR[lvl]
  const text = giorni < 0 ? `Scaduto da ${Math.abs(giorni)}gg` : giorni === 0 ? 'Scade oggi!' : `${giorni} giorni`
  return (
    <div className="flex items-center gap-3 py-3 border-b border-slate-50 last:border-0" style={{ borderLeft: `3px solid ${clr}` }}>
      <span className="text-lg pl-3">{icon}</span>
      <div className="flex-1">
        <div className="text-sm font-medium text-slate-700">{label}</div>
      </div>
      <span className="text-xs font-bold font-mono" style={{ color: clr }}>{text}</span>
    </div>
  )
}


// ── Bottone Contratto ─────────────────────────────────────────────
function ContrattoButton({ path, loading, onClick }: {
  path: string | null | undefined
  loading: boolean
  onClick: () => void
}) {
  if (!path) {
    return (
      <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-slate-50 border border-slate-100">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 flex-shrink-0">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M3 1h6l3 3v9a1 1 0 01-1 1H3a1 1 0 01-1-1V2a1 1 0 011-1z" stroke="#94a3b8" strokeWidth="1.2" fill="none"/>
            <path d="M9 1v3h3" stroke="#94a3b8" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-500">Contratto veicolo</p>
          <p className="text-[10px] text-slate-400">Nessun contratto caricato</p>
        </div>
        <span className="ml-auto text-[10px] text-slate-300 italic">—</span>
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="group w-full flex items-center gap-2.5 px-4 py-3 rounded-xl bg-blue-50 border border-blue-100 hover:bg-blue-100 hover:border-blue-200 transition-all disabled:opacity-60 disabled:pointer-events-none text-left"
    >
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 flex-shrink-0">
        {loading ? (
          <div className="w-3.5 h-3.5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
        ) : (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M3 1h6l3 3v9a1 1 0 01-1 1H3a1 1 0 01-1-1V2a1 1 0 011-1z" fill="#dbeafe" stroke="#93c5fd" strokeWidth="1.2"/>
            <path d="M9 1v3h3" stroke="#93c5fd" strokeWidth="1.2" strokeLinecap="round"/>
            <path d="M4 7h6M4 9.5h6M4 12h4" stroke="#60a5fa" strokeWidth="1" strokeLinecap="round"/>
          </svg>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-blue-700">Visualizza contratto</p>
        <p className="text-[10px] text-blue-500 truncate">Apri documento · valido 60 secondi</p>
      </div>
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-blue-400 group-hover:text-blue-600 flex-shrink-0 transition-colors">
        <path d="M1 7s2.5-5 6-5 6 5 6 5-2.5 5-6 5-6-5-6-5z" stroke="currentColor" strokeWidth="1.2"/>
        <circle cx="7" cy="7" r="2" fill="currentColor"/>
      </svg>
    </button>
  )
}

export default function VehicleDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router  = useRouter()
  const [vehicle, setVehicle]       = useState<VehicleProfit | null>(null)
  const [loading, setLoading]       = useState(true)
  const [delModal, setDelModal]     = useState(false)
  const [deleting, setDeleting]     = useState(false)
  const [contrattoLoading, setContrattoLoading] = useState(false)

  useEffect(() => {
    if (id) {
      getVehicleById(id).then(v => {
        setVehicle(v)
        setLoading(false)
      })
    }
  }, [id])

  async function handleDelete() {
    if (!vehicle) return
    setDeleting(true)
    await deleteVehicle(vehicle.id)
    router.push('/flotta')
  }

  async function handleViewContratto() {
    if (!vehicle?.contratto_path) return
    setContrattoLoading(true)
    const url = await getContrattoSignedUrl(vehicle.contratto_path)
    setContrattoLoading(false)
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer')
    } else {
      alert('Impossibile aprire il contratto. Riprova.')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-2 border-slate-200 border-t-slate-600 rounded-full animate-spin" />
      </div>
    )
  }

  if (!vehicle) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <p className="text-slate-500">Veicolo non trovato</p>
        <Link href="/flotta" className="text-sm text-indigo-600 hover:underline">← Torna alla flotta</Link>
      </div>
    )
  }

  const marginePos = vehicle.margine_mensile >= 0
  const tipLabel   = vehicle.tipologia === 'leasing' ? 'Leasing' : vehicle.tipologia === 'nlt' ? 'NLT' : 'Proprietà'
  const tipVariant = vehicle.tipologia === 'leasing' ? 'blue' : vehicle.tipologia === 'nlt' ? 'purple' : 'green'

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-slate-100 shadow-sm px-8 h-14 flex items-center gap-4">
        <Link href="/flotta" className="text-slate-400 hover:text-slate-600 transition-colors">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 4L6 8l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Link>
        <div className="flex-1">
          <h1 className="text-[15px] font-semibold text-slate-900">{vehicle.marca} {vehicle.modello}</h1>
          <p className="text-[11px] text-slate-400 font-mono">{vehicle.targa}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/flotta/${vehicle.id}/modifica`}>
            <Button variant="secondary" size="sm">✏ Modifica</Button>
          </Link>
          <Button variant="danger" size="sm" onClick={() => setDelModal(true)}>🗑 Elimina</Button>
        </div>
      </div>

      <div className="px-8 py-6 max-w-4xl mx-auto space-y-5">

        {/* Header card */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-start gap-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-3xl flex-shrink-0">🚗</div>
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap mb-2">
                <h2 className="text-xl font-bold text-slate-900">{vehicle.marca} {vehicle.modello}</h2>
                <span className="font-mono text-sm bg-slate-100 px-2 py-0.5 rounded-lg text-slate-600 font-bold">{vehicle.targa}</span>
                {vehicle.in_perdita && (
                  <Badge variant="red" dot>In Perdita</Badge>
                )}
              </div>
              <div className="flex flex-wrap gap-2 mb-3">
                {[vehicle.anno, vehicle.carburante, vehicle.km_attuali.toLocaleString('it-IT') + ' km'].map((v, i) => (
                  <span key={i} className="text-xs bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-md text-slate-500">{v}</span>
                ))}
              </div>
              <div className="flex gap-2">
                <Badge variant={tipVariant as 'blue' | 'purple' | 'green'}>{tipLabel}</Badge>
                <Badge variant={vehicle.stato === 'disponibile' ? 'green' : vehicle.stato === 'noleggiato' ? 'blue' : 'yellow'} dot>
                  {vehicle.stato === 'disponibile' ? 'Disponibile' : vehicle.stato === 'noleggiato' ? 'Noleggiato' : vehicle.stato === 'manutenzione' ? 'Manutenzione' : 'Fermo'}
                </Badge>
              </div>
            </div>
            {vehicle.km_percentuale !== null && (
              <div className="flex-shrink-0 w-28">
                <ProgressBar value={vehicle.km_percentuale} />
                <p className="text-[10px] text-slate-400 text-right mt-1">
                  {vehicle.km_attuali.toLocaleString('it-IT')} / {(vehicle.km_contratto ?? 0).toLocaleString('it-IT')} km
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-5">
          {/* P&L */}
          <Card title="Analisi Economica (P&L)">
            <div className="space-y-4">
              {/* Costo vs Ricavo */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-red-50 border border-red-100 rounded-xl p-3">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-red-400 mb-1">Costo/giorno</div>
                  <div className="text-xl font-bold font-mono text-red-700">{euro(vehicle.costo_giornaliero)}</div>
                  <div className="text-xs text-red-400 mt-0.5">{euro(vehicle.costo_totale_mensile, 0)}/mese</div>
                </div>
                {vehicle.prezzo_mensile_cliente ? (
                  <div className="bg-green-50 border border-green-100 rounded-xl p-3">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-green-400 mb-1">Ricavo/giorno</div>
                    <div className="text-xl font-bold font-mono text-green-700">{euro(vehicle.ricavo_giornaliero)}</div>
                    <div className="text-xs text-green-400 mt-0.5">{euro(vehicle.prezzo_mensile_cliente, 0)}/mese</div>
                  </div>
                ) : (
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex items-center justify-center">
                    <p className="text-xs text-slate-300 text-center">Prezzo cliente non impostato</p>
                  </div>
                )}
              </div>

              {/* Margini */}
              {vehicle.prezzo_mensile_cliente && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Margine Netto</p>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { l: 'Giorno',   v: vehicle.margine_giornaliero },
                      { l: 'Sett.',    v: +(vehicle.margine_giornaliero * 7).toFixed(2) },
                      { l: 'Mese',     v: vehicle.margine_mensile },
                      { l: 'Anno',     v: vehicle.margine_annuale },
                    ].map(r => (
                      <div key={r.l} className={`rounded-xl border p-2.5 text-center ${r.v >= 0 ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
                        <div className="text-[9px] uppercase text-slate-400 font-medium">{r.l}</div>
                        <div className={`text-xs font-bold font-mono mt-0.5 ${r.v >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                          {euroSigned(r.v, r.l === 'Anno' ? 0 : 2)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Cost breakdown */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Costi Annui</p>
                {[
                  { l: 'Canone/Leasing', v: vehicle.costo_mensile * 12, c: '#6366f1' },
                  { l: 'Assicurazione',  v: vehicle.costo_assicurazione ?? 0, c: '#8b5cf6' },
                  { l: 'Bollo',          v: vehicle.costo_bollo ?? 0, c: '#f59e0b' },
                  { l: 'Manutenzione',   v: vehicle.costo_manutenzione ?? 0, c: '#10b981' },
                ].filter(r => r.v > 0).map(r => {
                  const maxV = vehicle.costo_mensile * 12
                  return (
                    <div key={r.l} className="mb-2">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-500">{r.l}</span>
                        <span className="font-mono font-semibold text-slate-700">{euro(r.v, 0)}</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${Math.min((r.v / maxV) * 100, 100)}%`, background: r.c }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </Card>

          {/* Scadenze + Info */}
          <div className="space-y-4">
            <Card title="Scadenze">
              {[
                { label: 'Assicurazione', giorni: vehicle.giorni_assicurazione, icon: '🛡️' },
                { label: 'Bollo',         giorni: vehicle.giorni_bollo,         icon: '📄' },
                { label: 'Tagliando',     giorni: vehicle.giorni_tagliando,     icon: '🔧' },
                { label: 'Revisione',     giorni: vehicle.giorni_revisione,     icon: '🔍' },
              ].filter(s => s.giorni !== null).length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-4">Nessuna scadenza configurata</p>
              ) : [
                { label: 'Assicurazione', giorni: vehicle.giorni_assicurazione, icon: '🛡️' },
                { label: 'Bollo',         giorni: vehicle.giorni_bollo,         icon: '📄' },
                { label: 'Tagliando',     giorni: vehicle.giorni_tagliando,     icon: '🔧' },
                { label: 'Revisione',     giorni: vehicle.giorni_revisione,     icon: '🔍' },
              ].map(s => <ScadenzaRow key={s.label} {...s} />)}
            </Card>

            <Card title="Info Contratto">
              <div className="space-y-2">
                {[
                  { l: 'Inizio',         v: shortDate(vehicle.data_fine_contratto ? new Date(vehicle.data_fine_contratto).toISOString() : null) },
                  { l: 'Fine Contratto', v: shortDate(vehicle.data_fine_contratto) },
                  { l: 'KM Contratto',   v: vehicle.km_contratto ? vehicle.km_contratto.toLocaleString('it-IT') + ' km' : '—' },
                  { l: 'Note',           v: vehicle.note ?? '—' },
                ].map(r => (
                  <div key={r.l} className="flex justify-between text-sm">
                    <span className="text-slate-400">{r.l}</span>
                    <span className="font-medium text-slate-700">{r.v}</span>
                  </div>
                ))}

                {/* Documento contratto */}
                <div className="pt-2">
                  <ContrattoButton
                    path={vehicle.contratto_path}
                    loading={contrattoLoading}
                    onClick={handleViewContratto}
                  />
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Delete Modal */}
      <Modal open={delModal} onClose={() => setDelModal(false)} title="Elimina Veicolo">
        <p className="text-sm text-slate-600 mb-5">
          Sei sicuro di voler eliminare <strong className="font-mono">{vehicle.targa}</strong>?
          Questa operazione non è reversibile.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setDelModal(false)}>Annulla</Button>
          <Button variant="danger" loading={deleting} onClick={handleDelete}>Elimina</Button>
        </div>
      </Modal>
    </div>
  )
}
