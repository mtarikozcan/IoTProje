import Link from 'next/link'

import { Badge } from '@/components/ui/Badge'
import { formatMetric, formatRelativeTime } from '@/lib/utils'
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
      className="panel block p-4 transition-colors hover:border-blue-800"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-tx-label">{sensor.sensorId}</p>
          <p className="mt-1 text-sm text-tx-secondary">{sensor.location}</p>
        </div>
        <Badge variant={sensor.status}>{sensor.status}</Badge>
      </div>

      <div className="mt-5 flex items-end justify-between">
        <div>
          <p className={`text-3xl font-semibold ${tone}`}>
            {typeIcon[sensor.sensorType]} {formatMetric(sensor.value)}
          </p>
          <p className="mt-2 text-sm text-tx-secondary">{sensor.unit}</p>
        </div>
      </div>

      <p className="mt-4 text-xs text-tx-muted">Son guncelleme: {formatRelativeTime(sensor.timestamp)}</p>
    </Link>
  )
}

