'use client'

// 1. Dieser Import fehlt dir für 'ReactNode':
import { ReactNode } from 'react'

// 2. Diese Importe fehlen dir für die Provider:
// (Stelle sicher, dass AuthProvider.tsx und ThemeProvider.tsx im selben Ordner liegen)
import { AuthProvider } from './AuthProvider'
import { ThemeProvider } from './ThemeProvider'

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <ThemeProvider>
        {children}
      </ThemeProvider>
    </AuthProvider>
  )
}