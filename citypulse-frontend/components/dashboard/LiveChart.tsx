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

import { formatDateTimeDetailed, formatMetric, formatMetricWithUnit } from '@/lib/utils'
import type { ChartPoint } from '@/types'

function getDomainPadding(minValue: number, maxValue: number): [number, number] {
  if (minValue === maxValue) {
    const padding = Math.max(5, Math.abs(maxValue) * 0.1 || 5)
    return [Math.max(0, minValue - padding), maxValue + padding]
  }

  const padding = Math.max(5, (maxValue - minValue) * 0.15)
  return [Math.max(0, minValue - padding), maxValue + padding]
}

function formatAxisTime(value: string) {
  return value.slice(0, 5)
}

export function LiveChart({ data }: { data: ChartPoint[] }) {
  const [mounted, setMounted] = useState(false)
  const latestPoint = data[data.length - 1]

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div className="panel flex h-[clamp(320px,36vw,380px)] min-w-0 flex-col overflow-hidden p-4 lg:p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.2em] text-tx-label">Canlı Grafik</p>
          <h3 className="mt-1 text-lg font-semibold text-tx-primary">Son 60 Veri Noktası</h3>
          <p className="mt-2 text-sm text-tx-secondary">
            Kent geneli enerji ve trafik ortalaması
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-sm">
          <span className="inline-flex items-center gap-2 rounded-lg border border-amber-950 bg-amber-950/20 px-3 py-1.5 text-amber-200">
            <span className="h-2 w-2 rounded-full bg-amber-400" />
            Enerji
            {latestPoint ? ` ${formatMetric(latestPoint.energy)} kWh` : ''}
          </span>
          <span className="inline-flex items-center gap-2 rounded-lg border border-blue-950 bg-blue-950/20 px-3 py-1.5 text-blue-200">
            <span className="h-2 w-2 rounded-full bg-blue-400" />
            Trafik
            {latestPoint ? ` ${formatMetric(latestPoint.traffic)} araç/dk` : ''}
          </span>
        </div>
      </div>

      <div className="min-h-0 flex-1 pt-4">
        {mounted ? (
          data.length === 0 ? (
            <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-border text-sm text-tx-muted">
              Henüz canlı veri yok.
            </div>
          ) : (
            <div className="h-full min-h-0 overflow-hidden rounded-lg">
              <ResponsiveContainer width="100%" height="100%" debounce={150}>
                <ComposedChart
                  data={data}
                  margin={{
                    top: 8,
                    right: 8,
                    left: -18,
                    bottom: 2,
                  }}
                >
                  <CartesianGrid vertical={false} stroke="#202020" strokeDasharray="3 3" />
                  <XAxis
                    dataKey="time"
                    stroke="#666666"
                    tickLine={false}
                    axisLine={false}
                    minTickGap={28}
                    tickMargin={10}
                    tick={{ fill: '#7a7a7a', fontSize: 12 }}
                    tickFormatter={formatAxisTime}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    yAxisId="energy"
                    stroke="#f59e0b"
                    tickLine={false}
                    axisLine={false}
                    width={54}
                    tickCount={5}
                    tickMargin={8}
                    tick={{ fill: '#b58a31', fontSize: 12 }}
                    tickFormatter={(value) => formatMetric(Number(value))}
                    domain={([dataMin, dataMax]) => getDomainPadding(Number(dataMin), Number(dataMax))}
                  />
                  <YAxis
                    yAxisId="traffic"
                    orientation="right"
                    stroke="#3b82f6"
                    tickLine={false}
                    axisLine={false}
                    width={54}
                    tickCount={5}
                    tickMargin={8}
                    tick={{ fill: '#72a7ff', fontSize: 12 }}
                    tickFormatter={(value) => formatMetric(Number(value))}
                    domain={([dataMin, dataMax]) => getDomainPadding(Number(dataMin), Number(dataMax))}
                  />
                  <Tooltip
                    cursor={{
                      stroke: '#2c2c2c',
                      strokeWidth: 1,
                    }}
                    contentStyle={{
                      backgroundColor: '#141414',
                      border: '1px solid #2a2a2a',
                      borderRadius: 8,
                      padding: '10px 12px',
                    }}
                    labelStyle={{ color: '#a0a0a0', marginBottom: 6 }}
                    labelFormatter={(_, payload) => {
                      const point = payload?.[0]?.payload as ChartPoint | undefined
                      return point ? formatDateTimeDetailed(point.timestamp) : ''
                    }}
                    formatter={(value, name) => [
                      formatMetricWithUnit(Number(value || 0), name === 'energy' ? 'kWh' : 'araç/dk'),
                      name === 'energy' ? 'Enerji ortalaması' : 'Trafik ortalaması',
                    ]}
                  />
                  <Line
                    yAxisId="energy"
                    type="monotone"
                    dataKey="energy"
                    stroke="#f59e0b"
                    strokeWidth={2.5}
                    strokeLinecap="round"
                    connectNulls
                    dot={data.length <= 16 ? { r: 2, fill: '#f59e0b', strokeWidth: 0 } : false}
                    activeDot={{ r: 4, fill: '#f59e0b', strokeWidth: 0 }}
                    isAnimationActive={false}
                  />
                  <Line
                    yAxisId="traffic"
                    type="monotone"
                    dataKey="traffic"
                    stroke="#3b82f6"
                    strokeWidth={2.5}
                    strokeDasharray="5 4"
                    strokeLinecap="round"
                    connectNulls
                    dot={data.length <= 16 ? { r: 2, fill: '#3b82f6', strokeWidth: 0 } : false}
                    activeDot={{ r: 4, fill: '#3b82f6', strokeWidth: 0 }}
                    isAnimationActive={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )
        ) : (
          <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-border text-sm text-tx-muted">
            Grafik hazırlanıyor...
          </div>
        )}
      </div>
    </div>
  )
}
