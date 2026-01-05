'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  BrainCircuit,
  CheckSquare,
  BookOpen,
  Settings,
  LogOut,
  FileText, // Für Zusammenfassungen
  Sparkles, // Für Prompts
  Target, // Für Radar
  Hourglass,  // Für Fokus
  Table, // Für Cheat sheets
} from 'lucide-react'
import { createClient } from '@/lib/supabase'

const routes = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
  { label: 'Second Brain', icon: BrainCircuit, href: '/notes' }, // Prüfe, ob dein Pfad /notes oder /dashboard/notes ist
  { label: 'Tasks', icon: CheckSquare, href: '/tasks' }, // Oder /tasks
  { label: 'Study', icon: BookOpen, href: '/flashcards' },         // Oder /dashboard/study - passe das an deine Ordnerstruktur an!
  
  // --- NEUE FEATURES ---
  { label: 'Zusammenfassungen', icon: FileText, href: '/summaries' },
  { label: 'AI Prompts', icon: Sparkles, href: '/prompts' },
  { label: 'Klausur Radar', icon: Target, href: '/radar' },
  { label: 'Fokus Zone', icon: Hourglass, href: '/focus' },
  { label: 'Cheat Sheets', icon: Table, href: '/cheatsheets' },
  // --------------------

  { label: 'Settings', icon: Settings, href: '/settings' },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col h-[100dvh] fixed left-0 top-0 z-50 overflow-y-auto pb-20">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-white">
          Electro<span className="text-cyan-500">Brain</span>
        </h1>
      </div>

      <nav className="flex-1 space-y-2 px-3 pb-4">
        {routes.map((route) => (
          <Link
            key={route.href}
            href={route.href}
            className={cn(
              'flex items-center gap-3 px-4 py-2 rounded-lg transition-colors',
              pathname === route.href
                ? 'bg-gray-800 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            )}
          >
            <route.icon className="w-5 h-5" />
            {route.label}
          </Link>
        ))}
      </nav>

      <div className="p-3 border-t border-gray-800 bg-gray-900">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>
    </div>
  )
}