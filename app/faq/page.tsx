import LogisticsSite from '@/components/logistics-site'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Custody Intelligence & FAQ — AurumVault',
  description: 'Clear, authoritative answers regarding our custody protocols, insurance underwriting, and tracking technologies.',
}

export default function FAQPage() {
  return <LogisticsSite />
}
