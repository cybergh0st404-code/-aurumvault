import { NextResponse, type NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const sessionToken = request.cookies.get('aurumvault_session')?.value

  // 1. Strict protection for Administrative API endpoints
  if (pathname.startsWith('/api/admin')) {
    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Unauthorized. Administrative session authentication required.' },
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }
  }

  // 2. Strict protection for Administrative Operations pages
  // Masks /admin and /ops-custody-command-782 from unauthenticated reconnaissance
  if (pathname.startsWith('/admin') || pathname.startsWith('/ops-custody-command-782')) {
    if (!sessionToken) {
      // Rewrite to 404 page so attackers cannot confirm the endpoint exists
      const notFoundUrl = new URL('/not-found', request.url)
      return NextResponse.rewrite(notFoundUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/ops-custody-command-782/:path*',
    '/api/admin/:path*',
  ],
}
