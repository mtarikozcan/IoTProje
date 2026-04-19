import { Badge } from '@/components/ui/Badge'
import { formatCompactDateTime } from '@/lib/utils'
import type { Alarm } from '@/types'

export function AlarmFeed({ alarms }: { alarms: Alarm[] }) {
  return (
    <div className="panel h-full p-4">
      <div className="mb-5">
        <p className="text-xs uppercase tracking-[0.2em] text-tx-label">Alarm Akışı</p>
        <h3 className="mt-1 text-lg font-semibold text-tx-primary">Son 20 Alarm</h3>
      </div>

      {alarms.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-6 text-sm text-tx-secondary">
          Aktif alarm yok ✓
        </div>
      ) : (
        <div className="space-y-3">
          {alarms.slice(0, 20).map((alarm) => (
            <div key={alarm.alarmId} className="rounded-lg border border-border bg-surface p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={alarm.severity} />
                    <span className="text-sm font-medium text-tx-primary">{alarm.sensorId}</span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-tx-secondary break-words">{alarm.message}</p>
                </div>
                <span className="whitespace-nowrap text-xs text-tx-muted">{formatCompactDateTime(alarm.timestamp)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
