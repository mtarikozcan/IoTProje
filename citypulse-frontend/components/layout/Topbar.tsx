'use client'

import { Badge } from '@/components/ui/Badge'
import { useCityPulseContext } from '@/components/providers/CityPulseProvider'

export function Topbar() {
  const { connected, sensors, alarms } = useCityPulseContext()

  return (
    <header className="flex flex-col gap-4 border-b border-border bg-surface px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <p className="text-xs uppercase tracking-[0.28em] text-tx-label">Canli izleme</p>
        <h2 className="mt-1 text-xl font-semibold text-tx-primary">Akilli Sehir Dashboard</h2>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-sm text-tx-secondary">
        <span>{sensors.length} aktif sensor</span>
        <span>{alarms.filter((alarm) => !alarm.resolved).length} aktif alarm</span>
        <Badge variant={connected ? 'normal' : 'offline'}>
          <span className={`h-2 w-2 rounded-full ${connected ? 'bg-green-400' : 'bg-gray-500'}`} />
          {connected ? 'WS bagli' : 'WS kapali'}
        </Badge>
      </div>
    </header>
  )
}

