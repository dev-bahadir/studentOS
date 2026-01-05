'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Navigation';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  // Verhindert Hydration-Fehler zwischen Server und Client
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="h-screen bg-zinc-950 flex items-center justify-center text-zinc-500">
        Initializing Interface...
      </div>
    );
  }

  return (
    <div className="flex h-[100dvh] w-full bg-zinc-950 overflow-hidden">
      {/* Die Sidebar ist 'fixed'. 
        Sie steuert ihr eigenes Erscheinen (Mobil via Burger, Desktop via lg:translate-x-0).
      */}
      <Sidebar />

      {/* HAUPTINHALT:
        - lg:pl-72 schafft exakt Platz für die 72er Breite (w-72) der Sidebar.
        - flex-1 füllt den restlichen Bildschirm aus.
      */}
      <div className="flex-1 flex flex-col h-full lg:pl-72">
        <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-20 lg:pb-8">
          {/* Zusätzlicher Abstand oben auf Mobilgeräten, 
            damit der Burger-Button nichts verdeckt 
          */}
          <div className="h-16 lg:hidden" /> 
          
          <div className="max-w-7xl mx-auto w-full animate-in fade-in duration-700">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}