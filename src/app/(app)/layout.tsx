'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import Image from 'next/image';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const [mounted, setMounted] = useState(false);

  // Verhindert Hydration-Fehler und stellt sicher, dass wir im Browser sind
  useEffect(() => {
    setMounted(true);
  }, []);

  // 1. LOADING SKELETON (Qwen-Optimierung + Zinc Design)
  // Zeigt ein schickes Branding, während die Session geladen wird
  if (!mounted || loading) {
    return (
      <div className="bg-zinc-50 dark:bg-zinc-950 flex h-[100dvh] w-full flex-col items-center justify-center p-6 transition-colors duration-500">
        <div className="flex flex-col items-center animate-pulse">
          <div className="relative flex items-center justify-center h-24 w-24 bg-zinc-200 dark:bg-zinc-800 rounded-[2.5rem] mb-6 shadow-sm border border-zinc-300/20">
            <Image 
              src="/icons/icon-512x512.png" 
              alt="ElectroBrain" 
              width={48} 
              height={48} 
              className="opacity-40 dark:invert"
            />
          </div>
          <div className="h-1.5 w-32 bg-zinc-200 dark:bg-zinc-800 rounded-full mb-3" />
          <p className="text-zinc-400 text-[10px] font-black uppercase tracking-[0.3em]">
            System Booting
          </p>
        </div>
      </div>
    );
  }


  // 3. DAS ECHTE APP-LAYOUT
  return (
    <div className="flex h-[100dvh] w-full bg-canvas overflow-hidden transition-colors duration-500">
      
      {/* SIDEBAR CONTAINER (Desktop & iPad Landscape) */}
      <aside className="hidden lg:flex w-64 flex-col fixed inset-y-0 z-50 border-r border-zinc-200 dark:border-zinc-800 bg-panel shadow-sm">
        <Sidebar />
      </aside>

      {/* HAUPTINHALT */}
      <div className="flex-1 flex flex-col h-full lg:pl-64 transition-all duration-300 ease-in-out">
        
        {/* SCROLL AREA */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-8 pb-32 scroll-smooth">
          
          {/* Mobile Sidebar / Header 
              Rendert die Sidebar-Komponente nur auf Mobile als Header (Hamburger-Menü Support) */}
          <div className="lg:hidden mb-6">
             <Sidebar /> 
          </div>

          {/* Der eigentliche Content der jeweiligen Seite */}
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-700">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}