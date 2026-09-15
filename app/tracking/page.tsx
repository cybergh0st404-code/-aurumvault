import LogisticsSite from '@/components/logistics-site'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Live Telemetry Radar & Consignment Tracking — AurumVault',
  description: 'Live satellite tracking, IoT electronic tamper seal telemetry, and verified chain of custody.',
}

export default function TrackingPage() {
  return <LogisticsSite />
}
