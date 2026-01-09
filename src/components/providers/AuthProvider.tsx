'use client'

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from 'react'
import { User, Session } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

/* ────────────────────────────────────────────────────────────────
   Auth Context Type
   ──────────────────────────────────────────────────────────────── */

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signOut: () => Promise<void>
}

/* ────────────────────────────────────────────────────────────────
   Context Creation
   ──────────────────────────────────────────────────────────────── */

const AuthContext = createContext<AuthContextType | undefined>(undefined)

/* ────────────────────────────────────────────────────────────────
   Auth Provider Component
   ──────────────────────────────────────────────────────────────── */

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  /* Initialize Auth & Listen for Changes */
  useEffect(() => {
    let isMounted = true

    const initializeAuth = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession()
        
        if (isMounted) {
          setSession(initialSession)
          setUser(initialSession?.user ?? null)
          setLoading(false)
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    initializeAuth()

    /* Subscribe to Auth State Changes */
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        if (!isMounted) return

        setSession(currentSession)
        setUser(currentSession?.user ?? null)

        if (event === 'SIGNED_IN') {
          router.refresh()
        }

        if (event === 'SIGNED_OUT') {
          setUser(null)
          setSession(null)
          router.push('/login')
          router.refresh()
        }

        setLoading(false)
      }
    )

    return () => {
      isMounted = false
      subscription?.unsubscribe()
    }
  }, [router])

  /* Sign Out Handler */
  const signOut = useCallback(async () => {
    setLoading(true)
    try {
      await supabase.auth.signOut()
      setUser(null)
      setSession(null)
      router.push('')
    } catch (error) {
      console.error('Sign out error:', error)
      setLoading(false)
    }
  }, [router])

  const value: AuthContextType = {
    user,
    session,
    loading,
    signOut,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

/* ────────────────────────────────────────────────────────────────
   useAuth Hook
   ──────────────────────────────────────────────────────────────── */

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  
  return context
}
