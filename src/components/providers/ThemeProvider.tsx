'use client'

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  useCallback,
  useMemo,
  ReactNode,
} from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/components/providers/AuthProvider'

/* ────────────────────────────────────────────────────────────────
   Types
   ──────────────────────────────────────────────────────────────── */

export type Theme = 'modern' | 'dark' | 'pastel' | 'custom'

interface CustomColors {
  [key: string]: string
}

interface ThemeContextType {
  theme: Theme
  changeTheme: (theme: Theme) => Promise<void>
  fullName: string
  updateName: (name: string) => Promise<void>
  customColors: CustomColors | null
  setCustomColors: (colors: CustomColors) => void // Kein Promise nötig, da nur State update
  isInitialLoading: boolean
}

/* ────────────────────────────────────────────────────────────────
   Context Creation
   ──────────────────────────────────────────────────────────────── */

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

/* ────────────────────────────────────────────────────────────────
   useTheme Hook
   ──────────────────────────────────────────────────────────────── */

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

/* ────────────────────────────────────────────────────────────────
   Theme Provider Component
   ──────────────────────────────────────────────────────────────── */

interface ThemeProviderProps {
  children: ReactNode
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const { user } = useAuth()
  const [theme, setTheme] = useState<Theme>('modern')
  const [fullName, setFullName] = useState('')
  const [customColors, setCustomColorsState] = useState<CustomColors | null>(null)
  const [mounted, setMounted] = useState(false)
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const isFetching = useRef(false)

  /* ──────────────────────────────────────────────────────────────
     Hydration Fix
     ────────────────────────────────────────────────────────────── */

  useEffect(() => {
    setMounted(true)
  }, [])

  /* ──────────────────────────────────────────────────────────────
     Load User Profile Data
     ────────────────────────────────────────────────────────────── */

  useEffect(() => {
    if (!user?.id || isFetching.current) return

    isFetching.current = true
    setIsInitialLoading(true)

    const fetchProfile = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('theme, full_name, custom_colors')
          .eq('id', user.id)
          .single()

        if (error) {
          console.error('Profile fetch error:', error.message)
          return
        }

        if (data) {
          if (data.theme) setTheme(data.theme as Theme)
          if (data.full_name) setFullName(data.full_name)
          if (data.custom_colors) setCustomColorsState(data.custom_colors as CustomColors)
        }
      } catch (error) {
        console.error('Profile fetch error:', error)
      } finally {
        isFetching.current = false
        setIsInitialLoading(false)
      }
    }

    fetchProfile()
  }, [user?.id])

  /* ──────────────────────────────────────────────────────────────
     Apply Theme to DOM (Live Preview Logic)
     ────────────────────────────────────────────────────────────── */

  useEffect(() => {
    if (!mounted) return

    const root = document.documentElement

    /* 1. Setze die Basis-Klassen */
    const themeClasses = [`theme-${theme}`]
    
    // Custom Themes basieren meist auf dem Dark-Mode-Gerüst für Glassmorphism,
    // es sei denn, man baut eine Logik für helle Custom-Themes. 
    // Hier aktivieren wir 'dark' für 'dark' und 'custom'.
    if (theme === 'dark' || theme === 'custom') {
      themeClasses.push('dark')
    } else {
      root.classList.remove('dark')
    }
    
    // Bereinige alte Klassen und setze neue
    root.classList.remove('theme-modern', 'theme-dark', 'theme-pastel', 'theme-custom')
    root.classList.add(...themeClasses)

    /* 2. Setze CSS Variablen für Custom Colors */
    if (theme === 'custom' && customColors && Object.keys(customColors).length > 0) {
      // Style-Attribut bereinigen, damit sich keine alten Werte stauen
      // (Optional, je nach Performance-Wunsch, aber sicherer)
      
      Object.entries(customColors).forEach(([key, value]) => {
        // Stellt sicher, dass Variablen immer mit -- beginnen
        const varName = key.startsWith('--') ? key : `--${key}`
        root.style.setProperty(varName, value)
      })
    } else {
      // Wenn nicht Custom, entfernen wir die Inline-Styles, 
      // damit die Tailwind-Klassen (z.B. aus globals.css) greifen
      root.removeAttribute('style')
    }
  }, [theme, customColors, mounted])

  /* ──────────────────────────────────────────────────────────────
     Theme Update Handler (Persistiert sofort)
     ────────────────────────────────────────────────────────────── */

  const changeTheme = useCallback(
    async (newTheme: Theme) => {
      setTheme(newTheme)

      if (!user?.id) return

      try {
        const { error } = await supabase
          .from('profiles')
          .update({ theme: newTheme })
          .eq('id', user.id)

        if (error) throw error
      } catch (error) {
        console.error('Theme update error:', error)
      }
    },
    [user?.id]
  )

  /* ──────────────────────────────────────────────────────────────
     Full Name Update Handler (Persistiert sofort)
     ────────────────────────────────────────────────────────────── */

  const updateName = useCallback(
    async (name: string) => {
      setFullName(name)

      if (!user?.id) return

      try {
        const { error } = await supabase
          .from('profiles')
          .update({ full_name: name })
          .eq('id', user.id)

        if (error) throw error
      } catch (error) {
        console.error('Name update error:', error)
      }
    },
    [user?.id]
  )

  /* ──────────────────────────────────────────────────────────────
     Custom Colors Handler (NUR LOCAL STATE UPDATE für Performance)
     ────────────────────────────────────────────────────────────── */

  const setCustomColors = useCallback((colors: CustomColors) => {
    // Wir speichern hier NICHT in die DB. Das macht der "Speichern"-Button 
    // in der SettingsPage, um Datenbank-Spamming beim Color-Picking zu verhindern.
    setCustomColorsState(colors)
  }, [])

  /* ──────────────────────────────────────────────────────────────
     Memoize Context Value
     ────────────────────────────────────────────────────────────── */

  const value = useMemo<ThemeContextType>(
    () => ({
      theme,
      changeTheme,
      fullName,
      updateName,
      customColors,
      setCustomColors,
      isInitialLoading,
    }),
    [theme, changeTheme, fullName, updateName, customColors, setCustomColors, isInitialLoading]
  )

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}