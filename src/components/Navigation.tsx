'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from './providers/AuthProvider';

export default function Navigation() {
  const { user } = useAuth();
  const pathname = usePathname();

  // Wenn nicht eingeloggt, zeige keine Navigation
  if (!user) return null;

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: '📊' },
    { name: 'Tasks', href: '/tasks', icon: '🚀' },
    { name: 'Notes', href: '/notes', icon: '🧠' },
    { name: 'Lernen', href: '/flashcards', icon: '🎓' },
    { name: 'Settings', href: '/settings', icon: '⚙️' },
  ];

 const isActive = (path: string) => {
    if (!pathname) return false;
    return pathname === path || pathname.startsWith(path + '/');
  };

  return (
    <>
      {/* --- DESKTOP SIDEBAR (Links) --- */}
      <nav className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 h-screen fixed left-0 top-0 z-50">
        <div className="p-6 border-b border-gray-100">
          <h1 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
            ElectroBrain
          </h1>
          <p className="text-xs text-gray-400 mt-1">Operating System v1.0</p>
        </div>

        <div className="flex-1 p-4 space-y-2">
          {navItems.map((item) => (
            <Link 
              key={item.href} 
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                isActive(item.href) 
                  ? 'bg-blue-50 text-blue-700 font-bold shadow-sm' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span>{item.name}</span>
            </Link>
          ))}
        </div>

        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
              {user.email?.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-gray-700 truncate">{user.email}</p>
              <p className="text-xs text-green-500">Online</p>
            </div>
          </div>
        </div>
      </nav>

      {/* --- MOBILE BOTTOM BAR (Unten) --- */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 z-50 px-6 py-3 flex justify-between items-center shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        {navItems.map((item) => (
          <Link 
            key={item.href} 
            href={item.href}
            className={`flex flex-col items-center gap-1 transition ${
              isActive(item.href) ? 'text-blue-600 scale-110' : 'text-gray-400'
            }`}
          >
            <span className="text-2xl">{item.icon}</span>
            <span className="text-[10px] font-medium">{item.name}</span>
          </Link>
        ))}
      </nav>
    </>
  );
}