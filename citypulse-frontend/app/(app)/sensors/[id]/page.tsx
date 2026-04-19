'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { useCityPulseContext } from '@/components/providers/CityPulseProvider'
import { StatCard } from '@/components/ui/StatCard'
import { api } from '@/lib/api'
import { formatClock, formatDateTime, formatMetric } from '@/lib/utils'
import type { SensorData } from '@/types'

interface SensorStats {
  sensorId: string
  count: number
  min: number
  max: number
  avg: number
}

export default function SensorDetailPage() {
  const params = useParams<{ id: string }>()
  const { sensorMap } = useCityPulseContext()
  const [history, setHistory] = useState<SensorData[]>([])
  const [stats, setStats] = useState<SensorStats | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    async function loadSensor() {
      try {
        const [historyResponse, statsResponse] = await Promise.all([
          api.get<SensorData[]>(`/sensors/${params.id}/history?limit=100`),
          api.get<SensorStats>(`/sensors/${params.id}/stats`),
        ])

        setHistory(historyResponse.data)
        setStats(statsResponse.data)
      } catch (error) {
        console.warn('Sensor detail load warning:', error)
      }
    }

    void loadSensor()
  }, [params.id])

  useEffect(() => {
    setMounted(true)
  }, [])

  const currentSensor = sensorMap.get(params.id) || history[0]
  const chartSeries = useMemo(
    () =>
      [...history]
        .reverse()
        .slice(-100)
        .map((reading) => ({
          time: formatClock(reading.timestamp),
          value: Number(reading.value),
        })),
    [history]
  )

  const anomalyCount = history.filter((reading) => reading.status !== 'normal').length

  return (
    <div className="space-y-6">
      <div className="panel p-5">
        <p className="text-xs uppercase tracking-[0.2em] text-tx-label">{params.id}</p>
        <h2 className="mt-2 text-2xl font-semibold text-tx-primary">
          {currentSensor?.location || 'Sensor detayi'}
        </h2>
        <p className="mt-2 text-sm text-tx-secondary">
          Tip: {currentSensor?.sensorType || '-'} | Son deger: {currentSensor ? formatMetric(currentSensor.value) : '-'}{' '}
          {currentSensor?.unit || ''}
        </p>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Min" value={stats ? formatMetric(stats.min) : '-'} helper="Kaydedilen en dusuk deger" />
        <StatCard label="Max" value={stats ? formatMetric(stats.max) : '-'} helper="Kaydedilen en yuksek deger" />
        <StatCard label="Ortalama" value={stats ? formatMetric(stats.avg) : '-'} helper="Tum veri noktalarinin ortalamasi" />
        <StatCard label="Anomali" value={anomalyCount} helper="History icindeki warning/critical" tone={anomalyCount > 0 ? 'danger' : 'success'} />
      </section>

      <section className="panel h-[360px] p-4">
        <div className="mb-4">
          <p className="text-xs uppercase tracking-[0.2em] text-tx-label">24h Grafik</p>
          <h3 className="mt-1 text-lg font-semibold text-tx-primary">Son 100 olcum</h3>
        </div>
        {mounted ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartSeries}>
              <XAxis dataKey="time" stroke="#666666" tickLine={false} axisLine={false} minTickGap={24} />
              <YAxis stroke={currentSensor?.sensorType === 'energy' ? '#f59e0b' : '#3b82f6'} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#141414',
                  border: '1px solid #2a2a2a',
                  borderRadius: 8,
                }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke={currentSensor?.sensorType === 'energy' ? '#f59e0b' : '#3b82f6'}
                strokeWidth={2.25}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-tx-muted">
            Grafik hazirlaniyor...
          </div>
        )}
      </section>

      <section className="panel overflow-hidden">
        <div className="border-b border-border px-4 py-3">
          <h3 className="text-lg font-semibold text-tx-primary">Veri Tablosu</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-surface text-tx-label">
              <tr>
                <th className="px-4 py-3 font-medium">Zaman</th>
                <th className="px-4 py-3 font-medium">Deger</th>
                <th className="px-4 py-3 font-medium">Ortalama 5m</th>
                <th className="px-4 py-3 font-medium">Durum</th>
              </tr>
            </thead>
            <tbody>
              {history.map((reading) => (
                <tr key={`${reading.sensorId}-${reading.timestamp}`} className="border-t border-border/60 text-tx-secondary">
                  <td className="px-4 py-3">{formatDateTime(reading.timestamp)}</td>
                  <td className="px-4 py-3">
                    {formatMetric(reading.value)} {reading.unit}
                  </td>
                  <td className="px-4 py-3">{formatMetric(reading.average5m)}</td>
                  <td className="px-4 py-3 capitalize">{reading.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
