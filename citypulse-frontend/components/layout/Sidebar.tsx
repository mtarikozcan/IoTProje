'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { cn } from '@/lib/utils'

const links = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/sensors', label: 'Sensorler' },
  { href: '/alarms', label: 'Alarmlar' },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden w-64 border-r border-border bg-surface px-4 py-6 lg:block">
      <div className="mb-8 px-3">
        <p className="text-xs uppercase tracking-[0.32em] text-tx-label">CityPulse</p>
        <h1 className="mt-2 text-2xl font-semibold text-tx-primary">Sehir Operasyon Merkezi</h1>
      </div>

      <nav className="space-y-2">
        {links.map((link) => {
          const active = pathname === link.href || pathname.startsWith(`${link.href}/`)

          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'block rounded-lg border px-3 py-2 text-sm transition-colors',
                active
                  ? 'border-blue-800 bg-blue-950/40 text-blue-200'
                  : 'border-transparent bg-surface-elevated text-tx-secondary hover:border-border hover:text-tx-primary'
              )}
            >
              {link.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}

