'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { MarketTicker } from './market-ticker'
import { TrackingDashboard } from './tracking/tracking-dashboard'
import { QuoteCalculator } from './quote-calculator'
import { AdminCommandCenter } from './admin-command-center'
import { ClientDashboard } from './client/client-dashboard'
import { ClientLogin } from './client/client-login'
import { useAuth } from '@/lib/auth-context'
import { shipmentsData } from '@/lib/shipments-data'
import {
  ArrowRight,
  Check,
  ChevronDown,
  Clock3,
  Globe2,
  LockKeyhole,
  Menu,
  PackageCheck,
  Search,
  ShieldCheck,
  Sparkles,
  X,
  Radio,
  Plane,
  Truck,
  Building2,
  FileCheck,
  Award,
  Key,
  Coins,
  Gem,
  Watch,
  CheckCircle2,
  ExternalLink,
  LogOut,
  User,
} from 'lucide-react'


const navLinks = [
  ['Services', '/services'],
  ['Custody & Security', '/security'],
  ['Our Process', '/process'],
  ['Cost Estimator', '/quote'],
  ['About Us', '/about'],
]


function Button({
  children,
  href = '#',
  variant = 'gold',
  onClick,
  className = '',
}: {
  children: React.ReactNode
  href?: string
  variant?: 'gold' | 'dark' | 'light' | 'outline'
  onClick?: () => void
  className?: string
}) {
  const styles =
    variant === 'gold'
      ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm'
      : variant === 'dark'
      ? 'bg-foreground text-background hover:bg-foreground/90 shadow-sm'
      : variant === 'outline'
      ? 'border border-primary/40 bg-transparent text-primary hover:bg-primary/10'
      : 'border border-border bg-background text-foreground hover:bg-muted'
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-xs sm:text-sm font-semibold transition ${styles} ${className}`}
    >
      {children}
    </Link>
  )
}

function Header() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const { user, logout } = useAuth()

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <span className="grid size-9 place-items-center rounded-full bg-primary text-primary-foreground shadow-sm transition group-hover:scale-105">
            <Sparkles size={17} />
          </span>
          <div className="flex flex-col">
            <span className="font-serif text-xl font-bold tracking-tight text-foreground">
              Aurum<span className="text-primary">Vault</span>
            </span>
            <span className="text-[9px] uppercase tracking-[0.25em] text-muted-foreground -mt-1 font-mono">
              Geneva • Zurich • London
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-6 text-xs sm:text-sm font-medium text-muted-foreground lg:flex">
          {navLinks.map(([label, href]) => {
            const isActive = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className={`transition hover:text-foreground ${isActive ? 'text-primary font-semibold' : ''}`}
              >
                {label}
              </Link>
            )
          })}
        </nav>

        {/* Action CTAs */}
        <div className="hidden items-center gap-2.5 lg:flex">
          {user ? (
            <div className="flex items-center gap-2">
              <Link
                href={user.role === 'admin' ? '/admin' : '/portal'}
                className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 py-1.5 pl-2 pr-3 text-xs font-semibold text-primary hover:bg-primary hover:text-primary-foreground transition shadow-sm"
              >
                <div className="flex size-6 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                  {user.avatarInitials}
                </div>
                <span>{user.role === 'admin' ? 'Enter Operations Desk →' : 'Enter Client Depository →'}</span>
              </Link>
              <button
                onClick={logout}
                className="rounded-full border border-border p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition"
                title="Sign Out"
              >
                <LogOut size={13} />
              </button>
            </div>
          ) : (
            <>
              <Link
                href="/portal"
                className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition px-2.5 py-2"
              >
                <Key size={13} className="text-primary" />
                Client Vault
              </Link>
              <Link
                href="/admin"
                className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition px-2.5 py-2"
              >
                <LockKeyhole size={13} className="text-primary" />
                HQ Ops
              </Link>
            </>
          )}

          <Button href="/quote" variant="gold">
            Request Consultation <ArrowRight size={14} />
          </Button>
        </div>



        {/* Mobile Toggle */}
        <button
          aria-label="Toggle navigation"
          className="rounded-lg p-2 text-foreground hover:bg-muted lg:hidden"
          onClick={() => setOpen(!open)}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {open && (
        <div className="border-t border-border bg-background px-5 py-6 lg:hidden animate-in slide-in-from-top-2">
          <nav className="flex flex-col gap-4">
            {navLinks.map(([label, href]) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className="text-sm font-medium text-foreground hover:text-primary py-1"
              >
                {label}
              </Link>
            ))}
            <div className="border-t border-border pt-4 flex flex-col gap-2.5">
              {user ? (
                <div className="flex items-center justify-between rounded-xl bg-card p-3 border border-border">
                  <div className="flex items-center gap-2">
                    <div className="flex size-7 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                      {user.avatarInitials}
                    </div>
                    <span className="text-xs font-medium text-foreground">{user.name}</span>
                  </div>
                  <button
                    onClick={() => {
                      logout()
                      setOpen(false)
                    }}
                    className="text-xs text-destructive font-medium"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href="/portal"
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-center gap-1.5 rounded-xl border border-border bg-card py-2 text-xs font-semibold text-foreground hover:bg-muted"
                  >
                    <Key size={13} className="text-primary" />
                    Client Vault
                  </Link>
                  <Link
                    href="/admin"
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-center gap-1.5 rounded-xl border border-border bg-card py-2 text-xs font-semibold text-foreground hover:bg-muted"
                  >
                    <LockKeyhole size={13} className="text-primary" />
                    HQ Ops
                  </Link>
                </div>
              )}
              <Button href="/quote" variant="gold" onClick={() => setOpen(false)}>
                Request a Consultation <ArrowRight size={14} />
              </Button>
            </div>
          </nav>
        </div>

      )}
    </header>
  )
}


function Hero() {
  const [quickCode, setQuickCode] = useState('GOLD-2026-001245')
  const router = useRouter()

  const handleHeroTrack = (e: React.FormEvent) => {
    e.preventDefault()
    router.push(`/portal`)
  }


  return (
    <section className="relative overflow-hidden bg-foreground text-background">
      {/* Background radial glow */}
      <div className="absolute top-0 right-0 size-[600px] rounded-full bg-[radial-gradient(circle_at_70%_30%,rgba(194,155,67,0.18),transparent_65%)] pointer-events-none" />

      <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[1.1fr_.9fr] lg:px-8 lg:py-28">
        {/* Left Headline & Intro */}
        <div>
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-primary">
            <span className="size-1.5 rounded-full bg-primary animate-ping" />
            Sovereign High-Value Asset Logistics
          </div>

          <h1 className="max-w-3xl font-serif text-4xl leading-[1.08] tracking-tight text-balance sm:text-6xl lg:text-7xl">
            Nothing of value should be left to chance.
          </h1>

          <p className="mt-6 max-w-xl text-base sm:text-lg leading-relaxed text-background/75 font-normal">
            Private, armed, and cryptographically verified logistics for gold bullion, rare gemstones, fine horology, and irreplaceable archives. 
            Controlled from collection to subterranean vault handover.
          </p>

          {/* Quick Tracking Widget in Hero */}
          <form onSubmit={handleHeroTrack} className="mt-8 max-w-lg">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 rounded-2xl bg-background/10 p-2 border border-background/20 backdrop-blur-md">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-background/50" size={15} />
                <input
                  type="text"
                  placeholder="Enter Tracking Reference..."
                  value={quickCode}
                  onChange={e => setQuickCode(e.target.value)}
                  className="h-11 w-full rounded-xl bg-transparent pl-10 pr-3 text-xs font-mono text-background outline-none placeholder:text-background/40"
                />
              </div>
              <button
                type="submit"
                className="h-11 rounded-xl bg-primary px-5 text-xs font-bold uppercase tracking-wider text-primary-foreground hover:bg-primary/90 transition flex items-center justify-center gap-1.5 whitespace-nowrap shadow-md"
              >
                Track Live <ArrowRight size={13} />
              </button>
            </div>
            <div className="mt-2 flex items-center gap-2 text-[11px] text-background/55 font-mono">
              <span>Active demo reference:</span>
              <span className="text-primary font-semibold cursor-pointer underline hover:text-primary/80" onClick={() => setQuickCode('GOLD-2026-001245')}>
                GOLD-2026-001245
              </span>
            </div>
          </form>

          {/* CTAs */}
          <div className="mt-8 flex flex-wrap gap-3">
            <Button href="/quote" variant="gold">
              Calculate Route & Quote <ArrowRight size={15} />
            </Button>
            <Button href="/portal" variant="light">
              Client Depository Portal
            </Button>
          </div>
        </div>


        {/* Right Visual Box: Interactive Telemetry Card */}
        <div className="relative overflow-hidden rounded-2xl border border-background/15 bg-[radial-gradient(circle_at_70%_25%,rgba(194,155,67,.25),transparent_35%),linear-gradient(145deg,#24211b,#0e0e0d)] p-6 sm:p-8 shadow-2xl">
          {/* Top telemetry tag */}
          <div className="flex items-center justify-between border-b border-background/10 pb-4">
            <div className="flex items-center gap-2 text-xs text-background/80 font-mono">
              <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
              FLIGHT EK-089 SPECIE EN-ROUTE
            </div>
            <span className="font-mono text-xs text-primary font-semibold">68% Handover Progress</span>
          </div>

          {/* Dynamic route snippet */}
          <div className="py-6">
            <div className="flex items-center justify-between text-xs text-background/60 font-mono">
              <span>DXB (Dubai DMCC)</span>
              <span className="text-primary font-bold">Overflight Corridor E-04</span>
              <span>GVA (Geneva Freeport)</span>
            </div>

            {/* Simulated mini vector bar */}
            <div className="relative mt-3 h-2 w-full overflow-hidden rounded-full bg-background/20">
              <div className="h-full rounded-full bg-gradient-to-r from-primary/60 via-primary to-primary w-[68%]" />
            </div>

            <div className="mt-5 grid grid-cols-3 gap-3 text-center border-y border-background/10 py-4 font-mono">
              <div>
                <span className="text-[10px] text-background/45 block">ALTITUDE</span>
                <span className="text-xs font-bold text-background">38,200 FT</span>
              </div>
              <div>
                <span className="text-[10px] text-background/45 block">VELOCITY</span>
                <span className="text-xs font-bold text-background">518 KTS</span>
              </div>
              <div>
                <span className="text-[10px] text-background/45 block">SEAL STATUS</span>
                <span className="text-xs font-bold text-emerald-400">INTACT (0 LUX)</span>
              </div>
            </div>

            {/* Cargo Callout */}
            <div className="mt-5 flex items-center justify-between rounded-xl bg-background/5 p-4 border border-background/10">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-background/50 block">CONSIGNMENT VALUE</span>
                <span className="font-serif text-xl font-bold text-primary">$1,180,450 USD</span>
                <span className="text-[10px] text-background/60 block mt-0.5">400 oz Fine Gold Bullion (LBMA Good Delivery)</span>
              </div>
              <Link
                href="/portal"
                className="rounded-full bg-primary/20 hover:bg-primary/30 text-primary p-2.5 transition"
                title="View in client depository"
              >
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>


          {/* Bottom Badge */}
          <div className="flex items-center justify-between text-[11px] text-background/60 pt-2 border-t border-background/10">
            <span>Underwritten by Lloyd's of London #2003</span>
            <span className="text-emerald-400 font-semibold">100% Chain of Custody</span>
          </div>
        </div>
      </div>

      {/* Trust & Network Indicator Bar */}
      <div className="mx-auto grid max-w-7xl grid-cols-2 border-t border-background/10 px-4 sm:px-6 lg:grid-cols-4 lg:px-8">
        {[
          ['$9.02M+', 'Active cargo in transit today'],
          ['48 Sovereign', 'Bonded vault corridors connected'],
          ['0 Breaches', '12-year flawless custody record'],
          ['100% Guaranteed', 'Dual-escort Lloyd’s underwritten'],
        ].map(([value, label]) => (
          <div key={label} className="border-r border-background/10 px-4 py-6 first:pl-0 last:border-0">
            <p className="font-serif text-2xl sm:text-3xl text-primary font-bold">{value}</p>
            <p className="mt-1 text-xs text-background/60 leading-tight">{label}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

function Home() {
  return (
    <>
      <Hero />

      {/* Value Pillars Section */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[.8fr_1.2fr]">
          <div>
            <p className="eyebrow">The Sovereign Standard</p>
            <h2 className="mt-4 font-serif text-3xl sm:text-5xl leading-tight text-foreground text-balance">
              The quiet confidence of knowing it&apos;s handled.
            </h2>
            <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
              Standard commercial cargo channels are vulnerable to handling handoffs, customs exposure, and information leaks. AurumVault operates on an independent, private protocol designed for high-value physical custody.
            </p>
            <div className="mt-8">
              <Button href="/process" variant="outline">
                Explore The Custody Protocol <ArrowRight size={14} />
              </Button>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <Feature
              icon={<ShieldCheck />}
              title="Security by Design"
              text="Layered Level IV & V armed escorts, biometric safe enclosures, and discreet handling across all international borders."
            />
            <Feature
              icon={<Globe2 />}
              title="One Global Command"
              text="A single accountable partner across 48 sovereign bonded facilities including Geneva, Zurich, Dubai, London, and Singapore."
            />
            <Feature
              icon={<Radio />}
              title="Cryptographic Telemetry"
              text="Live IoT sensor feeds measuring optical lux, G-force, temperature, and dual GPS/Iridium satellite constellations."
            />
            <Feature
              icon={<PackageCheck />}
              title="Assay & Handover Proof"
              text="Tamper-evident seals backed by digital certificates of custody, assay verification matching, and dual sign-offs."
            />
          </div>
        </div>
      </section>

      {/* Live Tracking Teaser Showcase */}
      <section className="bg-muted py-20 border-y border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="eyebrow">Sovereign Fleet Operations</p>
              <h2 className="mt-2 font-serif text-3xl sm:text-4xl text-foreground">
                Active International Corridors
              </h2>
            </div>
            <Button href="/portal" variant="dark">
              Enter Client Depository <ArrowRight size={15} />
            </Button>
          </div>

          {/* Quick Cards of Active Consignments */}
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {shipmentsData.slice(0, 3).map(s => (
              <div
                key={s.id}
                className="group rounded-2xl border border-border bg-card p-6 shadow-sm transition hover:-translate-y-1 hover:border-primary"
              >
                <div className="flex items-center justify-between border-b border-border pb-4">
                  <span className="font-mono font-bold text-foreground text-sm">{s.id}</span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                      s.statusType === 'delivered'
                        ? 'bg-emerald-500/10 text-emerald-600'
                        : 'bg-primary/10 text-primary'
                    }`}
                  >
                    {s.status}
                  </span>
                </div>

                <div className="mt-4">
                  <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                    <span>{s.origin.city}</span>
                    <ArrowRight size={13} className="text-primary" />
                    <span>{s.destination.city}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground line-clamp-1">{s.manifest.itemType}</p>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground font-mono">
                  <span>Value: <strong className="text-foreground">{s.manifest.declaredValue}</strong></span>
                  <span>ETA: {s.eta}</span>
                </div>

                <Link
                  href="/portal"
                  className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-primary group-hover:underline"
                >
                  Track in Client Depository <ArrowRight size={13} />
                </Link>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* Selected Services Section */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="eyebrow">Bespoke Custody Capabilities</p>
            <h2 className="mt-2 font-serif text-3xl sm:text-4xl text-foreground">
              Engineered for irreplaceable cargo.
            </h2>
          </div>
          <Button href="/quote" variant="gold">
            Calculate Logistics Tariffs <ArrowRight size={15} />
          </Button>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          <ServiceCard
            number="01"
            title="Precious Metals & Bullion"
            text="Secure, assay-verified transit of gold, silver, and platinum bullion between LBMA vaults, refiners, and private depositories."
          />
          <ServiceCard
            number="02"
            title="Fine Horology & Jewels"
            text="Museum-grade, nitrogen-purged hermetic casks for grand complication timepieces, high jewelry, and investment-grade gems."
          />
          <ServiceCard
            number="03"
            title="Sovereign Specie Charters"
            text="Direct point-to-point chartered aircraft with dual armed air marshals, tarmac ramp access, and zero intermediate handling."
          />
        </div>
      </section>

      {/* Bottom CTA Ribbon */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-primary px-6 py-14 text-primary-foreground sm:px-12 lg:flex lg:items-center lg:justify-between shadow-xl">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] opacity-80 font-mono">
              Confidential Consultation Desk
            </p>
            <h2 className="mt-3 font-serif text-3xl sm:text-4xl leading-tight font-semibold max-w-xl">
              Entrust your next high-value transit to the global standard.
            </h2>
            <p className="mt-2 text-xs sm:text-sm opacity-90 max-w-md">
              Speak directly with our Geneva Senior Custody Desk for an immediate route risk analysis.
            </p>
          </div>
          <div className="mt-8 lg:mt-0 flex flex-wrap gap-3">
            <Button href="/quote" variant="dark">
              Request Private Quote <ArrowRight size={16} />
            </Button>
            <Button href="/portal" variant="outline" className="border-primary-foreground/40 text-primary-foreground hover:bg-primary-foreground/10">
              Private Client Depository
            </Button>
          </div>
        </div>
      </section>
    </>
  )
}

function Feature({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="rounded-xl border border-border/80 bg-card p-6 shadow-sm">
      <div className="mb-4 text-primary">{icon}</div>
      <h3 className="font-semibold text-foreground text-base">{title}</h3>
      <p className="mt-2 text-xs sm:text-sm leading-relaxed text-muted-foreground">{text}</p>
    </div>
  )
}

function ServiceCard({ number, title, text }: { number: string; title: string; text: string }) {
  return (
    <div className="group rounded-2xl border border-border bg-card p-7 transition hover:-translate-y-1 hover:border-primary shadow-sm flex flex-col justify-between">
      <div>
        <p className="font-mono text-xs font-bold text-primary">{number}</p>
        <h3 className="mt-8 font-serif text-2xl font-semibold text-foreground">{title}</h3>
        <p className="mt-3 text-xs sm:text-sm leading-relaxed text-muted-foreground">{text}</p>
      </div>
      <Link href="/services" className="mt-8 inline-flex items-center gap-2 text-xs font-semibold text-foreground group-hover:text-primary transition">
        Explore Protocol <ArrowRight size={14} className="transition group-hover:translate-x-1" />
      </Link>
    </div>
  )
}

function PageShell({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow: string
  title: string
  intro: string
  children: React.ReactNode
}) {
  return (
    <main>
      <section className="bg-foreground px-4 py-16 text-background sm:px-6 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">{eyebrow}</p>
          <h1 className="mt-4 font-serif text-3xl sm:text-5xl lg:text-6xl font-semibold leading-tight text-balance">
            {title}
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-sm sm:text-base leading-relaxed text-background/70">{intro}</p>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">{children}</section>
    </main>
  )
}

function Generic({ slug }: { slug: string }) {
  const content: Record<string, [string, string, string]> = {
    services: [
      'Custodial Specializations',
      'Logistics with a higher standard.',
      'Purpose-built movement solutions for assets that demand more than commercial carriers can provide.',
    ],
    about: [
      'Our Heritage & Philosophy',
      'Trust is the real asset.',
      'We are an independent, private logistics house built for sovereigns, bullion banks, institutions, and family offices.',
    ],
    security: [
      'Security & Defense Protocol',
      'Control at every handover.',
      'Our operating model combines active IoT sensor telemetry, Level IV/V armored details, and Lloyd’s of London specie underwriting.',
    ],
    process: [
      'Chain of Custody',
      'Simple for you. Precise for us.',
      'A disciplined, six-stage custodial pipeline guaranteeing transparency without compromising operational secrecy.',
    ],
    contact: [
      'Concierge Desk',
      'Speak with our senior team.',
      'Direct, encrypted communication with our central operations desks in Geneva, Zurich, and London.',
    ],
  }

  const [eyebrow, title, intro] = content[slug] || content.services

  return (
    <PageShell eyebrow={eyebrow} title={title} intro={intro}>
      {/* 3-Stage Pipeline Display */}
      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <p className="font-mono text-xs font-bold text-primary">PHASE 01</p>
          <h3 className="mt-4 font-serif text-xl font-semibold text-foreground">Consult & Secure Routing</h3>
          <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
            We evaluate the asset specification, assay documentation, and geopolitical corridors to designate an optimal, zero-exposure transit corridor.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <p className="font-mono text-xs font-bold text-primary">PHASE 02</p>
          <h3 className="mt-4 font-serif text-xl font-semibold text-foreground">Dual Escort & Sensor Lockdown</h3>
          <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Biometric nitrogen-sealed casks are fitted with active electronic tamper seals and tracked 24/7 via dual GPS/Iridium downlinks.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <p className="font-mono text-xs font-bold text-primary">PHASE 03</p>
          <h3 className="mt-4 font-serif text-xl font-semibold text-foreground">Verified Vault Handover</h3>
          <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Physical assay reconciliation, weight verification, and release of the cryptographic Certificate of Chain of Custody to your private register.
          </p>
        </div>
      </div>

      <div className="mt-12 flex justify-center">
        <Button href="/quote" variant="gold">
          Initiate Route Consultation <ArrowRight size={15} />
        </Button>
      </div>
    </PageShell>
  )
}

function AdminLogin() {
  const { user, login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (user?.role === 'admin') {
    return <AdminCommandCenter />
  }

  return (
    <PageShell
      eyebrow="Authorized Access Only"
      title="Sovereign Operations Gateway"
      intro="Enter your encrypted credentials to access the live fleet command center."
    >
      <div className="mx-auto max-w-md rounded-2xl border border-border bg-card p-8 shadow-xl">
        <div className="text-center mb-6">
          <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <LockKeyhole size={22} />
          </div>
          <h3 className="font-serif text-2xl font-semibold text-foreground">Operations Authentication</h3>
          <p className="text-xs text-muted-foreground mt-1">Authorized for Level IV Custody Personnel</p>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
            {error}
          </div>
        )}

        <form
          onSubmit={async (e) => {
            e.preventDefault()
            setError(null)
            setIsSubmitting(true)
            try {
              const res = await login(email, password)
              if (!res.success) {
                setError(res.error || 'Authentication rejected.')
              }
            } finally {
              setIsSubmitting(false)
            }
          }}
          className="space-y-4 text-xs"
        >
          <div>
            <label className="font-medium text-foreground block">Officer Email</label>
            <input
              required
              type="email"
              placeholder="chief.marshal@aurumvault.ch"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="mt-1.5 h-11 w-full rounded-xl border border-border bg-background px-3 text-xs text-foreground outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="font-medium text-foreground block">Security Passcode / Token</label>
            <input
              required
              type="password"
              placeholder="Enter confidential passkey"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="mt-1.5 h-11 w-full rounded-xl border border-border bg-background px-3 text-xs text-foreground outline-none focus:border-primary"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-full bg-foreground py-3 font-semibold text-background hover:bg-foreground/90 transition shadow-sm mt-2"
          >
            {isSubmitting ? 'Verifying Hardware Token...' : 'Authenticate & Open Command Center'}
          </button>
        </form>
      </div>
    </PageShell>
  )
}


function FAQ() {
  const [open, setOpen] = useState(0)
  const faqs = [
    [
      'What categories of valuable assets does AurumVault transport?',
      'We coordinate secure, insured transit for 999.9 physical gold, silver, and platinum bullion, certified rough and polished gemstones, fine horology complications, museum-grade fine art, and sensitive diplomatic documents.',
    ],
    [
      'How does the real-time telemetry and active seal system work?',
      'Every active consignment is housed in a biometric nitrogen-purged cask equipped with an IoT electronic seal. The device transmits real-time optical lux readings (ensuring darkness is unbroken), G-force shock metrics, temperature, and dual GPS/Iridium satellite telemetry directly to our Geneva Command Desk and your private tracking portal.',
    ],
    [
      'What insurance guarantees underwrite transit movements?',
      'All movements are underwritten by Lloyd’s of London Specie & High Value Cargo syndicates with zero-deductible all-risk coverage. Full declared values are insured up to $50,000,000 USD per consignment.',
    ],
    [
      'Which sovereign vault facilities are directly connected?',
      'Our primary bonded hubs include the Geneva Freeport (GVA), Zurich Freeport (ZRH), Dubai Multi Commodities Centre (DMCC), London LBMA Bank of England Corridors, Singapore Le Freeport (SIN), and Manhattan Private Depositories (NYC).',
    ],
  ]

  return (
    <PageShell
      eyebrow="Custody Intelligence"
      title="Frequently Asked Questions"
      intro="Clear, authoritative answers regarding our custody protocols, insurance underwriting, and tracking technologies."
    >
      <div className="mx-auto max-w-3xl divide-y divide-border border-y border-border">
        {faqs.map(([q, a], i) => (
          <div key={q}>
            <button
              className="flex w-full items-center justify-between gap-5 py-6 text-left font-medium text-foreground text-sm sm:text-base"
              onClick={() => setOpen(open === i ? -1 : i)}
            >
              {q}
              <ChevronDown
                className={`shrink-0 transition text-muted-foreground ${
                  open === i ? 'rotate-180 text-primary' : ''
                }`}
                size={18}
              />
            </button>
            {open === i && <p className="max-w-2xl pb-6 text-xs sm:text-sm leading-relaxed text-muted-foreground">{a}</p>}
          </div>
        ))}
      </div>
    </PageShell>
  )
}

function Footer() {
  return (
    <footer className="border-t border-border bg-foreground text-background">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 md:grid-cols-4 lg:px-8">
        <div className="md:col-span-2">
          <div className="mb-4 flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-full bg-primary text-primary-foreground">
              <Sparkles size={17} />
            </span>
            <span className="font-serif text-xl font-bold text-background">
              Aurum<span className="text-primary">Vault</span>
            </span>
          </div>
          <p className="max-w-sm text-xs sm:text-sm leading-relaxed text-background/65">
            Sovereign logistics for precious metals, fine jewellery, and high-value specie. Built around institutional trust, discretion, and unbroken chain of custody.
          </p>
          <div className="mt-6 flex items-center gap-3 text-xs text-background/50 font-mono">
            <span>LBMA Registered</span>
            <span>•</span>
            <span>Lloyd's Specie Insured</span>
            <span>•</span>
            <span>Geneva Freeport B-12</span>
          </div>
        </div>

        <div>
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-primary">Corridors</p>
          {navLinks.map(([label, href]) => (
            <Link
              key={href}
              href={href}
              className="mb-2.5 block text-xs sm:text-sm text-background/65 hover:text-background transition"
            >
              {label}
            </Link>
          ))}
          <Link
            href="/admin"
            className="mt-4 inline-flex items-center gap-1.5 text-xs text-primary font-mono hover:underline"
          >
            <LockKeyhole size={12} />
            Operations Command Desk
          </Link>
        </div>

        <div>
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-primary">Diplomatic Desk</p>
          <p className="text-xs sm:text-sm text-background/70 font-mono">concierge@aurumvault.ch</p>
          <p className="mt-2 text-xs sm:text-sm text-background/70 font-mono">+41 22 555 0192 (Geneva HQ)</p>
          <p className="mt-1 text-xs sm:text-sm text-background/70 font-mono">+44 20 7946 0184 (London LBMA)</p>
          <Link
            href="/quote"
            className="mt-6 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
          >
            Dispatch Private Inquiry <ArrowRight size={13} />
          </Link>
        </div>
      </div>

      <div className="mx-auto flex max-w-7xl flex-col gap-3 border-t border-background/10 px-4 py-6 text-xs text-background/45 sm:flex-row sm:justify-between sm:px-6 lg:px-8">
        <span>© 2026 AurumVault SA. Registered Sovereign Specie Depository.</span>
        <span>Swiss Federal Secrecy Protocols · Lloyd's Cargo Specie Policy #2003 · ISO 27001</span>
      </div>
    </footer>
  )
}

export default function LogisticsSite() {
  const pathname = usePathname()
  const { user } = useAuth()
  const slug = pathname.split('/').filter(Boolean).pop() || ''

  // 1. Client Depository Portal -> Dedicated Full-Screen Shell
  if (pathname.startsWith('/portal')) {
    if (slug === 'login' || !user || user.role === 'admin') {
      return <ClientLogin />
    }
    return <ClientDashboard />
  }

  // 2. Admin Command Center -> Dedicated Full-Screen Operations Shell with Level-V Security Gate
  if (slug === 'admin' || pathname.startsWith('/admin')) {
    return <AdminCommandCenter />
  }

  // 3. Public Marketing Website Pages
  let content: React.ReactNode = <Home />

  if (slug === 'tracking') {
    content = <TrackingDashboard />
  } else if (slug === 'quote') {
    content = <QuoteCalculator />
  } else if (slug === 'faq') {
    content = <FAQ />
  } else if (slug && slug !== '') {
    content = <Generic slug={slug} />
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground font-sans">
      <MarketTicker />
      <Header />
      <div className="flex-1">{content}</div>
      <Footer />
    </div>
  )
}


