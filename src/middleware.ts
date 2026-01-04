import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone()

  // 1. Wenn irgendetwas zu /auth/signin will -> Zwangsumleitung auf dein neues /login
  if (url.pathname.includes('/auth/signin')) {
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // 2. Erlaube /reset-password explizit
  if (url.pathname === '/reset-password') {
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  // Überwacht alle Pfade
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}