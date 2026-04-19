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
    <div className="panel p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-tx-label">{label}</p>
      <p className={cn('mt-3 text-3xl font-semibold', toneClasses[tone])}>{value}</p>
      <p className="mt-2 text-sm text-tx-secondary">{helper || 'Canli veri akisi'}</p>
    </div>
  )
}

