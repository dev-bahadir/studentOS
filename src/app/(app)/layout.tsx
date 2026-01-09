'use client'

import { ReactNode } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { redirect, usePathname } from 'next/navigation' // WICHTIG: usePathname hinzufügen
import { motion } from 'framer-motion'

interface AppLayoutProps {
  children: ReactNode
}

function AppLayoutContent({ children }: AppLayoutProps) {
  const { user, loading } = useAuth()
  const pathname = usePathname() // Aktuellen Pfad abrufen

  // Liste der Seiten, die OHNE Login erlaubt sind
  const isAuthPage = 
    pathname === '/login' || 
    pathname === '/register' || 
    pathname === '/reset-password' ||
    pathname?.startsWith('/auth'); // Falls alte Links noch existieren

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1 }}
          className="h-12 w-12 border-4 border-cyan-500 border-t-transparent rounded-full mb-6"
        />
        <h2 className="text-xl font-black tracking-widest uppercase animate-pulse">
          ELECTRO BRAIN
        </h2>
      </div>
    )
  }

  // FIX: Redirect NUR dann, wenn User fehlt UND wir NICHT schon auf einer Auth-Page sind
  if (!user && !isAuthPage) {
    redirect('/login')
  }

  return (
    <div className="flex h-screen w-screen bg-slate-950 overflow-hidden">
      <main className="flex-1 flex flex-col overflow-hidden w-full bg-slate-950">
        {children}
      </main>
    </div>
  )
}

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <AppLayoutContent>{children}</AppLayoutContent>
  )
}