'use client'

import { useEffect, useState } from 'react'
import {
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { formatMetric, formatMetricWithUnit } from '@/lib/utils'
import type { ChartPoint } from '@/types'

function getDomainPadding(minValue: number, maxValue: number): [number, number] {
  if (minValue === maxValue) {
    const padding = Math.max(5, Math.abs(maxValue) * 0.1 || 5)
    return [Math.max(0, minValue - padding), maxValue + padding]
  }

  const padding = Math.max(5, (maxValue - minValue) * 0.15)
  return [Math.max(0, minValue - padding), maxValue + padding]
}

export function LiveChart({ data }: { data: ChartPoint[] }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div className="panel h-[360px] p-4 lg:h-[380px]">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-tx-label">Canlı Grafik</p>
          <h3 className="mt-1 text-lg font-semibold text-tx-primary">Son 60 Veri Noktası</h3>
        </div>
        <div className="flex gap-4 text-sm">
          <span className="inline-flex items-center gap-2 text-amber-300">
            <span className="h-2 w-2 rounded-full bg-amber-400" />
            Enerji
          </span>
          <span className="inline-flex items-center gap-2 text-blue-300">
            <span className="h-2 w-2 rounded-full bg-blue-400" />
            Trafik
          </span>
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
              <CartesianGrid vertical={false} stroke="#202020" />
              <XAxis dataKey="time" stroke="#666666" tickLine={false} axisLine={false} minTickGap={24} />
              <YAxis
                yAxisId="energy"
                stroke="#f59e0b"
                tickLine={false}
                axisLine={false}
                width={56}
                tickFormatter={(value) => formatMetric(Number(value))}
                domain={([dataMin, dataMax]) => getDomainPadding(Number(dataMin), Number(dataMax))}
              />
              <YAxis
                yAxisId="traffic"
                orientation="right"
                stroke="#3b82f6"
                tickLine={false}
                axisLine={false}
                width={56}
                tickFormatter={(value) => formatMetric(Number(value))}
                domain={([dataMin, dataMax]) => getDomainPadding(Number(dataMin), Number(dataMax))}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#141414',
                  border: '1px solid #2a2a2a',
                  borderRadius: 8,
                  padding: '10px 12px',
                }}
                labelStyle={{ color: '#a0a0a0' }}
                formatter={(value, name) => [
                  formatMetricWithUnit(Number(value || 0), name === 'energy' ? 'kWh' : 'araç/dk'),
                  name === 'energy' ? 'Enerji' : 'Trafik',
                ]}
              />
              <Line
                yAxisId="energy"
                type="monotone"
                dataKey="energy"
                stroke="#f59e0b"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 3, fill: '#f59e0b', strokeWidth: 0 }}
              />
              <Line
                yAxisId="traffic"
                type="monotone"
                dataKey="traffic"
                stroke="#3b82f6"
                strokeWidth={2.5}
                strokeDasharray="5 4"
                dot={false}
                activeDot={{ r: 3, fill: '#3b82f6', strokeWidth: 0 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )
      ) : (
        <div className="flex h-full items-center justify-center text-sm text-tx-muted">
          Grafik hazırlanıyor...
        </div>
      )}
    </div>
  )
}
