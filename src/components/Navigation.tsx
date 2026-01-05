'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  BrainCircuit,
  CheckSquare,
  BookOpen,
  Settings,
  LogOut,
  FileText,
  Sparkles,
  Target,
  Hourglass,
  Table,
  Menu,
  X
} from 'lucide-react'
import { createClient } from '@/lib/supabase'

const routes = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
  { label: 'Second Brain', icon: BrainCircuit, href: '/notes' },
  { label: 'Tasks', icon: CheckSquare, href: '/tasks' }, 
  { label: 'Study', icon: BookOpen, href: '/flashcards' },
  
  // --- NEUE FEATURES ---
  { label: 'Zusammenfassungen', icon: FileText, href: '/summaries' },
  { label: 'AI Prompts', icon: Sparkles, href: '/prompts' },
  { label: 'Klausur Radar', icon: Target, href: '/radar' },
  { label: 'Fokus Zone', icon: Hourglass, href: '/focus' },
  { label: 'Cheat Sheets', icon: Table, href: '/cheatsheets' },
  
  { label: 'Settings', icon: Settings, href: '/settings' },
]

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  // Schließt die Sidebar auf Mobile, wenn ein Link geklickt wird
  const closeSidebar = () => setIsOpen(false)

  return (
    <>
      {/* 1. MOBILER BURGER BUTTON */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="lg:hidden fixed top-4 left-4 z-[60] p-2 bg-gray-900 border border-gray-700 rounded-md text-white shadow-xl"
        >
          <Menu className="w-6 h-6" />
        </button>
      )}

      {/* 2. OVERLAY */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[45] lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* 3. SIDEBAR CONTAINER */}
      <aside className={cn(
        "fixed left-0 top-0 z-50 h-[100dvh] w-64 bg-gray-900 border-r border-gray-800 flex flex-col transition-transform duration-300 ease-in-out overflow-y-auto",
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        
        {/* Header Bereich */}
        <div className="p-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Electro<span className="text-cyan-500">Brain</span>
          </h1>
          <button onClick={closeSidebar} className="lg:hidden text-gray-600 dark:text-gray-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 pb-20">
          {routes.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              onClick={closeSidebar}
              className={cn(
                'flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all text-sm font-medium',
                pathname === route.href
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                  : 'text-gray-600 dark:text-gray-400 hover:text-white hover:bg-gray-800/50'
              )}
            >
              <route.icon className={cn(
                "w-5 h-5",
                pathname === route.href ? "text-cyan-400" : "text-gray-600 dark:text-gray-400"
              )} />
              {route.label}
            </Link>
          ))}
        </nav>

        {/* Logout Bereich */}
        <div className="p-3 border-t border-gray-800 bg-gray-900 sticky bottom-0">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-gray-600 dark:text-gray-400 hover:text-red-400 hover:bg-red-400/10 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>
    </>
  )
}
