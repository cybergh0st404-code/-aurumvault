import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getUserBySessionToken } from '@/lib/db/user-repository'
import { listAuditLogs } from '@/lib/db/audit-repository'

export async function GET(request: Request) {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get('aurumvault_session')?.value
  if (!sessionToken) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }

  const user = await getUserBySessionToken(sessionToken)
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden. Admin clearance required.' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const limitParam = searchParams.get('limit')
  const limit = limitParam ? Math.min(Number(limitParam) || 50, 100) : 50

  const logs = await listAuditLogs(limit)
  return NextResponse.json({ success: true, logs })
}
