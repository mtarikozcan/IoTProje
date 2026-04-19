'use client'

import { useEffect, useState } from 'react'
import {
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { formatMetric } from '@/lib/utils'
import type { ChartPoint } from '@/types'

export function LiveChart({ data }: { data: ChartPoint[] }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div className="panel h-[360px] p-4">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-tx-label">B3.2</p>
          <h3 className="mt-1 text-lg font-semibold text-tx-primary">Son 60 Veri Noktasi</h3>
        </div>
        <div className="flex gap-4 text-sm">
          <span className="text-amber-400">Enerji</span>
          <span className="text-blue-400">Trafik</span>
        </div>
      </div>

      {mounted ? (
        data.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-tx-muted">
            Henüz canlı veri yok.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data}>
              <XAxis dataKey="time" stroke="#666666" tickLine={false} axisLine={false} minTickGap={24} />
              <YAxis
                yAxisId="energy"
                stroke="#f59e0b"
                tickLine={false}
                axisLine={false}
                width={56}
                tickFormatter={(value) => `${value}`}
              />
              <YAxis
                yAxisId="traffic"
                orientation="right"
                stroke="#3b82f6"
                tickLine={false}
                axisLine={false}
                width={56}
                tickFormatter={(value) => `${value}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#141414',
                  border: '1px solid #2a2a2a',
                  borderRadius: 8,
                }}
                labelStyle={{ color: '#a0a0a0' }}
                formatter={(value, name) => [
                  `${formatMetric(Number(value || 0))} ${name === 'energy' ? 'kWh' : 'araç/dk'}`,
                  name === 'energy' ? 'Enerji' : 'Trafik',
                ]}
              />
              <Line yAxisId="energy" type="monotone" dataKey="energy" stroke="#f59e0b" strokeWidth={2.25} dot={false} />
              <Line yAxisId="traffic" type="monotone" dataKey="traffic" stroke="#3b82f6" strokeWidth={2.25} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        )
      ) : (
        <div className="flex h-full items-center justify-center text-sm text-tx-muted">
          Grafik hazirlaniyor...
        </div>
      )}
    </div>
  )
}
