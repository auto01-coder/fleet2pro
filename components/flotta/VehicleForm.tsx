'use client'
import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { saveVehicleAction } from '@/lib/actions'
import { euro, nextRevisione } from '@/lib/utils'
import type { VehicleProfit } from '@/lib/types'
import { Button } from '@/components/ui'

// Re-export util for use here
function calcRev(immatr: string | undefined) {
  if (!immatr) return null
  const d = nextRevisione(immatr)
  return d?.toLocaleDateString('it-IT') ?? null
}

const cls = 'w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 outline-none transition-all focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-100 placeholder:text-slate-300'
const lbl = 'block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5'

function Sect({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-indigo-500 mb-4">{title}</p>
      <div className="grid grid-cols-2 gap-4">{children}</div>
    </div>
  )
}

function Field({ label, full, children }: { label: string; full?: boolean; children: React.ReactNode }) {
  return (
    <div className={full ? 'col-span-2' : undefined}>
      <label className={lbl}>{label}</label>
      {children}
    </div>
  )
}

interface Props { vehicle?: VehicleProfit }

export default function VehicleForm({ vehicle }: Props) {
  const router  = useRouter()
  const isEdit  = !!vehicle
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState('')

  const [form, setForm] = useState({
    targa:               vehicle?.targa               ?? '',
    marca:               vehicle?.marca               ?? '',
    modello:             vehicle?.modello              ?? '',
    anno:                vehicle?.anno                 ?? new Date().getFullYear(),
    carburante:          vehicle?.carburante           ?? 'diesel',
    km_attuali:          vehicle?.km_attuali           ?? 0,
    tipologia:           vehicle?.tipologia            ?? 'leasing',
    tipo_noleggio:       vehicle?.tipo_noleggio        ?? 'giornaliero',
    stato:               vehicle?.stato               ?? 'disponibile',
    costo_mensile:       vehicle?.costo_mensile        ?? 0,
    prezzo_mensile_cliente: vehicle?.prezzo_mensile_cliente ?? 0,
    prezzo_giorno:        vehicle?.prezzo_giorno          ?? 0,
    costo_assicurazione: vehicle?.costo_assicurazione  ?? 0,
    costo_bollo:         vehicle?.costo_bollo          ?? 0,
    costo_manutenzione:  vehicle?.costo_manutenzione   ?? 0,
    assicurazione_data:  vehicle?.assicurazione_data   ?? '',
    bollo_data:          vehicle?.bollo_data           ?? '',
    tagliando_data:      vehicle?.tagliando_data       ?? '',
    immatricolazione:    vehicle?.immatricolazione     ?? '',
    km_contratto:        vehicle?.km_contratto         ?? '',
    data_fine_contratto: vehicle?.data_fine_contratto  ?? '',
    note:                vehicle?.note                 ?? '',
  })

  const set  = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }))
  const sS   = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => set(k, e.target.value)
  const sN   = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => set(k, +e.target.value || 0)

  // Economic calculator (simplified margin calculator)
  const econ = useMemo(() => {
    const costoMensile = +form.costo_mensile || 0
    const costoGiorno = +(costoMensile / 30)
    let ricavoMese = 0
    if (form.tipo_noleggio === 'giornaliero') {
      ricavoMese = (+form.prezzo_giorno || 0) * 30
    } else if (form.tipo_noleggio === 'medio_termine') {
      ricavoMese = +form.prezzo_mensile_cliente || 0
    }
    const margineMese = +(ricavoMese - costoMensile)
    const margineGiorno = +(margineMese / 30)
    return {
      costoGiorno: +costoGiorno.toFixed(2),
      ricavoMese: +ricavoMese.toFixed(2),
      margineMese: +margineMese.toFixed(2),
      margineGiorno: +margineGiorno.toFixed(2),
    }
  }, [form.costo_mensile, form.tipo_noleggio, form.prezzo_giorno, form.prezzo_mensile_cliente])

  const revisioneCalc = calcRev(form.immatricolazione || undefined)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    setError('')

    const fd = new FormData(e.currentTarget)
    if (isEdit && vehicle?.id) fd.set('id', vehicle.id)

    const result = await saveVehicleAction(fd)

    if (result?.error) {
      setError(result.error)
      setSaving(false)
    } else {
      router.push('/flotta')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pb-10">

      {/* Tipo pills */}
      <div className="flex flex-wrap gap-2">
        {(['leasing', 'nlt', 'proprieta'] as const).map(t => {
          const labels = { leasing: 'Leasing', nlt: 'NLT', proprieta: 'Proprietà' }
          const active = form.tipologia === t
          return (
            <button key={t} type="button" onClick={() => set('tipologia', t)}
              className={`px-4 py-1.5 rounded-full border text-xs font-semibold transition-all ${
                active
                  ? t === 'leasing' ? 'border-blue-300 bg-blue-50 text-blue-700'
                    : t === 'nlt'   ? 'border-purple-300 bg-purple-50 text-purple-700'
                    : 'border-green-300 bg-green-50 text-green-700'
                  : 'border-slate-200 bg-white text-slate-400 hover:border-slate-300'
              }`}>
              {labels[t]}
            </button>
          )
        })}
        {/* Hidden input for form */}
        <input type="hidden" name="tipologia" value={form.tipologia} />

        <div className="ml-auto flex gap-2">
          {(['disponibile', 'noleggiato', 'manutenzione', 'fermo'] as const).map(s => {
            const labels = { disponibile: 'Disponibile', noleggiato: 'Noleggiato', manutenzione: 'Manutenzione', fermo: 'Fermo' }
            return (
              <button key={s} type="button" onClick={() => set('stato', s)}
                className={`px-3 py-1 rounded-full border text-[11px] font-semibold transition-all ${
                  form.stato === s ? 'border-slate-700 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-400'
                }`}>
                {labels[s]}
              </button>
            )
          })}
          <input type="hidden" name="stato" value={form.stato} />
        </div>
      </div>

      {/* 1. Anagrafica */}
      <Sect title="Dati Veicolo">
        <Field label="Targa *">
          <input name="targa" className={cls} value={form.targa} onChange={e => set('targa', e.target.value.toUpperCase())} placeholder="AB123CD" required />
        </Field>
        <Field label="Anno">
          <input name="anno" type="number" className={cls} value={form.anno} onChange={sN('anno')} min={1990} max={2035} />
        </Field>
        <Field label="Marca *">
          <input name="marca" className={cls} value={form.marca} onChange={sS('marca')} placeholder="BMW" required />
        </Field>
        <Field label="Modello *">
          <input name="modello" className={cls} value={form.modello} onChange={sS('modello')} placeholder="320d Sport" required />
        </Field>
        <Field label="Carburante">
          <select name="carburante" className={cls} value={form.carburante} onChange={sS('carburante')}>
            {['benzina', 'diesel', 'ibrido', 'elettrico', 'gpl', 'metano'].map(c =>
              <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
            )}
          </select>
        </Field>
        <Field label="KM Attuali">
          <input name="km_attuali" type="number" className={cls} value={form.km_attuali} onChange={sN('km_attuali')} min={0} />
        </Field>
        <Field label="Data Immatricolazione">
          <input name="immatricolazione" type="date" className={cls} value={form.immatricolazione} onChange={sS('immatricolazione')} />
          {revisioneCalc && <p className="mt-1 text-[10px] text-green-600 font-medium">→ Prossima revisione: {revisioneCalc}</p>}
        </Field>
      </Sect>

      {/* 2. Contratto */}
      <Sect title="Contratto">
        <Field label="Tipo Noleggio">
          <select name="tipo_noleggio" className={cls} value={form.tipo_noleggio} onChange={sS('tipo_noleggio')}>
            <option value="giornaliero">Giornaliero</option>
            <option value="medio_termine">Medio Termine</option>
          </select>
        </Field>
        <Field label="KM Contratto">
          <input name="km_contratto" type="number" className={cls} value={form.km_contratto} onChange={sS('km_contratto')} />
        </Field>
        <Field label="Fine Contratto">
          <input name="data_fine_contratto" type="date" className={cls} value={form.data_fine_contratto} onChange={sS('data_fine_contratto')} />
        </Field>
      </Sect>

      {/* 3. Calcolatrice Margine */}
      <Sect title="Calcolatrice Margine (semplice)">
        <Field label="Costo Mensile (€)">
          <input name="costo_mensile" type="number" className={cls} value={form.costo_mensile} onChange={sN('costo_mensile')} step="0.01" />
        </Field>

        <Field label="Tipo Noleggio">
          <select name="tipo_noleggio" className={cls} value={form.tipo_noleggio} onChange={sS('tipo_noleggio')}>
            <option value="giornaliero">Giornaliero</option>
            <option value="medio_termine">Medio Termine</option>
          </select>
        </Field>

        {form.tipo_noleggio === 'giornaliero' ? (
          <Field label="Prezzo Giorno Cliente (€)">
            <input name="prezzo_giorno" type="number" className={cls} value={form.prezzo_giorno} onChange={sN('prezzo_giorno')} step="0.01" />
          </Field>
        ) : (
          <Field label="Prezzo Mese Cliente (€)">
            <input name="prezzo_mensile_cliente" type="number" className={cls} value={form.prezzo_mensile_cliente} onChange={sN('prezzo_mensile_cliente')} step="0.01" />
          </Field>
        )}

        <div className="col-span-2">
          <label className={lbl}>Risultato</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-xl border p-3 bg-white">
              <div className="text-[11px] text-slate-400">Costo / giorno</div>
              <div className="mt-1 font-mono font-bold">{euro(econ.costoGiorno)}</div>
            </div>

            <div className="rounded-xl border p-3 bg-white">
              <div className="text-[11px] text-slate-400">Ricavo / mese</div>
              <div className="mt-1 font-mono font-bold">{euro(econ.ricavoMese)}</div>
            </div>

            <div className={`rounded-xl border p-3 ${econ.margineMese >= 0 ? 'border-green-100 bg-green-50/30' : 'border-red-100 bg-red-50/30'}`}>
              <div className="text-[11px] text-slate-400">Margine / mese</div>
              <div className={`mt-1 font-mono font-bold ${econ.margineMese >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                {econ.margineMese >= 0 ? '+' : '−'}{euro(Math.abs(econ.margineMese))}
              </div>
            </div>

            <div className={`rounded-xl border p-3 ${econ.margineGiorno >= 0 ? 'border-green-100 bg-green-50/30' : 'border-red-100 bg-red-50/30'}`}>
              <div className="text-[11px] text-slate-400">Margine / giorno</div>
              <div className={`mt-1 font-mono font-bold ${econ.margineGiorno >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                {econ.margineGiorno >= 0 ? '+' : '−'}{euro(Math.abs(econ.margineGiorno))}
              </div>
            </div>
          </div>
        </div>
      </Sect>

      {/* 4. Scadenze */}
      <Sect title="Scadenze">
        <Field label="Assicurazione Scadenza">
          <input name="assicurazione_data" type="date" className={cls} value={form.assicurazione_data} onChange={sS('assicurazione_data')} />
        </Field>
        <Field label="Bollo Scadenza">
          <input name="bollo_data" type="date" className={cls} value={form.bollo_data} onChange={sS('bollo_data')} />
        </Field>
        <Field label="Prossimo Tagliando">
          <input name="tagliando_data" type="date" className={cls} value={form.tagliando_data} onChange={sS('tagliando_data')} />
        </Field>
      </Sect>

      {/* Note */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <label className={lbl}>Note</label>
        <textarea name="note" className={cls + ' min-h-[80px] resize-y'} value={form.note} onChange={sS('note')} placeholder="Note interne..." />
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between">
        <Button variant="secondary" type="button" onClick={() => router.back()}>Annulla</Button>
        <Button type="submit" loading={saving}>
          {isEdit ? '✓ Salva Modifiche' : '+ Aggiungi Veicolo'}
        </Button>
      </div>
    </form>
  )
}
