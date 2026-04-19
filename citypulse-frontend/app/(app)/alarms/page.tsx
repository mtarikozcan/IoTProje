'use client'

import { useEffect, useState } from 'react'

import { useCityPulseContext } from '@/components/providers/CityPulseProvider'
import { Badge } from '@/components/ui/Badge'
import { api } from '@/lib/api'
import { formatDateTime, formatMetric } from '@/lib/utils'
import type { Alarm } from '@/types'

export default function AlarmsPage() {
  const { hydrateAlarms, markAlarmResolved } = useCityPulseContext()
  const [alarms, setAlarms] = useState<Alarm[]>([])
  const [loadingIds, setLoadingIds] = useState<string[]>([])

  useEffect(() => {
    async function loadAlarms() {
      try {
        const response = await api.get<Alarm[]>('/alarms')
        setAlarms(response.data)
        hydrateAlarms(response.data.filter((alarm) => !alarm.resolved))
      } catch (error) {
        console.warn('Alarm load warning:', error)
      }
    }

    void loadAlarms()
  }, [hydrateAlarms])

  async function handleResolve(alarmId: string) {
    setLoadingIds((previous) => [...previous, alarmId])

    try {
      await api.put(`/alarms/${alarmId}/resolve`)
      setAlarms((previous) =>
        previous.map((alarm) => (alarm.alarmId === alarmId ? { ...alarm, resolved: true } : alarm))
      )
      markAlarmResolved(alarmId)
    } catch (error) {
      console.warn('Resolve alarm warning:', error)
    } finally {
      setLoadingIds((previous) => previous.filter((value) => value !== alarmId))
    }
  }

  return (
    <div className="space-y-6">
      <div className="panel p-4">
        <p className="text-xs uppercase tracking-[0.2em] text-tx-label">Alarm yonetimi</p>
        <h2 className="mt-1 text-xl font-semibold text-tx-primary">Aktif ve gecmis alarmlar</h2>
      </div>

      <div className="space-y-4">
        {alarms.length === 0 ? (
          <div className="panel p-6 text-sm text-tx-secondary">Kayitli alarm bulunmuyor.</div>
        ) : (
          alarms.map((alarm) => (
            <div key={alarm.alarmId} className="panel p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={alarm.resolved ? 'resolved' : alarm.severity}>
                      {alarm.resolved ? 'resolved' : alarm.severity}
                    </Badge>
                    <span className="font-medium text-tx-primary">{alarm.sensorId}</span>
                    <span className="text-sm text-tx-muted">{formatDateTime(alarm.timestamp)}</span>
                  </div>

                  <p className="text-sm text-tx-secondary">{alarm.message}</p>

                  <div className="flex flex-wrap gap-4 text-sm text-tx-secondary">
                    <span>Deger: {formatMetric(alarm.value)}</span>
                    <span>5m Ortalama: {formatMetric(alarm.average5m)}</span>
                    <span>Sapma: {formatMetric(alarm.deviation)}x</span>
                  </div>
                </div>

                {!alarm.resolved && (
                  <button
                    type="button"
                    onClick={() => void handleResolve(alarm.alarmId)}
                    disabled={loadingIds.includes(alarm.alarmId)}
                    className="rounded-lg border border-red-800 bg-red-950/30 px-4 py-2 text-sm text-red-200 transition-colors hover:bg-red-950/50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Cozuldu Isaretle
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
