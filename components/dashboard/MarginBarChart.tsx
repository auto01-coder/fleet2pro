 'use client'
import React from 'react'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts'
import { euro } from '@/lib/utils'

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null
  const p = payload[0]
  const value = p.value ?? 0
  return (
    <div className="bg-white border border-slate-100 rounded-xl shadow-xl px-3.5 py-2.5 text-xs">
      <div className="font-semibold text-slate-600 mb-1.5">{label}</div>
      <div className="flex items-center gap-2">
        <div className="text-slate-500">Profitto:</div>
        <div className="font-bold text-slate-900">{value >= 0 ? '+' : '−'}{euro(Math.abs(value))}</div>
      </div>
    </div>
  )
}

export default function MarginBarChart({ data }: { data: { targa: string; margine: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 10, right: 12, left: 6, bottom: 6 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis dataKey="targa" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
        <YAxis tickFormatter={(v) => `€${(v).toLocaleString('it-IT', { maximumFractionDigits: 0 })}`} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} width={80} />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="margine" radius={[6,6,0,0]} isAnimationActive>
          {data.map((entry, i) => (
            <Cell key={`cell-${i}`} fill={entry.margine >= 0 ? '#10b981' : '#ef4444'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
