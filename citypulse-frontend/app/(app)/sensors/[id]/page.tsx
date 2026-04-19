'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { useCityPulseContext } from '@/components/providers/CityPulseProvider'
import { Badge } from '@/components/ui/Badge'
import { StatCard } from '@/components/ui/StatCard'
import { api } from '@/lib/api'
import { formatClock, formatDateTime, formatMetric, formatMetricWithUnit, getSensorTypeLabel } from '@/lib/utils'
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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadSensor() {
      try {
        setLoading(true)
        setError(null)
        const [historyResponse, statsResponse] = await Promise.all([
          api.get<SensorData[]>(`/sensors/${params.id}/history?limit=100`),
          api.get<SensorStats>(`/sensors/${params.id}/stats`),
        ])

        setHistory(historyResponse.data)
        setStats(statsResponse.data)
      } catch (error) {
        setError('Sensör detayı yüklenemedi.')
        console.warn('Sensor detail load warning:', error)
      } finally {
        setLoading(false)
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
        <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
          <h2 className="text-2xl font-semibold text-tx-primary">
            {currentSensor?.location || 'Sensör detayı'}
          </h2>
          {currentSensor && <Badge variant={currentSensor.status} />}
        </div>
        <p className="mt-2 text-sm text-tx-secondary">
          Tip: {currentSensor ? getSensorTypeLabel(currentSensor.sensorType) : '-'} | Son değer:{' '}
          {currentSensor ? formatMetric(currentSensor.value) : '-'}{' '}
          {currentSensor?.unit || ''}
        </p>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Minimum" value={stats ? formatMetric(stats.min) : '-'} helper="Kaydedilen en düşük değer" />
        <StatCard label="Maksimum" value={stats ? formatMetric(stats.max) : '-'} helper="Kaydedilen en yüksek değer" />
        <StatCard label="Ortalama" value={stats ? formatMetric(stats.avg) : '-'} helper="Tüm veri noktalarının ortalaması" />
        <StatCard label="Anomali" value={formatMetric(anomalyCount)} helper="Geçmişteki uyarı ve kritik kayıtlar" tone={anomalyCount > 0 ? 'danger' : 'success'} />
      </section>

      <section className="panel h-[360px] p-4 lg:h-[380px]">
        <div className="mb-4">
          <p className="text-xs uppercase tracking-[0.2em] text-tx-label">24h Grafik</p>
          <h3 className="mt-1 text-lg font-semibold text-tx-primary">Son 100 ölçüm</h3>
        </div>
        {error ? (
          <div className="flex h-full items-center justify-center text-sm text-red-300">{error}</div>
        ) : loading ? (
          <div className="flex h-full items-center justify-center text-sm text-tx-muted">
            Sensör geçmişi yükleniyor...
          </div>
        ) : chartSeries.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-tx-muted">
            Bu sensör için henüz geçmiş veri yok.
          </div>
        ) : mounted ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartSeries}>
              <CartesianGrid vertical={false} stroke="#202020" />
              <XAxis dataKey="time" stroke="#666666" tickLine={false} axisLine={false} minTickGap={24} />
              <YAxis
                stroke={currentSensor?.sensorType === 'energy' ? '#f59e0b' : '#3b82f6'}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => formatMetric(Number(value))}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#141414',
                  border: '1px solid #2a2a2a',
                  borderRadius: 8,
                  padding: '10px 12px',
                }}
                formatter={(value) => formatMetricWithUnit(Number(value), currentSensor?.unit || '')}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke={currentSensor?.sensorType === 'energy' ? '#f59e0b' : '#3b82f6'}
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 3, fill: currentSensor?.sensorType === 'energy' ? '#f59e0b' : '#3b82f6', strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-tx-muted">
            Grafik hazırlanıyor...
          </div>
        )}
      </section>

      <section className="panel overflow-hidden">
        <div className="border-b border-border px-4 py-3">
          <h3 className="text-lg font-semibold text-tx-primary">Veri Tablosu</h3>
        </div>
        <div className="overflow-x-auto">
          {history.length === 0 ? (
            <div className="p-4 text-sm text-tx-secondary">Gösterilecek veri bulunmuyor.</div>
          ) : (
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-border bg-surface text-tx-label">
                <tr>
                  <th className="px-4 py-3 font-medium">Zaman</th>
                  <th className="px-4 py-3 font-medium">Değer</th>
                  <th className="px-4 py-3 font-medium">Ortalama 5m</th>
                  <th className="px-4 py-3 font-medium">Durum</th>
                </tr>
              </thead>
              <tbody>
                {history.map((reading) => (
                  <tr
                    key={`${reading.sensorId}-${reading.timestamp}`}
                    className="border-t border-border/60 text-tx-secondary transition-colors hover:bg-surface"
                  >
                    <td className="px-4 py-3">{formatDateTime(reading.timestamp)}</td>
                    <td className="px-4 py-3 font-medium text-tx-primary">
                      {formatMetricWithUnit(reading.value, reading.unit)}
                    </td>
                    <td className="px-4 py-3">{formatMetric(reading.average5m)}</td>
                    <td className="px-4 py-3">
                      <Badge variant={reading.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  )
}
