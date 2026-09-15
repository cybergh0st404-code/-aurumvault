import LogisticsSite from '@/components/logistics-site'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Private Client Depository & Vault Portal — AurumVault',
  description: 'Confidential client access to allocated gold bullion holdings, active air-specie consignments, and chain-of-custody certificates.',
}

export default function PortalPage() {
  return <LogisticsSite />
}
