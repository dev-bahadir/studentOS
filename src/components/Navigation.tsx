'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
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
  Zap, // Geändert für Day Commander
  Table,
  Menu,
  X,
  Moon,
  Sun,
  GraduationCap // Neu für Learn Mode
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useTheme } from '@/components/providers/ThemeProvider';

const routes = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
  { label: 'Second Brain', icon: BrainCircuit, href: '/notes' },
  { label: 'Tasks', icon: CheckSquare, href: '/tasks' }, 
  { label: 'Study', icon: BookOpen, href: '/flashcards' },
  { label: 'Learn Mode', icon: GraduationCap, href: '/learn' }, // GraduationCap passt super zu "Learn"
  { label: 'Klausur Radar', icon: Target, href: '/radar' },
  { label: 'Day Commander', icon: Zap, href: '/planner' }, // Blitz-Icon für Fokus & Action
  { label: 'Zusammenfassungen', icon: FileText, href: '/summaries' },
  { label: 'AI Prompts', icon: Sparkles, href: '/prompts' },
  { label: 'Cheat Sheets', icon: Table, href: '/cheatsheets' },
  { label: 'Settings', icon: Settings, href: '/settings' },
];

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { theme, changeTheme } = useTheme();

  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      await supabase.auth.signOut();
      if (typeof window !== 'undefined') {
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = '/login';
      }
    } catch (error) {
      console.error("Logout Error:", error);
      window.location.href = '/login';
    }
  };

  const toggleDarkMode = () => {
    changeTheme(theme === 'dark' ? 'modern' : 'dark');
  };

  const closeSidebar = () => setIsOpen(false);

  return (
    <>
      {/* 1. MOBILER BURGER BUTTON */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="lg:hidden fixed top-4 left-4 z-[60] p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-zinc-900 dark:text-zinc-100 shadow-xl active:scale-95 transition-transform"
        >
          <Menu className="w-6 h-6" />
        </button>
      )}

      {/* 2. OVERLAY */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[45] lg:hidden transition-opacity animate-in fade-in"
          onClick={closeSidebar}
        />
      )}

      {/* 3. SIDEBAR CONTAINER */}
      <aside className={cn(
        "fixed left-0 top-0 z-50 h-[100dvh] w-72 flex flex-col transition-transform duration-300 ease-in-out",
        "bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-900 shadow-2xl lg:shadow-none",
        "lg:sticky lg:top-0 lg:translate-x-0", 
        isOpen ? "translate-x-0" : "-translate-x-full" 
      )}>
        
        {/* Logo & Close Button */}
        <div className="p-8 flex items-center justify-between">
          <h1 className="text-2xl font-black tracking-tighter text-zinc-900 dark:text-zinc-100 select-none">
            Electro<span className="text-cyan-500">Brain</span>
          </h1>
          <button onClick={closeSidebar} className="lg:hidden text-zinc-400 hover:text-zinc-900 dark:hover:white">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Navigations-Links */}
        <nav className="flex-1 space-y-1 px-4 overflow-y-auto pb-4 scrollbar-hide">
          {routes.map((route) => {
            const isActive = pathname === route.href;
            return (
              <Link
                key={route.href}
                href={route.href}
                onClick={closeSidebar}
                className={cn(
                  "group flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm transition-all",
                  isActive
                    ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 shadow-[inset_0_0_0_1px_rgba(6,182,212,0.2)]'
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900'
                )}
              >
                <route.icon className={cn(
                  "w-5 h-5 transition-transform group-hover:scale-110",
                  isActive ? "text-cyan-500" : "text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100"
                )} />
                {route.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer Settings & Theme Toggle */}
        <div className="p-4 m-4 mt-0 bg-zinc-50 dark:bg-zinc-900/50 rounded-3xl border border-zinc-100 dark:border-zinc-800 space-y-2">
          
          <button 
            onClick={toggleDarkMode}
            className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-white dark:hover:bg-zinc-800 transition-all group border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700 shadow-sm"
          >
            <div className="flex items-center gap-3 text-xs font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
              {theme === 'dark' ? (
                <Sun size={18} className="text-amber-500" />
              ) : (
                <Moon size={18} className="text-blue-500" />
              )}
              <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
            </div>
            <div className={cn(
              "w-10 h-5 rounded-full relative transition-colors p-1",
              theme === 'dark' ? "bg-cyan-500" : "bg-zinc-300 dark:bg-zinc-700"
            )}>
              <div className={cn(
                "w-3 h-3 bg-white rounded-full transition-all shadow-sm",
                theme === 'dark' ? "translate-x-5" : "translate-x-0"
              )} />
            </div>
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all font-bold text-sm group active:scale-95"
          >
            <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}