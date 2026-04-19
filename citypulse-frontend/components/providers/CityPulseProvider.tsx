'use client'

import { createContext, useContext } from 'react'

import { useCityPulse } from '@/hooks/useCityPulse'

type CityPulseContextValue = ReturnType<typeof useCityPulse>

const CityPulseContext = createContext<CityPulseContextValue | null>(null)

export function CityPulseProvider({ children }: { children: React.ReactNode }) {
  const value = useCityPulse()

  return <CityPulseContext.Provider value={value}>{children}</CityPulseContext.Provider>
}

export function useCityPulseContext() {
  const context = useContext(CityPulseContext)

  if (!context) {
    throw new Error('useCityPulseContext must be used within CityPulseProvider')
  }

  return context
}

