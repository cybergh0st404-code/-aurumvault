import LogisticsSite from '@/components/logistics-site'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Client Vault Authentication — AurumVault',
  description: 'Cryptographic access authentication for allocated Swiss vault depositors.',
}

export default function PortalLoginPage() {
  return <LogisticsSite />
}
