// ── Core domain types ─────────────────────────────────────────────

export type Tipologia = 'proprieta' | 'leasing' | 'nlt'
export type TipoNoleggio = 'giornaliero' | 'medio_termine' | 'nessuno'
export type VehicleStato = 'disponibile' | 'noleggiato' | 'manutenzione' | 'fermo'

export interface Vehicle {
  id: string
  targa: string
  marca: string
  modello: string
  anno: number
  carburante: string
  km_attuali: number
  tipologia: Tipologia
  tipo_noleggio?: TipoNoleggio | null
  stato: VehicleStato
  costo_mensile: number          // IVA esclusa
  prezzo_mensile_cliente?: number | null
  costo_assicurazione?: number | null
  costo_bollo?: number | null
  costo_manutenzione?: number | null
  costo_altri?: number | null
  assicurazione_data?: string | null
  bollo_data?: string | null
  tagliando_data?: string | null
  immatricolazione?: string | null
  km_contratto?: number | null
  data_fine_contratto?: string | null
  contratto_path?: string | null  // path privato in Storage bucket 'documenti'
  note?: string | null
  attivo: boolean
  created_at: string
}

export interface VehicleProfit extends Vehicle {
  // Computed client-side
  costo_totale_mensile: number   // canone + fissi/12
  costo_giornaliero: number
  ricavo_giornaliero: number
  margine_giornaliero: number
  margine_mensile: number
  margine_annuale: number
  in_perdita: boolean
  km_percentuale: number | null
  // Scadenze
  giorni_assicurazione: number | null
  giorni_bollo: number | null
  giorni_tagliando: number | null
  giorni_revisione: number | null
  prossima_scadenza_giorni: number | null
}

export interface CashFlowMese {
  mese: string   // 'YYYY-MM'
  label: string  // 'Gen 2025'
  costi: number
  ricavi: number
  margine: number
}

export interface DashboardKpi {
  totale_veicoli: number
  costo_mensile_totale: number
  ricavi_mensile_totale: number
  margine_mensile_totale: number
  veicoli_in_perdita: number
  alert_scadenze: number
  margine_annuale_stimato: number
}
