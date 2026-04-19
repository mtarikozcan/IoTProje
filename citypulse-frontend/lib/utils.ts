import { format, formatDistanceToNowStrict } from 'date-fns'

export function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(' ')
}

export function formatClock(value: string) {
  return format(new Date(value), 'HH:mm:ss')
}

export function formatDateTime(value: string) {
  return format(new Date(value), 'dd.MM.yyyy HH:mm:ss')
}

export function formatRelativeTime(value: string) {
  return formatDistanceToNowStrict(new Date(value), { addSuffix: true })
}

export function formatMetric(value: number) {
  return new Intl.NumberFormat('tr-TR', {
    maximumFractionDigits: 2,
  }).format(value)
}

