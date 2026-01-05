'use client';

import Link from 'next/link';
import { useAuth } from '@/components/providers/AuthProvider';
import { usePathname } from 'next/navigation';

export default function Header() {
  const { user, signOut } = useAuth();
  const pathname = usePathname();

  // Wenn kein User da ist, zeigen wir nichts an
  if (!user) return null;

  // Hilfsfunktion für aktiven Link (mit Fix für null)
  const isActive = (path: string) => (pathname || '').startsWith(path) ? "bg-blue-700" : "hover:bg-blue-700/50";

  return (
    <header className="bg-blue-600 text-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Logo */}
          <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
            <span>🧠</span>
            <Link href="/dashboard">BrainApp</Link>
          </div>

          {/* DESKTOP Navigation (sichtbar ab md) */}
          <nav className="hidden md:flex gap-2">
            <Link href="/dashboard" className={`px-3 py-2 rounded-md text-sm font-medium transition ${isActive('/dashboard')}`}>
              Dashboard
            </Link>
            {/* 👇 HIER IST DER NEUE LINK */}
            <Link href="/tasks" className={`px-3 py-2 rounded-md text-sm font-medium transition ${isActive('/tasks')}`}>
              Tasks
            </Link>
            <Link href="/flashcards" className={`px-3 py-2 rounded-md text-sm font-medium transition ${isActive('/flashcards')}`}>
              Flashcards
            </Link>
            <Link href="/notes" className={`px-3 py-2 rounded-md text-sm font-medium transition ${isActive('/notes')}`}>
              Notizen
            </Link>
          </nav>

          {/* Logout Button */}
          <button 
            onClick={signOut}
            className="text-sm bg-blue-800 hover:bg-blue-900 px-4 py-2 rounded transition flex items-center gap-2"
          >
            Logout <span>🚪</span>
          </button>

        </div>
      </div>
      
      {/* MOBILE Navigation (sichtbar bis md) */}
      <div className="md:hidden flex justify-around border-t border-blue-500 py-2 text-xs bg-blue-600">
        <Link href="/dashboard">🏠 Dash</Link>
        {/* 👇 HIER AUCH EINFÜGEN! */}
        <Link href="/tasks">✅ Tasks</Link> 
        <Link href="/flashcards">🗂️ Karten</Link>
        <Link href="/notes">📝 Notizen</Link>
      </div>
    </header>
  );
}
