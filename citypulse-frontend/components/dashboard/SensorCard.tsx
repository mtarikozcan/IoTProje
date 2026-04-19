import Link from 'next/link'

import { Badge } from '@/components/ui/Badge'
import { formatMetric, formatMetricWithUnit, formatRelativeTime } from '@/lib/utils'
import type { SensorData } from '@/types'

const typeIcon = {
  energy: '⚡',
  traffic: '🚗',
}

export function SensorCard({ sensor }: { sensor: SensorData }) {
  const tone = sensor.sensorType === 'energy' ? 'text-amber-400' : 'text-blue-400'

  return (
    <Link
      href={`/sensors/${sensor.sensorId}`}
      className="panel flex h-full min-h-[210px] flex-col p-4 transition-colors hover:border-blue-800 hover:bg-surface"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.18em] text-tx-label">{sensor.sensorId}</p>
          <p className="mt-1 min-h-[40px] text-sm leading-5 text-tx-secondary" title={sensor.location}>
            {sensor.location}
          </p>
        </div>
        <Badge variant={sensor.status} />
      </div>

      <div className="mt-5">
        <p className={`text-3xl font-semibold tracking-tight ${tone}`}>
          {typeIcon[sensor.sensorType]} {formatMetric(sensor.value)}
          <span className="ml-2 text-base font-medium text-tx-secondary">{sensor.unit}</span>
        </p>
      </div>

      <div className="mt-auto border-t border-border/80 pt-4">
        <p className="text-xs text-tx-muted">5 dk ortalaması: {formatMetricWithUnit(sensor.average5m, sensor.unit)}</p>
        <p className="mt-2 text-xs text-tx-muted">Son güncelleme: {formatRelativeTime(sensor.timestamp)}</p>
      </div>
    </Link>
  )
}
