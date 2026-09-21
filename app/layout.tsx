import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono, DM_Serif_Display } from 'next/font/google'
import { ShipmentsProvider } from '@/lib/shipments-context'
import { AuthProvider } from '@/lib/auth-context'
import './globals.css'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' })
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono' })
const dmSerif = DM_Serif_Display({ subsets: ['latin'], weight: '400', variable: '--font-dm-serif' })

export const metadata: Metadata = {
  title: 'AurumVault — Sovereign Specie Depository & Custody',
  description: 'Confidential client authentication and custody tracking for allocated Swiss vault depositors.',
}

export const viewport: Viewport = { colorScheme: 'light', themeColor: '#f9f8f3' }

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable} ${geistMono.variable} ${dmSerif.variable}`}>
      <body>
        <AuthProvider>
          <ShipmentsProvider>
            {children}
          </ShipmentsProvider>
        </AuthProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}

