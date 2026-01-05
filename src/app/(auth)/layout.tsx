'use client';

import React from 'react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    // KEIN <html>, KEIN <body>! Nur ein Container.
    <main className="min-h-screen w-full flex items-center justify-center bg-zinc-950 p-4">
      <div className="w-full max-w-md">
        {children}
      </div>
    </main>
  );
}