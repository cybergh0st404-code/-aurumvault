import LogisticsSite from '@/components/logistics-site'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About Our Sovereign Heritage — AurumVault',
  description: 'Independent, private logistics house built for sovereigns, bullion banks, institutions, and family offices.',
}

export default function AboutPage() {
  return <LogisticsSite />
}
