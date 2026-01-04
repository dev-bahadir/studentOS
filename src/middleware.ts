import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone()

  // Falls irgendetwas versucht, dich auf /auth/signin zu schicken -> Umleiten auf dein neues /login
  if (url.pathname === '/auth/signin' || url.pathname === '/auth/login') {
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/auth/:path*', '/((?!_next/static|_next/image|favicon.ico).*)'],
}