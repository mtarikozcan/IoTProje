'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

import { useCityPulseContext } from '@/components/providers/CityPulseProvider'
import { Badge } from '@/components/ui/Badge'
import { api } from '@/lib/api'
import { cn, formatMetricWithUnit, formatRelativeTime, getSensorTypeLabel } from '@/lib/utils'
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
      [...sensors]
        .filter((sensor) => {
          const matchesType = typeFilter === 'all' || sensor.sensorType === typeFilter
          const matchesStatus = statusFilter === 'all' || sensor.status === statusFilter
          return matchesType && matchesStatus
        })
        .sort((left, right) => left.sensorId.localeCompare(right.sensorId)),
    [sensors, statusFilter, typeFilter]
  )

  return (
    <div className="space-y-6">
      <div className="panel flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-tx-label">Sensörler</p>
          <h2 className="mt-1 text-xl font-semibold text-tx-primary">Canlı sensör tablosu</h2>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="flex min-w-[168px] flex-col gap-1 text-xs uppercase tracking-[0.18em] text-tx-label">
            Sensör tipi
            <select
              className="rounded-lg border border-border bg-surface px-3 py-2 text-sm normal-case text-tx-primary outline-none transition-colors focus:border-blue-700"
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value as typeof typeFilter)}
            >
              <option value="all">Tümü</option>
              <option value="energy">Enerji</option>
              <option value="traffic">Trafik</option>
            </select>
          </label>
          <label className="flex min-w-[168px] flex-col gap-1 text-xs uppercase tracking-[0.18em] text-tx-label">
            Durum
            <select
              className="rounded-lg border border-border bg-surface px-3 py-2 text-sm normal-case text-tx-primary outline-none transition-colors focus:border-blue-700"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}
            >
              <option value="all">Tümü</option>
              <option value="normal">Normal</option>
              <option value="warning">Uyarı</option>
              <option value="critical">Kritik</option>
            </select>
          </label>
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
                  <th className="px-4 py-3 font-medium">Sensör</th>
                  <th className="px-4 py-3 font-medium">Konum</th>
                  <th className="px-4 py-3 font-medium">Tip</th>
                  <th className="px-4 py-3 font-medium">Son Değer</th>
                  <th className="px-4 py-3 font-medium">Durum</th>
                  <th className="px-4 py-3 font-medium">Son Güncelleme</th>
                  <th className="px-4 py-3 font-medium">Detay</th>
                </tr>
              </thead>
              <tbody>
                {filteredSensors.map((sensor) => (
                  <tr
                    key={sensor.sensorId}
                    className={cn(
                      'border-b border-border/60 text-tx-secondary transition-colors hover:bg-surface',
                      sensor.status !== 'normal' && 'bg-surface/60'
                    )}
                  >
                    <td className="px-4 py-3 font-medium text-tx-primary">{sensor.sensorId}</td>
                    <td className="px-4 py-3 leading-6">{sensor.location}</td>
                    <td className="px-4 py-3">{getSensorTypeLabel(sensor.sensorType)}</td>
                    <td className="px-4 py-3 font-medium text-tx-primary">
                      {formatMetricWithUnit(sensor.value, sensor.unit)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={sensor.status} />
                    </td>
                    <td className="px-4 py-3">{formatRelativeTime(sensor.timestamp)}</td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/sensors/${sensor.sensorId}`}
                        className="inline-flex rounded-lg border border-blue-900 bg-blue-950/30 px-3 py-1.5 text-sm font-medium text-blue-200 transition-colors hover:bg-blue-950/50"
                      >
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
