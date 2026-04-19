'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

import { useCityPulseContext } from '@/components/providers/CityPulseProvider'
import { Badge } from '@/components/ui/Badge'
import { api } from '@/lib/api'
import { formatMetric, formatRelativeTime } from '@/lib/utils'
import type { SensorData } from '@/types'

export default function SensorsPage() {
  const { sensors, hydrateSensors } = useCityPulseContext()
  const [typeFilter, setTypeFilter] = useState<'all' | 'energy' | 'traffic'>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'normal' | 'warning' | 'critical'>('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadSensors() {
      try {
        setLoading(true)
        setError(null)
        const response = await api.get<SensorData[]>('/sensors')
        hydrateSensors(response.data)
      } catch (error) {
        setError('Sensör listesi yüklenemedi.')
        console.warn('Sensors load warning:', error)
      } finally {
        setLoading(false)
      }
    }

    void loadSensors()
  }, [hydrateSensors])

  const filteredSensors = useMemo(
    () =>
      sensors.filter((sensor) => {
        const matchesType = typeFilter === 'all' || sensor.sensorType === typeFilter
        const matchesStatus = statusFilter === 'all' || sensor.status === statusFilter
        return matchesType && matchesStatus
      }),
    [sensors, statusFilter, typeFilter]
  )

  return (
    <div className="space-y-6">
      <div className="panel flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-tx-label">Sensorler</p>
          <h2 className="mt-1 text-xl font-semibold text-tx-primary">Canli sensor tablosu</h2>
        </div>

        <div className="flex flex-wrap gap-3">
          <select
            className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-tx-primary outline-none"
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value as typeof typeFilter)}
          >
            <option value="all">Tum tipler</option>
            <option value="energy">Enerji</option>
            <option value="traffic">Trafik</option>
          </select>
          <select
            className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-tx-primary outline-none"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}
          >
            <option value="all">Tum durumlar</option>
            <option value="normal">Normal</option>
            <option value="warning">Warning</option>
            <option value="critical">Critical</option>
          </select>
        </div>
      </div>

      <div className="panel overflow-hidden">
        {error ? (
          <div className="p-4 text-sm text-red-300">{error}</div>
        ) : loading && sensors.length === 0 ? (
          <div className="p-4 text-sm text-tx-secondary">Sensörler yükleniyor...</div>
        ) : filteredSensors.length === 0 ? (
          <div className="p-4 text-sm text-tx-secondary">Seçilen filtrelere uygun sensör bulunamadı.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-border bg-surface">
                <tr className="text-tx-label">
                  <th className="px-4 py-3 font-medium">Sensor</th>
                  <th className="px-4 py-3 font-medium">Konum</th>
                  <th className="px-4 py-3 font-medium">Tip</th>
                  <th className="px-4 py-3 font-medium">Son Deger</th>
                  <th className="px-4 py-3 font-medium">Durum</th>
                  <th className="px-4 py-3 font-medium">Son Guncelleme</th>
                  <th className="px-4 py-3 font-medium">Detay</th>
                </tr>
              </thead>
              <tbody>
                {filteredSensors.map((sensor) => (
                  <tr key={sensor.sensorId} className="border-b border-border/60 text-tx-secondary">
                    <td className="px-4 py-3 font-medium text-tx-primary">{sensor.sensorId}</td>
                    <td className="px-4 py-3">{sensor.location}</td>
                    <td className="px-4 py-3 capitalize">{sensor.sensorType}</td>
                    <td className="px-4 py-3">
                      {formatMetric(sensor.value)} {sensor.unit}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={sensor.status}>{sensor.status}</Badge>
                    </td>
                    <td className="px-4 py-3">{formatRelativeTime(sensor.timestamp)}</td>
                    <td className="px-4 py-3">
                      <Link href={`/sensors/${sensor.sensorId}`} className="text-blue-300 hover:text-blue-200">
                        Detay
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
