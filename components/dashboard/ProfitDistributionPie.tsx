 'use client'
import React from 'react'
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts'

function CustomPieTooltip({ active, payload }: any) {
  if (!active || !payload || !payload.length) return null
  return (
    <div className="bg-white border border-slate-100 rounded-xl shadow-xl px-3.5 py-2.5 text-xs">
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center justify-between gap-3">
          <div className="text-slate-600 font-semibold">{p.payload.name}</div>
          <div className="text-slate-800 font-bold">{p.value} veicoli</div>
        </div>
      ))}
    </div>
  )
}

export default function ProfitDistributionPie({ data }: { data: { name: string; value: number }[] }) {
  const COLORS = ['#10b981', '#ef4444']
  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={44} outerRadius={80} paddingAngle={4}>
          {data.map((entry, i) => (
            <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip content={<CustomPieTooltip />} />
        <Legend verticalAlign="bottom" wrapperStyle={{ fontSize: 12, color: '#64748b' }} />
      </PieChart>
    </ResponsiveContainer>
  )
}
