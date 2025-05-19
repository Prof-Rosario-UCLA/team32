import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const isAuthenticated = request.cookies.has('token') // this shit right?

  // Check if the request is for a protected route
  if (request.nextUrl.pathname.startsWith('/(protected)')) {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL('/login', request.url)) // redirect to login if not authenticated
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/(protected)/:path*']
} 