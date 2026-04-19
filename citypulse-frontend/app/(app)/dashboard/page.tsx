'use client'

import { useEffect, useState } from 'react'

import { AlarmFeed } from '@/components/dashboard/AlarmFeed'
import { LiveChart } from '@/components/dashboard/LiveChart'
import { SensorCard } from '@/components/dashboard/SensorCard'
import { useCityPulseContext } from '@/components/providers/CityPulseProvider'
import { StatCard } from '@/components/ui/StatCard'
import { api } from '@/lib/api'
import type { Alarm, DashboardSummary, SensorData } from '@/types'

export default function DashboardPage() {
  const {
    sensors,
    alarms,
    connected,
    chartData,
    hydrateSensors,
    hydrateAlarms,
  } = useCityPulseContext()
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true)
        setError(null)
        const [sensorResponse, alarmResponse, summaryResponse] = await Promise.all([
          api.get<SensorData[]>('/sensors'),
          api.get<Alarm[]>('/alarms?resolved=false'),
          api.get<DashboardSummary>('/dashboard/summary'),
        ])

        hydrateSensors(sensorResponse.data)
        hydrateAlarms(alarmResponse.data)
        setSummary(summaryResponse.data)
      } catch (error) {
        setError('Dashboard verisi yüklenemedi.')
        console.warn('Dashboard load warning:', error)
      } finally {
        setLoading(false)
      }
    }

    void loadDashboard()
  }, [hydrateAlarms, hydrateSensors])

  const orderedSensors = [...sensors].sort((left, right) => left.sensorId.localeCompare(right.sensorId))

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Aktif Sensor"
          value={summary?.activeSensors ?? sensors.length}
          helper="Beklenen: 10 sensor"
          tone="energy"
        />
        <StatCard
          label="Toplam Veri"
          value={summary?.readingsLastHour ?? 0}
          helper="Son 1 saat"
          tone="traffic"
        />
        <StatCard
          label="Aktif Alarm"
          value={summary?.activeAlarms ?? alarms.filter((alarm) => !alarm.resolved).length}
          helper="Cozulmemis alarm"
          tone={alarms.some((alarm) => !alarm.resolved) ? 'danger' : 'success'}
        />
        <StatCard
          label="Sistem Durumu"
          value={
            summary?.systemStatus === 'critical'
              ? 'Kritik'
              : summary?.systemStatus === 'warning'
                ? 'Uyari'
                : 'Saglikli'
          }
          helper={connected ? 'WebSocket canlı' : 'WebSocket bağlantısı bekleniyor'}
          tone={
            summary?.systemStatus === 'critical'
              ? 'danger'
              : summary?.systemStatus === 'warning'
                ? 'traffic'
                : 'success'
          }
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_360px]">
        <LiveChart data={chartData} />
        <AlarmFeed alarms={alarms.filter((alarm) => !alarm.resolved)} />
      </section>

      {error ? (
        <div className="panel p-4 text-sm text-red-300">{error}</div>
      ) : loading && orderedSensors.length === 0 ? (
        <div className="panel p-4 text-sm text-tx-secondary">Dashboard verisi yükleniyor...</div>
      ) : orderedSensors.length === 0 ? (
        <div className="panel p-4 text-sm text-tx-secondary">Henüz sensör verisi alınmadı.</div>
      ) : (
        <section className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          {orderedSensors.map((sensor) => (
            <SensorCard key={sensor.sensorId} sensor={sensor} />
          ))}
        </section>
      )}
    </div>
  )
}
