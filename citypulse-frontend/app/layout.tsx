import type { Metadata } from 'next'
import { IBM_Plex_Mono, IBM_Plex_Sans } from 'next/font/google'

import './globals.css'

const sans = IBM_Plex_Sans({
  variable: '--font-sans',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
})

const mono = IBM_Plex_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
  weight: ['400', '500'],
})

export const metadata: Metadata = {
  title: 'CityPulse',
  description: 'Akilli sehir anomali tespit sistemi',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="tr" className={`${sans.variable} ${mono.variable} h-full`}>
      <body className="min-h-full bg-surface-base text-tx-primary">{children}</body>
    </html>
  )
}
