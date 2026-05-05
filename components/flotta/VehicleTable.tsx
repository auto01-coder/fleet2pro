'use client'
import { useState, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { saveVehicleAction, updateContrattoPathAction } from '@/lib/actions'
import { supabase } from '@/lib/supabaseClient'
import { euro, nextRevisione } from '@/lib/utils'
import type { VehicleProfit } from '@/lib/types'
import { Button } from '@/components/ui'

// ── Calcola prossima revisione ────────────────────────────────────
function calcRev(immatr: string | undefined): string | null {
  if (!immatr) return null
  return nextRevisione(immatr)?.toLocaleDateString('it-IT') ?? null
}

// ── Upload contratto su Supabase Storage ──────────────────────────
async function uploadContratto(file: File, targa: string): Promise<string> {
  const ext      = file.name.split('.').pop() ?? 'pdf'
  const fileName = `${targa.toUpperCase()}_${Date.now()}.${ext}`
  const path     = `contratti/${fileName}`

  const { error } = await supabase.storage
    .from('documenti')
    .upload(path, file, { contentType: file.type, upsert: false })

  if (error) throw new Error(`Upload fallito: ${error.message}`)
  return path  // salviamo solo il path, MAI l'URL pubblico
}

// ── Genera signed URL temporaneo (60s) ───────────────────────────
export async function getContrattoSignedUrl(path: string): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from('documenti')
    .createSignedUrl(path, 60)

  if (error) {
    console.error('[getContrattoSignedUrl]', error.message)
    return null
  }
  return data.signedUrl
}

// ── Stili condivisi ───────────────────────────────────────────────
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

// ── Componente upload contratto ───────────────────────────────────
type UploadStatus = 'idle' | 'uploading' | 'done' | 'error'

interface ContrattoUploadProps {
  currentPath: string | null
  onUploadDone: (path: string) => void
  targa: string
}

function ContrattoUpload({ currentPath, onUploadDone, targa }: ContrattoUploadProps) {
  const [status,   setStatus]   = useState<UploadStatus>('idle')
  const [fileName, setFileName] = useState<string | null>(null)
  const [errMsg,   setErrMsg]   = useState<string | null>(null)
  const [opening,  setOpening]  = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png']
  const MAX_MB = 10

  async function handleFile(file: File) {
    if (!ALLOWED_TYPES.includes(file.type)) {
      setErrMsg('Formato non supportato. Usa PDF, JPG o PNG.')
      return
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      setErrMsg(`File troppo grande. Massimo ${MAX_MB}MB.`)
      return
    }
    if (!targa.trim()) {
      setErrMsg('Inserisci prima la targa del veicolo.')
      return
    }

    setStatus('uploading')
    setErrMsg(null)
    setFileName(file.name)

    try {
      const path = await uploadContratto(file, targa)
      setStatus('done')
      onUploadDone(path)
    } catch (err: unknown) {
      setStatus('error')
      setErrMsg(err instanceof Error ? err.message : 'Errore durante il caricamento')
    }
  }

  async function handleView() {
    if (!currentPath) return
    setOpening(true)
    const url = await getContrattoSignedUrl(currentPath)
    setOpening(false)
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer')
    } else {
      setErrMsg('Impossibile aprire il file. Riprova.')
    }
  }

  const hasFile = !!currentPath || status === 'done'

  return (
    <div className="space-y-2">
      {/* Drop zone / stato corrente */}
      <div
        className={`
          relative flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed
          px-4 py-5 text-center transition-all
          ${hasFile
            ? 'border-slate-200 bg-slate-50/50'
            : 'cursor-pointer border-slate-200 bg-slate-50/50 hover:border-indigo-300 hover:bg-indigo-50/30'
          }
        `}
        onClick={hasFile ? undefined : () => inputRef.current?.click()}
        onDragOver={e => { e.preventDefault() }}
        onDrop={e => {
          e.preventDefault()
          const file = e.dataTransfer.files[0]
          if (file) handleFile(file)
        }}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={e => {
            const file = e.target.files?.[0]
            if (file) handleFile(file)
            // reset per permettere ri-upload dello stesso file
            e.target.value = ''
          }}
        />

        {status === 'uploading' ? (
          <>
            <div className="w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-slate-500">Caricamento in corso…</p>
          </>
        ) : hasFile ? (
          <>
            {/* Icona documento */}
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 border border-blue-100">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M4 2h8l4 4v12a1 1 0 01-1 1H4a1 1 0 01-1-1V3a1 1 0 011-1z" fill="#dbeafe" stroke="#93c5fd" strokeWidth="1.2"/>
                <path d="M12 2v4h4" stroke="#93c5fd" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M7 9h6M7 12h6M7 15h4" stroke="#60a5fa" strokeWidth="1.1" strokeLinecap="round"/>
              </svg>
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-700">
                {fileName ?? 'Contratto caricato'}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {status === 'done' ? '✓ Salvato con successo' : 'File presente'}
              </p>
            </div>

            {/* Azioni */}
            <div className="flex gap-2 mt-1">
              <button
                type="button"
                onClick={handleView}
                disabled={opening}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all disabled:opacity-50 shadow-sm"
              >
                {opening ? (
                  <div className="w-3 h-3 border border-slate-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M1 6s2-4 5-4 5 4 5 4-2 4-5 4-5-4-5-4z" stroke="currentColor" strokeWidth="1.2"/>
                    <circle cx="6" cy="6" r="1.5" fill="currentColor"/>
                  </svg>
                )}
                Visualizza
              </button>

              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-500 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M6 1v7M3 5l3-4 3 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M1 10h10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                </svg>
                Sostituisci
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M4 16V4a1 1 0 011-1h6l4 4v9a1 1 0 01-1 1H5a1 1 0 01-1-1z" stroke="#94a3b8" strokeWidth="1.3" fill="none"/>
                <path d="M11 3v4h4" stroke="#94a3b8" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M8 10v4M6 12h4" stroke="#94a3b8" strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-600">
                Carica contratto
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Trascina qui o clicca · PDF, JPG, PNG · max {MAX_MB}MB
              </p>
            </div>
          </>
        )}
      </div>

      {/* Errore */}
      {errMsg && (
        <p className="text-[11px] font-medium text-red-500 flex items-center gap-1">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <circle cx="6" cy="6" r="5" stroke="#ef4444" strokeWidth="1.2"/>
            <path d="M6 4v3M6 8.5v.5" stroke="#ef4444" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
          {errMsg}
        </p>
      )}
    </div>
  )
}

// ── Form principale ───────────────────────────────────────────────
interface Props { vehicle?: VehicleProfit }

export default function VehicleForm({ vehicle }: Props) {
  const router  = useRouter()
  const isEdit  = !!vehicle
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState('')

  // contrattoPath gestito in state separato (non nel form HTML)
  const [contrattoPath, setContrattoPath] = useState<string | null>(
    vehicle?.contratto_path ?? null
  )

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

  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }))
  const sS  = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => set(k, e.target.value)
  const sN  = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => set(k, +e.target.value || 0)

  // Live P&L
  const preview = useMemo(() => {
    const fissiM  = ((+form.costo_assicurazione) + (+form.costo_bollo) + (+form.costo_manutenzione)) / 12
    const costoM  = (+form.costo_mensile) + fissiM
    const ricavoM = +form.prezzo_mensile_cliente
    return {
      costoG:   +(costoM / 30).toFixed(2),
      ricavoG:  +(ricavoM / 30).toFixed(2),
      margineG: +((ricavoM - costoM) / 30).toFixed(2),
      margineM: +(ricavoM - costoM).toFixed(2),
      margineA: +((ricavoM - costoM) * 12).toFixed(2),
    }
  }, [form.costo_mensile, form.costo_assicurazione, form.costo_bollo, form.costo_manutenzione, form.prezzo_mensile_cliente])

  const revisioneCalc = calcRev(form.immatricolazione || undefined)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    setError('')

    const fd = new FormData(e.currentTarget)
    if (isEdit && vehicle?.id) fd.set('id', vehicle.id)

    // Passa il path del contratto se presente
    if (contrattoPath) fd.set('contratto_path', contrattoPath)

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
            <option value="nessuno">Nessuno</option>
          </select>
        </Field>
        <Field label="KM Contratto">
          <input name="km_contratto" type="number" className={cls} value={form.km_contratto} onChange={sS('km_contratto')} />
        </Field>
        <Field label="Fine Contratto">
          <input name="data_fine_contratto" type="date" className={cls} value={form.data_fine_contratto} onChange={sS('data_fine_contratto')} />
        </Field>
        {/* Upload contratto — occupa tutta la riga */}
        <Field label="Contratto Veicolo (PDF / JPG / PNG)" full>
          <ContrattoUpload
            currentPath={contrattoPath}
            targa={form.targa}
            onUploadDone={(path) => setContrattoPath(path)}
          />
        </Field>
      </Sect>

      {/* 3. Costi */}
      <Sect title="Costi e Prezzi (IVA esclusa)">
        <Field label="Costo Mensile (tuo) *">
          <input name="costo_mensile" type="number" className={cls} value={form.costo_mensile} onChange={sN('costo_mensile')} step="0.01" required />
        </Field>
        <Field label="Prezzo Mensile Cliente">
          <input name="prezzo_mensile_cliente" type="number" className={cls} value={form.prezzo_mensile_cliente} onChange={sN('prezzo_mensile_cliente')} step="0.01" />
        </Field>
        <Field label="Assicurazione Annua (€)">
          <input name="costo_assicurazione" type="number" className={cls} value={form.costo_assicurazione} onChange={sN('costo_assicurazione')} step="0.01" />
        </Field>
        <Field label="Bollo Annuo (€)">
          <input name="costo_bollo" type="number" className={cls} value={form.costo_bollo} onChange={sN('costo_bollo')} step="0.01" />
        </Field>
        <Field label="Manutenzione Annua (€)">
          <input name="costo_manutenzione" type="number" className={cls} value={form.costo_manutenzione} onChange={sN('costo_manutenzione')} step="0.01" />
        </Field>
      </Sect>

      {/* P&L Live */}
      {preview.costoG > 0 && (
        <div className={`rounded-2xl border p-5 ${preview.margineG >= 0 ? 'border-green-100 bg-green-50/40' : 'border-red-100 bg-red-50/30'}`}>
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3">
            Preview P&L — Aggiornato in Tempo Reale
          </p>
          <div className="grid grid-cols-5 gap-2 text-center">
            {[
              { l: 'Costo/g',   v: preview.costoG,   sign: false },
              { l: 'Ricavo/g',  v: preview.ricavoG,  sign: false },
              { l: 'Margine/g', v: preview.margineG, sign: true  },
              { l: 'Margine/m', v: preview.margineM, sign: true  },
              { l: 'Margine/a', v: preview.margineA, sign: true  },
            ].map(r => (
              <div key={r.l} className={`rounded-xl border p-2.5 ${r.sign ? (r.v >= 0 ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100') : 'bg-white border-slate-100'}`}>
                <div className="text-[9px] font-bold uppercase tracking-wide text-slate-400">{r.l}</div>
                <div className={`mt-1 text-sm font-bold font-mono ${r.sign ? (r.v >= 0 ? 'text-green-700' : 'text-red-600') : 'text-slate-700'}`}>
                  {r.sign && r.v >= 0 ? '+' : r.sign && r.v < 0 ? '−' : ''}{euro(Math.abs(r.v))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
