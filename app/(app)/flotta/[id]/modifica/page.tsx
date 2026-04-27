'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { getVehicleById } from '@/lib/api'
import type { VehicleProfit } from '@/lib/types'
import VehicleFormPage from '@/components/flotta/VehicleForm'
import Link from 'next/link'

export default function ModificaVeicoloPage() {
  const { id } = useParams<{ id: string }>()
  const [vehicle, setVehicle] = useState<VehicleProfit | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) {
      getVehicleById(id).then(v => {
        setVehicle(v)
        setLoading(false)
      })
    }
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-2 border-slate-200 border-t-slate-600 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="sticky top-0 z-10 bg-white border-b border-slate-100 shadow-sm px-8 h-14 flex items-center gap-4">
        <Link href={`/flotta/${id}`} className="text-slate-400 hover:text-slate-600">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 4L6 8l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Link>
        <h1 className="text-[15px] font-semibold text-slate-900">
          Modifica · {vehicle?.targa ?? '…'}
        </h1>
      </div>
      <div className="px-8 py-6 max-w-3xl mx-auto">
        <VehicleFormPage vehicle={vehicle ?? undefined} />
      </div>
    </div>
  )
}
