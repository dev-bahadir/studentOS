'use client'

import { ReactNode } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { redirect } from 'next/navigation'

export default function AuthLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()

  if (!loading && user) {
    redirect('/dashboard')
  }

  return <>{children}</>
}