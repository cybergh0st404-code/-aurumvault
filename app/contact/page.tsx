import LogisticsSite from '@/components/logistics-site'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Diplomatic Concierge Desk — AurumVault',
  description: 'Direct encrypted communication with our central operations desks in Geneva, Zurich, and London.',
}

export default function ContactPage() {
  return <LogisticsSite />
}
