'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Navigation';
import { useAuth } from '@/components/providers/AuthProvider';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const [mounted, setMounted] = useState(false);

  // Verhindert, dass der Server und Browser sich streiten
  useEffect(() => {
    setMounted(true);
  }, []);

  // Wenn noch nicht gemountet, zeigen wir ein statisches "Lade..." ohne Logik
  if (!mounted) {
    return <div className="h-screen bg-zinc-950 flex items-center justify-center text-zinc-500">Initializing...</div>;
  }

  return (
    <div className="flex h-[100dvh] w-full bg-zinc-950 overflow-hidden">
      <aside className="hidden lg:flex w-64 fixed inset-y-0 z-50 border-r border-zinc-800 bg-zinc-900">
        <Sidebar />
      </aside>

      <div className="flex-1 flex flex-col h-full lg:pl-64">
        <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-32">
          <div className="lg:hidden mb-6">
             <Sidebar /> 
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}