import { format } from 'date-fns'
import { tr } from 'date-fns/locale'

export function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(' ')
}

export function formatClock(value: string) {
  return format(new Date(value), 'HH:mm:ss', { locale: tr })
}

export function formatDateTime(value: string) {
  return format(new Date(value), 'dd.MM.yyyy HH:mm', { locale: tr })
}

export function formatDateTimeDetailed(value: string) {
  return format(new Date(value), 'dd.MM.yyyy HH:mm:ss', { locale: tr })
}

export function formatCompactDateTime(value: string) {
  return format(new Date(value), 'dd MMM, HH:mm', { locale: tr })
}

export function formatRelativeTime(value: string, now = Date.now()) {
  const target = new Date(value).getTime()
  const diffSeconds = Math.round((target - now) / 1000)
  const absoluteSeconds = Math.abs(diffSeconds)

  if (absoluteSeconds < 5) {
    return 'az önce'
  }

  const relativeFormatter = new Intl.RelativeTimeFormat('tr', {
    numeric: 'auto',
  })

  if (absoluteSeconds < 60) {
    return relativeFormatter.format(diffSeconds, 'second')
  }

  const diffMinutes = Math.round(diffSeconds / 60)
  if (Math.abs(diffMinutes) < 60) {
    return relativeFormatter.format(diffMinutes, 'minute')
  }

  const diffHours = Math.round(diffMinutes / 60)
  if (Math.abs(diffHours) < 24) {
    return relativeFormatter.format(diffHours, 'hour')
  }

  const diffDays = Math.round(diffHours / 24)
  return relativeFormatter.format(diffDays, 'day')
}

export function formatMetric(value: number) {
  return new Intl.NumberFormat('tr-TR', {
    maximumFractionDigits: 2,
  }).format(value)
}

export function formatMetricWithUnit(value: number, unit: string) {
  return `${formatMetric(value)} ${unit}`
}

export function getBadgeLabel(
  variant: 'normal' | 'warning' | 'critical' | 'offline' | 'resolved'
) {
  switch (variant) {
    case 'normal':
      return 'Normal'
    case 'warning':
      return 'Uyarı'
    case 'critical':
      return 'Kritik'
    case 'offline':
      return 'Çevrim dışı'
    case 'resolved':
      return 'Çözüldü'
    default:
      return variant
  }
}

export function getSensorTypeLabel(value: 'energy' | 'traffic' | string) {
  return value === 'energy' ? 'Enerji' : value === 'traffic' ? 'Trafik' : value
}

export function getSystemStatusLabel(value: 'healthy' | 'warning' | 'critical' | undefined) {
  if (value === 'critical') {
    return 'Kritik'
  }

  if (value === 'warning') {
    return 'Uyarı'
  }

  return 'Sağlıklı'
}
