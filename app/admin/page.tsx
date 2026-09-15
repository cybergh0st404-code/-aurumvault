import LogisticsSite from '@/components/logistics-site'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Global Custody Command Center — AurumVault Operations',
  description: 'Real-time sovereign fleet surveillance, active sensor downlinks, and vault security management.',
}

export default function AdminPage() {
  return <LogisticsSite />
}
