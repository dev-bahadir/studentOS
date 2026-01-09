'use client'

import { ReactNode } from 'react'
import { Providers } from '@/components/providers'
import { Sidebar } from '@/components/Navigation' // Pfad ggf. anpassen
import { usePathname } from 'next/navigation'
import './globals.css'

export default function RootLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()

  // FIX: Korrekte Prüfung für Auth-Seiten (da '/auth' nicht Teil der URL ist)
  const isAuthPage = ['/login', '/register', '/reset-password'].includes(pathname || '')

  return (
    <html lang="de" suppressHydrationWarning className="h-full">
      <head>
        <meta name="theme-color" content="#09090b" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="bg-slate-950 text-white min-h-screen">
        <Providers>
          {/* Container ist 'flex': Sidebar und Main stehen automatisch nebeneinander.
          */}
          <div className="flex min-h-screen relative">
            
            {/* Sidebar rendern */}
            {!isAuthPage && <Sidebar />}
            
            {/* FIX: 'md:pl-64' ENTFERNT!
               Da der Parent 'flex' ist, braucht der Main-Container kein Padding mehr.
               Er nimmt sich einfach den restlichen Platz ('flex-1').
            */}
            <main className="flex-1 w-full transition-all duration-300">
              {children}
            </main>

          </div>
        </Providers>
      </body>
    </html>
  )
}