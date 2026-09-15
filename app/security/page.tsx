import LogisticsSite from '@/components/logistics-site'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Security & Custody Protocol — AurumVault',
  description: 'Military-grade physical defense, biometric nitrogen casks, and Lloyd’s of London specie underwriting.',
}

export default function SecurityPage() {
  return <LogisticsSite />
}
