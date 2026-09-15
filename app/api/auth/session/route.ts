import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getUserBySessionToken, deleteSession } from '@/lib/db/user-repository'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('aurumvault_session')?.value

    if (!sessionToken) {
      return NextResponse.json({ user: null })
    }

    const user = await getUserBySessionToken(sessionToken)
    if (!user) {
      const response = NextResponse.json({ user: null })
      response.cookies.delete('aurumvault_session')
      return response
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Session validation error:', error)
    return NextResponse.json({ user: null })
  }
}
