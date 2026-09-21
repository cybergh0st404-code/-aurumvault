import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import { getUserBySessionToken } from '@/lib/db/user-repository'
import LogisticsSite from '@/components/logistics-site'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '404: This page could not be found.',
}

export default async function AdminPage() {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get('aurumvault_session')?.value

  if (!sessionToken) {
    notFound()
  }

  const user = await getUserBySessionToken(sessionToken)
  if (!user || user.role !== 'admin') {
    notFound()
  }

  return <LogisticsSite />
}
