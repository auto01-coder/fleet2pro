'use client'
import { useEffect, useState } from 'react'
import { getVehicles } from '@/lib/api'
import type { VehicleProfit } from '@/lib/types'
import VehicleTable from '@/components/flotta/VehicleTable'
import Link from 'next/link'

export default function FlottaPage() {
  const [vehicles, setVehicles] = useState<VehicleProfit[]>([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    getVehicles().then(data => {
      setVehicles(data)
      setLoading(false)
    })
  }, [])

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-slate-100 shadow-sm px-8 h-14 flex items-center justify-between">
        <div>
          <h1 className="text-[15px] font-semibold text-slate-900">Flotta</h1>
          <p className="text-[11px] text-slate-400">{vehicles.length} veicoli totali</p>
        </div>
        <Link
          href="/flotta/nuova"
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors"
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M5 1v8M1 5h8" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          Aggiungi Veicolo
        </Link>
      </div>

      <div className="px-8 py-6 max-w-[1400px] mx-auto">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-slate-200 border-t-slate-600 rounded-full animate-spin" />
          </div>
        ) : (
          <VehicleTable vehicles={vehicles} />
        )}
      </div>
    </div>
  )
}
