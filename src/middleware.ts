import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone()

// Ersetze den entsprechenden Teil in deiner middleware.ts
if (url.pathname.includes('/auth/signin')) {
  return NextResponse.redirect(new URL('/login', request.url));
}

// Erlaube /reset-password immer, ohne Check!
if (url.pathname === '/reset-password') {
  return NextResponse.next();
}
}

export const config = {
  // Überwacht alle Pfade
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}