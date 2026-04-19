import { Sidebar } from '@/components/layout/Sidebar'
import { Topbar } from '@/components/layout/Topbar'
import { CityPulseProvider } from '@/components/providers/CityPulseProvider'

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <CityPulseProvider>
      <div className="min-h-screen bg-surface-base lg:flex">
        <Sidebar />
        <div className="flex min-h-screen flex-1 flex-col">
          <Topbar />
          <main className="flex-1 px-4 py-4 lg:px-6 lg:py-6">{children}</main>
        </div>
      </div>
    </CityPulseProvider>
  )
}

