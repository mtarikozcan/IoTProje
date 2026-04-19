import { Badge } from '@/components/ui/Badge'
import { formatDateTime } from '@/lib/utils'
import type { Alarm } from '@/types'

export function AlarmFeed({ alarms }: { alarms: Alarm[] }) {
  return (
    <div className="panel h-full p-4">
      <div className="mb-5">
        <p className="text-xs uppercase tracking-[0.2em] text-tx-label">Alarm Feed</p>
        <h3 className="mt-1 text-lg font-semibold text-tx-primary">Son 20 Alarm</h3>
      </div>

      {alarms.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-6 text-sm text-tx-secondary">
          Aktif alarm yok ✓
        </div>
      ) : (
        <div className="space-y-3">
          {alarms.slice(0, 20).map((alarm) => (
            <div key={alarm.alarmId} className="rounded-lg border border-border bg-surface p-3">
              <div className="flex items-center justify-between gap-2">
                <Badge variant={alarm.severity}>{alarm.severity}</Badge>
                <span className="text-xs text-tx-muted">{formatDateTime(alarm.timestamp)}</span>
              </div>
              <p className="mt-3 text-sm font-medium text-tx-primary">{alarm.sensorId}</p>
              <p className="mt-1 text-sm text-tx-secondary">{alarm.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

