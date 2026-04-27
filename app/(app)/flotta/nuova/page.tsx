import VehicleFormPage from '@/components/flotta/VehicleForm'
import Link from 'next/link'

export default function NuovaAutoPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="sticky top-0 z-10 bg-white border-b border-slate-100 shadow-sm px-8 h-14 flex items-center gap-4">
        <Link href="/flotta" className="text-slate-400 hover:text-slate-600">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 4L6 8l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Link>
        <h1 className="text-[15px] font-semibold text-slate-900">Aggiungi Veicolo</h1>
      </div>
      <div className="px-8 py-6 max-w-3xl mx-auto">
        <VehicleFormPage />
      </div>
    </div>
  )
}
