import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { deleteSession } from '@/lib/db/user-repository'

export async function POST() {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('aurumvault_session')?.value

    if (sessionToken) {
      await deleteSession(sessionToken)
    }

    const response = NextResponse.json({ success: true })
    response.cookies.delete('aurumvault_session')
    return response
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json({ success: true })
  }
}
