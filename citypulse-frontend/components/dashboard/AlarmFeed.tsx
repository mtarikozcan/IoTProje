import Link from 'next/link'

import { Badge } from '@/components/ui/Badge'
import { formatCompactDateTime } from '@/lib/utils'
import type { Alarm } from '@/types'

export function AlarmFeed({ alarms }: { alarms: Alarm[] }) {
  const previewAlarms = alarms.slice(0, 4)

  return (
    <div className="panel self-start overflow-hidden p-4">
      <div className="mb-4">
        <p className="text-xs uppercase tracking-[0.2em] text-tx-label">Alarm Akışı</p>
        <h3 className="mt-1 text-lg font-semibold text-tx-primary">Son 4 Alarm</h3>
      </div>

      {alarms.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-5 text-sm text-tx-secondary">
          Aktif alarm yok ✓
        </div>
      ) : (
        <div className="space-y-2.5">
          {previewAlarms.map((alarm) => (
            <div key={alarm.alarmId} className="rounded-lg border border-border bg-surface p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={alarm.severity} />
                    <span className="text-sm font-medium text-tx-primary">{alarm.sensorId}</span>
                  </div>
                  <p className="mt-2 max-h-10 overflow-hidden text-sm leading-5 text-tx-secondary break-words">
                    {alarm.message}
                  </p>
                </div>
                <span className="whitespace-nowrap text-xs text-tx-muted">
                  {formatCompactDateTime(alarm.timestamp)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 border-t border-border/80 pt-4">
        <Link
          href="/alarms"
          className="inline-flex rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-tx-primary transition-colors hover:bg-surface-subtle"
        >
          Tümünü gör
        </Link>
      </div>
    </div>
  )
}
