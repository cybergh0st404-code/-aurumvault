import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getUserBySessionToken, deleteSession } from '@/lib/db/user-repository'

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  Pragma: 'no-cache',
  Expires: '0',
}

export async function GET() {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('aurumvault_session')?.value

    if (!sessionToken) {
      return NextResponse.json({ user: null }, { headers: NO_CACHE_HEADERS })
    }

    const user = await getUserBySessionToken(sessionToken)
    if (!user) {
      const response = NextResponse.json({ user: null }, { headers: NO_CACHE_HEADERS })
      response.cookies.delete('aurumvault_session')
      return response
    }

    return NextResponse.json({ user }, { headers: NO_CACHE_HEADERS })
  } catch (error) {
    console.error('Session validation error:', error)
    return NextResponse.json({ user: null }, { headers: NO_CACHE_HEADERS })
  }
}
