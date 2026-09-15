import LogisticsSite from '@/components/logistics-site'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Six-Stage Custody Process — AurumVault',
  description: 'A disciplined, six-stage custodial pipeline guaranteeing secrecy and unbroken chain of custody.',
}

export default function ProcessPage() {
  return <LogisticsSite />
}
