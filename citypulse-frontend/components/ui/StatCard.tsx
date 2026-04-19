import { cn } from '@/lib/utils'

interface StatCardProps {
  label: string
  value: string | number
  helper?: string
  tone?: 'default' | 'energy' | 'traffic' | 'success' | 'danger'
}

const toneClasses = {
  default: 'text-tx-primary',
  energy: 'text-amber-400',
  traffic: 'text-blue-400',
  success: 'text-green-300',
  danger: 'text-red-300',
}

export function StatCard({ label, value, helper, tone = 'default' }: StatCardProps) {
  return (
    <div className="panel flex h-full min-h-[136px] flex-col justify-between p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-tx-label">{label}</p>
      <div className="mt-3">
        <p className={cn('text-3xl font-semibold tracking-tight', toneClasses[tone])}>{value}</p>
        <p className="mt-2 text-sm leading-5 text-tx-secondary">{helper || 'Canlı veri akışı'}</p>
      </div>
    </div>
  )
}
