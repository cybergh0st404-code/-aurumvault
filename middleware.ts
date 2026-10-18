import { NextResponse, type NextRequest } from 'next/server'

/**
 * Validates that state-changing mutation requests originate strictly from the authorized host.
 * Provides defense-in-depth CSRF and cross-origin hijacking prevention.
 */
function isOriginAuthorized(request: NextRequest): boolean {
  const origin = request.headers.get('origin')
  const host = request.headers.get('host') || request.nextUrl.host

  if (origin) {
    try {
      const originHost = new URL(origin).host
      return originHost === host
    } catch {
      return false
    }
  }

  const referer = request.headers.get('referer')
  if (referer) {
    try {
      const refererHost = new URL(referer).host
      return refererHost === host
    } catch {
      return false
    }
  }

  // Same-origin serverless or direct local calls without Origin/Referer permitted in dev
  if (process.env.NODE_ENV === 'production') {
    return false
  }

  return true
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const method = request.method.toUpperCase()
  const sessionToken = request.cookies.get('aurumvault_session')?.value

  // 1. Defense-in-depth Origin Validation for all state-changing API operations
  if (pathname.startsWith('/api') && ['POST', 'PATCH', 'PUT', 'DELETE'].includes(method)) {
    if (!isOriginAuthorized(request)) {
      return NextResponse.json(
        { error: 'Cross-origin request blocked under sovereign security protocol.' },
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      )
    }
  }

  // 2. Strict protection for Administrative API endpoints
  if (pathname.startsWith('/api/admin')) {
    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Unauthorized. Administrative session authentication required.' },
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }
  }

  // 3. Strict protection for Administrative Operations pages
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
    '/api/:path*',
  ],
}
