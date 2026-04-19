'use client'

import { useEffect, useState } from 'react'

import { useCityPulseContext } from '@/components/providers/CityPulseProvider'
import { Badge } from '@/components/ui/Badge'
import { api } from '@/lib/api'
import { formatCompactDateTime, formatMetric, formatMetricWithUnit } from '@/lib/utils'
import type { Alarm } from '@/types'

export default function AlarmsPage() {
  const { hydrateAlarms, markAlarmResolved } = useCityPulseContext()
  const [alarms, setAlarms] = useState<Alarm[]>([])
  const [loadingIds, setLoadingIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadAlarms() {
      try {
        setLoading(true)
        setError(null)
        const response = await api.get<Alarm[]>('/alarms')
        setAlarms(response.data)
        hydrateAlarms(response.data.filter((alarm) => !alarm.resolved))
      } catch (error) {
        setError('Alarm listesi yüklenemedi.')
        console.warn('Alarm load warning:', error)
      } finally {
        setLoading(false)
      }
    }

    void loadAlarms()
  }, [hydrateAlarms])

  async function handleResolve(alarmId: string) {
    setLoadingIds((previous) => [...previous, alarmId])

    try {
      const response = await api.put<Alarm>(`/alarms/${alarmId}/resolve`)
      setAlarms((previous) =>
        previous.map((alarm) => (alarm.alarmId === alarmId ? response.data : alarm))
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
        <p className="text-xs uppercase tracking-[0.2em] text-tx-label">Alarm yönetimi</p>
        <h2 className="mt-1 text-xl font-semibold text-tx-primary">Aktif ve geçmiş alarmlar</h2>
      </div>

      <div className="space-y-4">
        {error ? (
          <div className="panel p-6 text-sm text-red-300">{error}</div>
        ) : loading ? (
          <div className="panel p-6 text-sm text-tx-secondary">Alarmlar yükleniyor...</div>
        ) : alarms.length === 0 ? (
          <div className="panel p-6 text-sm text-tx-secondary">Kayıtlı alarm bulunmuyor.</div>
        ) : (
          alarms.map((alarm) => (
            <div key={alarm.alarmId} className="panel p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={alarm.resolved ? 'resolved' : alarm.severity} />
                    <span className="font-medium text-tx-primary">{alarm.sensorId}</span>
                    <span className="text-sm text-tx-muted">{formatCompactDateTime(alarm.timestamp)}</span>
                  </div>

                  <p className="text-sm leading-6 text-tx-secondary break-words">{alarm.message}</p>

                  <div className="grid gap-2 text-sm text-tx-secondary sm:grid-cols-3">
                    <div className="rounded-lg border border-border/80 bg-surface px-3 py-2">
                      <p className="text-xs uppercase tracking-[0.16em] text-tx-label">Değer</p>
                      <p className="mt-1 font-medium text-tx-primary">{formatMetricWithUnit(alarm.value, alarm.sensorType === 'energy' ? 'kWh' : 'araç/dk')}</p>
                    </div>
                    <div className="rounded-lg border border-border/80 bg-surface px-3 py-2">
                      <p className="text-xs uppercase tracking-[0.16em] text-tx-label">5 dk ort.</p>
                      <p className="mt-1 font-medium text-tx-primary">{formatMetricWithUnit(alarm.average5m, alarm.sensorType === 'energy' ? 'kWh' : 'araç/dk')}</p>
                    </div>
                    <div className="rounded-lg border border-border/80 bg-surface px-3 py-2">
                      <p className="text-xs uppercase tracking-[0.16em] text-tx-label">Sapma oranı</p>
                      <p className="mt-1 font-medium text-tx-primary">{formatMetric(alarm.deviation)}x</p>
                    </div>
                  </div>
                </div>

                {!alarm.resolved && (
                  <div className="flex w-full justify-start lg:w-auto lg:justify-end">
                    <button
                      type="button"
                      onClick={() => void handleResolve(alarm.alarmId)}
                      disabled={loadingIds.includes(alarm.alarmId)}
                      className="rounded-lg border border-red-800 bg-red-950/30 px-4 py-2 text-sm font-medium text-red-200 transition-colors hover:bg-red-950/50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {loadingIds.includes(alarm.alarmId)
                        ? 'İşaretleniyor...'
                        : 'Çözüldü işaretle'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
