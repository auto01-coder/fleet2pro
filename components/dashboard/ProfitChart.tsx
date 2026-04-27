'use client'
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine,
} from 'recharts'
import type { CashFlowMese } from '@/lib/types'

// ── Custom Tooltip ────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }: {
  active?: boolean
  payload?: Array<{ name: string; value: number; color?: string }>
  label?: string
}) {
  if (!active || !payload?.length) return null

  const hasCostInc = payload.some(p => /spesa|costi|costo|incasso|ricavi|ricavo/i.test(String(p.name)))

  if (hasCostInc) {
    const spesaItem = payload.find(p => /spesa|costi|costo/i.test(String(p.name)))
    const incassoItem = payload.find(p => /incasso|ricavi|ricavo/i.test(String(p.name)))
    const spesaVal = spesaItem?.value ?? 0
    const incassoVal = incassoItem?.value ?? 0
    const profit = incassoVal - spesaVal

    return (
      <div className="bg-white border border-slate-100 rounded-xl shadow-xl px-3.5 py-2.5 text-xs">
        <p className="font-semibold text-slate-600 mb-1.5">{label}</p>
        <div className="flex items-center gap-2 mb-0.5">
          <span className="w-2 h-2 rounded-full" style={{ background: '#ef4444' }} />
          <span className="text-slate-500">Spesa:</span>
          <span className="font-bold text-slate-800">-€{spesaVal.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
        <div className="flex items-center gap-2 mb-0.5">
          <span className="w-2 h-2 rounded-full" style={{ background: '#10b981' }} />
          <span className="text-slate-500">Incasso:</span>
          <span className="font-bold text-slate-800">+€{incassoVal.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: profit >= 0 ? '#10b981' : '#ef4444' }} />
          <span className="text-slate-500">Profitto:</span>
          <span className="font-bold text-slate-800">{profit >= 0 ? '+' : '−'}€{Math.abs(profit).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white border border-slate-100 rounded-xl shadow-xl px-3.5 py-2.5 text-xs">
      <p className="font-semibold text-slate-600 mb-1.5">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 mb-0.5">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color ?? '#94a3b8' }} />
          <span className="text-slate-500">{p.name}:</span>
          <span className="font-bold text-slate-800">€{(p.value ?? 0).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
      ))}
    </div>
  )
}

// ── Margine nel tempo (Area) ──────────────────────────────────────
export function MargineChart({ data }: { data: CashFlowMese[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="margineGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 10, fill: '#94a3b8' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={s => s.split(' ')[0]} // just month name
        />
        <YAxis
          tickFormatter={v => `€${(v / 1000).toFixed(0)}k`}
          tick={{ fontSize: 10, fill: '#94a3b8' }}
          axisLine={false}
          tickLine={false}
          width={48}
        />
        <Tooltip content={<CustomTooltip />} />
        <ReferenceLine y={0} stroke="#e2e8f0" strokeDasharray="4 4" />
        <Area
          type="monotone"
          dataKey="margine"
          name="Margine €"
          stroke="#6366f1"
          strokeWidth={2}
          fill="url(#margineGrad)"
          dot={false}
          activeDot={{ r: 4, fill: '#6366f1' }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

// ── Costi vs Ricavi (Bar) ─────────────────────────────────────────
export function CostiRicaviChart({ data }: { data: CashFlowMese[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} barGap={2} barCategoryGap="35%" margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 10, fill: '#94a3b8' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={s => s.split(' ')[0]}
        />
        <YAxis
          tickFormatter={v => `€${(v / 1000).toFixed(0)}k`}
          tick={{ fontSize: 10, fill: '#94a3b8' }}
          axisLine={false}
          tickLine={false}
          width={48}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          formatter={v => <span className="text-xs text-slate-500">{v}</span>}
          iconType="circle"
          iconSize={8}
        />
        <Bar dataKey="costi"  name="Spesa"  fill="#ef4444" radius={[3, 3, 0, 0]} opacity={0.85} />
        <Bar dataKey="ricavi" name="Incasso" fill="#10b981" radius={[3, 3, 0, 0]} opacity={0.85} />
      </BarChart>
    </ResponsiveContainer>
  )
}

// ── CashFlow netto (Area stacked) ────────────────────────────────
export function CashFlowChart({ data }: { data: CashFlowMese[] }) {
  return (
    <ResponsiveContainer width="100%" height={180}>
      <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="costiGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#ef4444" stopOpacity={0.1} />
            <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="ricaviGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#10b981" stopOpacity={0.1} />
            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 10, fill: '#94a3b8' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={s => s.split(' ')[0]}
        />
        <YAxis
          tickFormatter={v => `€${(v / 1000).toFixed(0)}k`}
          tick={{ fontSize: 10, fill: '#94a3b8' }}
          axisLine={false}
          tickLine={false}
          width={48}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area type="monotone" dataKey="ricavi" name="Incasso" stroke="#10b981" strokeWidth={1.5} fill="url(#ricaviGrad)" dot={false} />
        <Area type="monotone" dataKey="costi"  name="Spesa"  stroke="#ef4444" strokeWidth={1.5} fill="url(#costiGrad)"  dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  )
}
