'use client'

import { useState } from 'react'
import { useShipments } from '@/lib/shipments-context'
import {
  Shield,
  Clock,
  Coins,
  Gem,
  Watch,
  Palette,
  ArrowRight,
  CheckCircle2,
  Lock,
  Plane,
  Truck,
  Building2,
  Sparkles,
  PhoneCall,
} from 'lucide-react'

const vaultHubs = [
  { city: 'Geneva', country: 'Switzerland', code: 'GVA-FP', name: 'Geneva Freeport High-Security Depository' },
  { city: 'Zurich', country: 'Switzerland', code: 'ZRH-FP', name: 'Zurich Freeport Vault' },
  { city: 'Dubai', country: 'UAE', code: 'DXB-DMCC', name: 'Dubai Multi Commodities Centre (DMCC)' },
  { city: 'London', country: 'UK', code: 'LHR-LBMA', name: 'LBMA Custody Center (Bank of England Corridor)' },
  { city: 'Singapore', country: 'Singapore', code: 'SIN-LEFP', name: 'Singapore Le Freeport Sector 4' },
  { city: 'New York', country: 'USA', code: 'NYC-PV', name: 'Manhattan 5th Ave Private Vaults' },
  { city: 'Antwerp', country: 'Belgium', code: 'ANR-AWDC', name: 'Antwerp World Diamond Centre' },
  { city: 'Tokyo', country: 'Japan', code: 'TYO-GNZ', name: 'Tokyo Ginza Precious Metals Vault' },
]

const assetTypes = [
  { id: 'bullion', name: 'Precious Metals & Bullion', icon: Coins, desc: '999.9 Fine Gold, Silver & Platinum bars' },
  { id: 'horology', name: 'Fine Horology & Watches', icon: Watch, desc: 'Collector timepieces & rare archives' },
  { id: 'diamonds', name: 'Diamonds & Gemstones', icon: Gem, desc: 'Kimberley certified rough & polished stones' },
  { id: 'art', name: 'Fine Art & Museum Specie', icon: Palette, desc: 'High-value masterworks & sensitive assets' },
]

export function QuoteCalculator() {
  const { addQuoteInquiry } = useShipments()
  const [assetType, setAssetType] = useState('bullion')
  const [declaredValue, setDeclaredValue] = useState(2500000)
  const [origin, setOrigin] = useState('DXB-DMCC')
  const [destination, setDestination] = useState('GVA-FP')
  const [transitMode, setTransitMode] = useState<'charter' | 'bonded' | 'ground'>('bonded')
  const [submitted, setSubmitted] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [notes, setNotes] = useState('')
  const [dossierId, setDossierId] = useState('AV-EST-881902')

  // Dynamic calculations
  const originHub = vaultHubs.find(h => h.code === origin) || vaultHubs[2]
  const destHub = vaultHubs.find(h => h.code === destination) || vaultHubs[0]

  const isHighValue = declaredValue >= 5000000
  const securityTier = isHighValue
    ? 'Level 5 Sovereign Protocol (Dual Armed Marshals + Dedicated Charter)'
    : 'Level 4 Specie Security (Bonded Air-Specie Hold + IoT Active Seal)'

  const estimatedHours = transitMode === 'charter' ? '12 – 18 Hours' : transitMode === 'ground' ? '24 – 48 Hours' : '18 – 32 Hours'

  // Realistic fee estimation based on value and logistics risk
  const baseRate = declaredValue * (transitMode === 'charter' ? 0.0035 : 0.0018)
  const minRate = transitMode === 'charter' ? 18500 : 7500
  const estimatedTotal = Math.max(minRate, Math.round(baseRate / 500) * 500)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setDossierId(`AV-EST-${Math.floor(100000 + Math.random() * 900000)}`)
    const selectedAsset = assetTypes.find(a => a.id === assetType)?.name || 'Precious Specie'
    addQuoteInquiry({
      clientName: name,
      email,
      assetType: selectedAsset,
      declaredValue,
      originCity: originHub.city,
      originCode: originHub.code,
      destinationCity: destHub.city,
      destinationCode: destHub.code,
      transitMode:
        transitMode === 'charter'
          ? 'Dedicated Chartered Aircraft'
          : transitMode === 'ground'
          ? 'Armored Ground Convoy'
          : 'Bonded Air-Specie Hold',
      notes,
    })
    setSubmitted(true)
  }


  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mx-auto max-w-3xl text-center">
        <p className="eyebrow">Specie Logistics Estimator</p>
        <h1 className="mt-3 font-serif text-3xl sm:text-5xl font-semibold tracking-tight text-foreground text-balance">
          Plan your movement with absolute discretion.
        </h1>
        <p className="mt-4 text-sm sm:text-base text-muted-foreground leading-relaxed">
          Configure route parameters, select custody requirements, and receive an immediate protocol appraisal and concierge consultation.
        </p>
      </div>

      {submitted ? (
        /* Success Screen */
        <div className="mx-auto mt-12 max-w-xl rounded-2xl border border-primary/40 bg-primary/5 p-8 sm:p-12 text-center shadow-lg">
          <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
            <CheckCircle2 size={36} />
          </div>
          <p className="eyebrow mt-4">Inquiry Authenticated</p>
          <h2 className="mt-2 font-serif text-3xl font-semibold text-foreground">
            Consultation Request Confirmed
          </h2>
          <p className="mt-3 text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Thank you, <strong className="text-foreground">{name}</strong>. Your itinerary from{' '}
            <strong className="text-foreground">{originHub.city}</strong> to{' '}
            <strong className="text-foreground">{destHub.city}</strong> (Declared Value:{' '}
            <strong className="text-primary font-mono">${declaredValue.toLocaleString()} USD</strong>) has been routed to our Senior Diplomatic Logistics Desk.
          </p>
          <div className="mt-6 rounded-xl border border-border bg-background p-4 text-left text-xs space-y-1.5 font-mono">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Assigned Dispatcher:</span>
              <span className="text-foreground font-semibold">Chief Vault Marshal (Geneva HQ)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Expected Callback:</span>
              <span className="text-primary font-semibold">Within 60 Minutes (Encrypted)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Reference Dossier:</span>
              <span className="text-foreground font-semibold">{dossierId}</span>
            </div>
          </div>
          <button
            onClick={() => setSubmitted(false)}
            className="mt-8 inline-flex items-center justify-center rounded-full border border-border bg-background px-6 py-2.5 text-xs font-semibold text-foreground hover:bg-muted transition"
          >
            Adjust Consultation Parameters
          </button>
        </div>
      ) : (
        /* Interactive Calculator Grid */
        <div className="mt-12 grid gap-8 lg:grid-cols-12">
          {/* Left Configuration Column (7 cols) */}
          <div className="space-y-8 lg:col-span-7">
            {/* 1. Asset Selection */}
            <div className="rounded-2xl border border-border bg-card p-6 sm:p-7 shadow-sm">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
                <span className="flex size-5 items-center justify-center rounded-full bg-primary/10 text-primary text-[11px] font-bold">1</span>
                Asset Classification
              </div>
              <h3 className="mt-1 font-serif text-lg font-semibold text-foreground">
                What asset category are you moving?
              </h3>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {assetTypes.map(item => {
                  const Icon = item.icon
                  const isSelected = assetType === item.id
                  return (
                    <button
                      type="button"
                      key={item.id}
                      onClick={() => setAssetType(item.id)}
                      className={`flex flex-col items-start rounded-xl p-4 text-left border transition ${
                        isSelected
                          ? 'border-primary bg-primary/5 ring-1 ring-primary'
                          : 'border-border bg-background hover:bg-muted/50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`p-2 rounded-lg ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'}`}>
                          <Icon size={18} />
                        </div>
                        <span className="font-semibold text-xs text-foreground">{item.name}</span>
                      </div>
                      <p className="mt-2 text-[11px] text-muted-foreground">{item.desc}</p>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* 2. Declared Value Slider */}
            <div className="rounded-2xl border border-border bg-card p-6 sm:p-7 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
                  <span className="flex size-5 items-center justify-center rounded-full bg-primary/10 text-primary text-[11px] font-bold">2</span>
                  Declared Cargo Value
                </div>
                <span className="font-mono text-lg sm:text-xl font-bold text-primary">
                  ${declaredValue.toLocaleString()} USD
                </span>
              </div>
              <h3 className="mt-1 font-serif text-lg font-semibold text-foreground">
                Insured valuation under Lloyd's Specie
              </h3>

              <div className="mt-6">
                <input
                  type="range"
                  min={250000}
                  max={25000000}
                  step={250000}
                  value={declaredValue}
                  onChange={e => setDeclaredValue(Number(e.target.value))}
                  className="w-full accent-primary h-2 bg-muted rounded-lg cursor-pointer"
                />
                <div className="mt-2 flex justify-between text-[10px] text-muted-foreground font-mono">
                  <span>$250K USD</span>
                  <span>$5M USD</span>
                  <span>$15M USD</span>
                  <span>$25M+ USD</span>
                </div>
              </div>
            </div>

            {/* 3. Origin & Destination Hubs */}
            <div className="rounded-2xl border border-border bg-card p-6 sm:p-7 shadow-sm">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
                <span className="flex size-5 items-center justify-center rounded-full bg-primary/10 text-primary text-[11px] font-bold">3</span>
                Vault Corridors
              </div>
              <h3 className="mt-1 font-serif text-lg font-semibold text-foreground">
                Select Origin and Destination Hubs
              </h3>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Origin High-Security Hub</label>
                  <select
                    value={origin}
                    onChange={e => setOrigin(e.target.value)}
                    className="mt-1.5 h-11 w-full rounded-xl border border-border bg-background px-3 text-xs font-medium outline-none focus:border-primary"
                  >
                    {vaultHubs.map(h => (
                      <option key={`orig-${h.code}`} value={h.code}>
                        {h.city} ({h.country}) — {h.code}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-[10px] text-muted-foreground truncate">{originHub.name}</p>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground">Destination Vault</label>
                  <select
                    value={destination}
                    onChange={e => setDestination(e.target.value)}
                    className="mt-1.5 h-11 w-full rounded-xl border border-border bg-background px-3 text-xs font-medium outline-none focus:border-primary"
                  >
                    {vaultHubs.map(h => (
                      <option key={`dest-${h.code}`} value={h.code}>
                        {h.city} ({h.country}) — {h.code}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-[10px] text-muted-foreground truncate">{destHub.name}</p>
                </div>
              </div>

              {/* Transit Conveyance Tier */}
              <div className="mt-6 border-t border-border pt-4">
                <label className="text-xs font-medium text-muted-foreground block mb-2">
                  Preferred Transport Conveyance
                </label>
                <div className="grid gap-2 sm:grid-cols-3 text-xs">
                  <button
                    type="button"
                    onClick={() => setTransitMode('charter')}
                    className={`p-3 rounded-xl border text-left transition ${
                      transitMode === 'charter'
                        ? 'border-primary bg-primary/10 text-foreground font-semibold'
                        : 'border-border bg-background text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Plane size={15} className="mb-1 text-primary" />
                    Dedicated Charter
                    <span className="block text-[10px] text-muted-foreground font-normal">Sovereign Direct Flight</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTransitMode('bonded')}
                    className={`p-3 rounded-xl border text-left transition ${
                      transitMode === 'bonded'
                        ? 'border-primary bg-primary/10 text-foreground font-semibold'
                        : 'border-border bg-background text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Shield size={15} className="mb-1 text-primary" />
                    Bonded Air-Specie
                    <span className="block text-[10px] text-muted-foreground font-normal">Armed Scheduled Hold</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTransitMode('ground')}
                    className={`p-3 rounded-xl border text-left transition ${
                      transitMode === 'ground'
                        ? 'border-primary bg-primary/10 text-foreground font-semibold'
                        : 'border-border bg-background text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Truck size={15} className="mb-1 text-primary" />
                    Armored Ground
                    <span className="block text-[10px] text-muted-foreground font-normal">Level IV Escort Convoy</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Appraisal & Intake Form Column (5 cols) */}
          <div className="space-y-6 lg:col-span-5">
            {/* Live Appraisal Box */}
            <div className="rounded-2xl border border-primary/50 bg-foreground text-background p-6 sm:p-8 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                <Shield size={120} />
              </div>

              <div className="relative z-10">
                <span className="text-[10px] uppercase tracking-[0.25em] text-primary font-semibold">
                  Preliminary Security Appraisal
                </span>
                <h3 className="mt-1 font-serif text-2xl font-bold text-background">
                  {originHub.city} ➔ {destHub.city}
                </h3>

                <div className="mt-6 space-y-4 text-xs divide-y divide-background/10">
                  <div className="pt-3 flex justify-between items-center">
                    <span className="text-background/60">Estimated Transit Time</span>
                    <span className="font-mono font-bold text-background text-sm">{estimatedHours}</span>
                  </div>

                  <div className="pt-3 flex justify-between items-center">
                    <span className="text-background/60">Security Protocol Tier</span>
                    <span className="font-medium text-primary text-right max-w-[180px]">{securityTier}</span>
                  </div>

                  <div className="pt-3 flex justify-between items-center">
                    <span className="text-background/60">Insurance Coverage</span>
                    <span className="text-emerald-400 font-semibold">Lloyd's Specie (100% All-Risk)</span>
                  </div>

                  <div className="pt-3 flex justify-between items-center">
                    <span className="text-background/60">Electronic Tamper Seal</span>
                    <span className="text-background font-mono">IoT AES-Satellite Monitored</span>
                  </div>

                  <div className="pt-4 flex justify-between items-baseline border-t-2 border-primary/40">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-background/60 block">Indicative Tariff</span>
                      <span className="text-xs text-background/40">Includes all-risk specie underwriting</span>
                    </div>
                    <span className="font-serif text-2xl font-bold text-primary">
                      ~${estimatedTotal.toLocaleString()} <span className="text-xs font-sans text-background/60">USD</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Private Concierge Intake Form */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <h4 className="font-serif text-lg font-semibold text-foreground">
                Request Private Diplomatic Concierge
              </h4>
              <p className="mt-1 text-xs text-muted-foreground">
                All communications are protected under Swiss confidential logistics protocols.
              </p>

              <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                <div>
                  <label className="text-xs font-medium text-foreground block">Principal / Contact Name</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Lord Alexander Wright"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="mt-1.5 h-11 w-full rounded-xl border border-border bg-background px-4 text-xs outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-foreground block">Secure Corporate / Private Email</label>
                  <input
                    required
                    type="email"
                    placeholder="a.wright@private-trust.ch"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="mt-1.5 h-11 w-full rounded-xl border border-border bg-background px-4 text-xs outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-foreground block">Special Handling or Timing Requirements</label>
                  <textarea
                    rows={3}
                    placeholder="e.g. Requires airside tarmac ramp access in Geneva, vault assay certificate inspection on arrival."
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-border bg-background p-3 text-xs outline-none focus:border-primary resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full rounded-full bg-primary py-3.5 text-xs sm:text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition shadow-md flex items-center justify-center gap-2"
                >
                  <PhoneCall size={15} />
                  Initiate Secure Concierge Dispatch
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
