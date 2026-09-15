import LogisticsSite from '@/components/logistics-site'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Custodial Capabilities & Services — AurumVault',
  description: 'Specialized transport and vaulting services for precious metals, fine jewellery, and museum-grade assets.',
}

export default function ServicesPage() {
  return <LogisticsSite />
}
