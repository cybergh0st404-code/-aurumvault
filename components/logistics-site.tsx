'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { TrackingDashboard } from './tracking/tracking-dashboard'
import { AdminCommandCenter } from './admin-command-center'
import { ClientDashboard } from './client/client-dashboard'
import { ClientLogin } from './client/client-login'
import { useAuth } from '@/lib/auth-context'

export default function LogisticsSite() {
  const pathname = usePathname()
  const { user } = useAuth()
  const slug = pathname.split('/').filter(Boolean).pop() || ''
  const ADMIN_SECRET_PATH = '/ops-custody-command-782'

  // 1. Dedicated Secret Admin Entry Route (Level-V Security Gateway)
  if (pathname === ADMIN_SECRET_PATH || pathname.startsWith(ADMIN_SECRET_PATH)) {
    return <AdminCommandCenter />
  }

  // 2. Protected /admin Route -> Genuine 404 Masking for unauthenticated/client visitors
  if (slug === 'admin' || pathname.startsWith('/admin')) {
    if (user?.role === 'admin') {
      return <AdminCommandCenter />
    }
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white text-black dark:bg-[#000] dark:text-[#fff] px-4 font-sans select-none">
        <div className="flex items-center space-x-5">
          <h1 className="text-2xl font-semibold border-r border-gray-300 dark:border-gray-700 pr-5 py-2 tracking-tight">
            404
          </h1>
          <p className="text-sm text-gray-700 dark:text-gray-300 font-normal">
            This page could not be found.
          </p>
        </div>
      </div>
    )
  }

  // 3. Dedicated Tracking Tool (if accessed via /tracking)
  if (slug === 'tracking' || pathname.startsWith('/tracking')) {
    return (
      <div className="min-h-screen flex flex-col bg-[#0a0c10] text-[#f4f4f6] font-sans">
        <div className="border-b border-[#242833] bg-[#0e1117] px-4 sm:px-6 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-xs font-mono text-gray-400 hover:text-white transition">
            ← Return to Depository Login
          </Link>
          <span className="text-xs font-mono text-[#dfba6c] font-bold">AurumVault Live Specie Transponder</span>
        </div>
        <div className="flex-1">
          <TrackingDashboard />
        </div>
      </div>
    )
  }

  // 4. Default Application Entry (Root / and /portal)
  // Zero marketing landing page — immediate entry into the Sovereign Depository portal
  if (user?.role === 'admin') {
    return <AdminCommandCenter />
  }

  if (user?.role === 'client') {
    return <ClientDashboard />
  }

  return <ClientLogin />
}
