import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Wir initialisieren den Supabase-Client manuell für die Middleware
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  // Session abrufen
  const { data: { session } } = await supabase.auth.getSession()

  const url = request.nextUrl.clone()
  
  // Definition der öffentlichen Routen
  const isPublicRoute = ['/login', '/register', '/', '/reset-password'].includes(url.pathname)

  // 1. SCHUTZ: Wenn nicht eingeloggt und keine öffentliche Route -> zu /login
  if (!session && !isPublicRoute) {
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // 2. OPTIONAL: Wenn eingeloggt und auf Login-Seite -> zum Dashboard
  if (session && (url.pathname === '/login' || url.pathname === '/register')) {
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  // Schützt alles außer statische Dateien und Bilder
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}