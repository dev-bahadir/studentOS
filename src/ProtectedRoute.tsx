'use client'

import { useAuth } from '@/components/providers/AuthProvider'
import { useRouter, usePathname } from 'next/navigation' // usePathname ist wichtig!
import { useEffect } from 'react'

// Diese Routen dürfen von jedem gesehen werden (kein Redirect)
const PUBLIC_ROUTES = ['/login', '/register', '/auth/callback', '/reset-password'];

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading: isLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  // Prüfen, ob wir auf einer öffentlichen Seite sind
  const isPublicPage = PUBLIC_ROUTES.some(route => pathname?.startsWith(route));

  useEffect(() => {
    // Redirect NUR wenn:
    // 1. Nicht mehr geladen wird
    // 2. Kein User da ist
    // 3. Wir NICHT schon auf einer öffentlichen Seite sind (verhindert Loop)
    if (!isLoading && !user && !isPublicPage) {
      router.push('/login')
    }
  }, [user, isLoading, router, isPublicPage])

  // Ladezustand anzeigen (außer auf Public Pages, da wollen wir sofort rendern)
  if (isLoading && !isPublicPage) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0a0e12]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent" />
      </div>
    )
  }

  // Wenn User da ist ODER es eine öffentliche Seite ist -> Rendern erlauben
  if (user || isPublicPage) {
    return <>{children}</>
  }

  // Ansonsten nichts rendern (während des Redirects)
  return null
}