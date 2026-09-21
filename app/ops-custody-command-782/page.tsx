import { AdminCommandCenter } from '@/components/admin-command-center'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sovereign Operations Gateway — Level-V Specie Control',
  description: 'Confidential terminal for Swiss Federal Operations Command.',
}

export default function SecretAdminPage() {
  return <AdminCommandCenter />
}
