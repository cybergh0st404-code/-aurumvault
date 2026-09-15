import LogisticsSite from '@/components/logistics-site'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Specie Logistics Estimator & Tariff Calculator — AurumVault',
  description: 'Instant transit appraisal and security protocol valuation for precious metals, fine jewellery, and high-value specie.',
}

export default function QuotePage() {
  return <LogisticsSite />
}
