'use client'

import React, { useState } from 'react'
import { useShipments } from '@/lib/shipments-context'
import { useAuth } from '@/lib/auth-context'
import { Shipment } from '@/lib/types'
import {
  ShieldCheck,
  Lock,
  Search,
  CheckCircle2,
  ArrowRight,
  Shield,
  Plane,
  Building2,
  ExternalLink,
  Key,
  Award,
  AlertCircle,
} from 'lucide-react'
import Link from 'next/link'

export function TrackingDashboard() {
  const { shipments, selectedShipmentId, setSelectedShipmentId } = useShipments()
  const { user } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchedShipment, setSearchedShipment] = useState<Shipment | null>(null)
  const [hasSearched, setHasSearched] = useState(false)

  const activeShipment = hasSearched
    ? searchedShipment
    : shipments.find(s => s.id === selectedShipmentId) || shipments[0]

  const handleSearch = (queryToSearch: string) => {
    const q = queryToSearch.trim().toLowerCase()
    if (!q) {
      setHasSearched(false)
      return
    }
    const found = shipments.find(
      s =>
        s.id.toLowerCase() === q ||
        s.trackingNumber.toLowerCase() === q ||
        s.origin.city.toLowerCase().includes(q) ||
        s.destination.city.toLowerCase().includes(q)
    )
    setHasSearched(true)
    setSearchedShipment(found || null)
    if (found) {
      setSelectedShipmentId(found.id)
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Top Classified Notice */}
      <div className="mb-8 rounded-2xl border border-primary/30 bg-primary/[0.04] p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3.5">
            <div className="rounded-xl bg-primary/10 p-2.5 text-primary shrink-0 mt-0.5">
              <Lock size={20} />
            </div>
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-primary block font-mono">
                Classified Custody Protocol
              </span>
              <h1 className="font-serif text-xl sm:text-2xl font-normal text-foreground mt-0.5">
                Sovereign Specie In-Transit Verification
              </h1>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed max-w-2xl">
                Under Swiss Federal Secrecy Protocols and Lloyd’s of London Specie Rules, real-time live flight vectors, satellite telemetry, and IoT tamper seal downlinks are strictly classified. Live vector movement is accessible exclusively to authenticated depositors within their private client dashboard.
              </p>
            </div>
          </div>

          <Link
            href="/portal"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground hover:opacity-95 transition shrink-0 self-start sm:self-auto shadow-sm"
          >
            <span>{user ? 'Enter Your Dashboard' : 'Client Depository Login'}</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      {/* Verification Lookup Input */}
      <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
          <ShieldCheck size={16} className="text-primary" />
          <span>Consignment Reference Audit</span>
        </div>
        <h2 className="font-serif text-2xl font-normal text-foreground mb-4">
          Verify Consignment Authenticity
        </h2>

        <form
          onSubmit={e => {
            e.preventDefault()
            handleSearch(searchQuery)
          }}
          className="flex flex-col sm:flex-row items-center gap-3"
        >
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <input
              type="text"
              placeholder="Enter reference ID (e.g. GOLD-2026-001245 or AV-DXB-GVA-99428-X)"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="h-12 w-full rounded-xl border border-border bg-background pl-11 pr-4 text-xs sm:text-sm font-mono text-foreground outline-none transition focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
          <button
            type="submit"
            className="h-12 w-full sm:w-auto rounded-xl bg-foreground px-6 text-xs sm:text-sm font-semibold text-background hover:bg-foreground/90 transition shadow-sm whitespace-nowrap"
          >
            Verify Reference
          </button>
        </form>

        {/* Quick Demo Reference Buttons */}
        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-muted-foreground font-medium">Demo Registered Convoys:</span>
          {shipments.slice(0, 3).map(s => (
            <button
              key={s.id}
              onClick={() => {
                setSearchQuery(s.id)
                setHasSearched(false)
                setSelectedShipmentId(s.id)
              }}
              className={`rounded-lg border px-2.5 py-1 text-[11px] font-mono transition ${
                activeShipment?.id === s.id
                  ? 'border-primary bg-primary/10 text-primary font-bold'
                  : 'border-border bg-background hover:bg-muted text-foreground'
              }`}
            >
              {s.id}
            </button>
          ))}
        </div>

        {/* Verified Consignment Result Card */}
        {activeShipment ? (
          <div className="mt-8 rounded-2xl border border-primary/40 bg-gradient-to-br from-card via-background to-primary/[0.03] p-6 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-mono text-base font-bold text-foreground">
                    {activeShipment.trackingNumber}
                  </span>
                  <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 uppercase">
                    Verified Authentic
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Consignment #{activeShipment.id} • Registered under Specie Escort Protocols
                </p>
              </div>

              <span className="rounded-lg bg-muted px-2.5 py-1 text-xs font-mono text-muted-foreground self-start sm:self-auto">
                Status: {activeShipment.intermediateStop?.status === 'active_stage'
                  ? 'Secured Holding in Transit'
                  : activeShipment.status}
              </span>
            </div>

            {/* Sanitized Public Specifications */}
            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Departure Facility
                </span>
                <p className="text-sm font-semibold text-foreground mt-0.5">
                  {activeShipment.origin.city} ({activeShipment.origin.code})
                </p>
                <p className="text-[11px] text-muted-foreground line-clamp-1 font-mono">
                  {activeShipment.origin.facility}
                </p>
              </div>

              <div className="sm:border-x sm:border-border sm:px-4">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Custodial Destination
                </span>
                <p className="text-sm font-semibold text-foreground mt-0.5">
                  {activeShipment.destination.city} ({activeShipment.destination.code})
                </p>
                <p className="text-[11px] text-muted-foreground line-clamp-1 font-mono">
                  {activeShipment.destination.facility}
                </p>
              </div>

              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Underwriting & Security
                </span>
                <p className="text-sm font-semibold text-foreground mt-0.5">
                  Lloyd's Specie Syndicate
                </p>
                <p className="text-[11px] text-muted-foreground font-mono">
                  Policy: {activeShipment.manifest.policyNumber}
                </p>
              </div>
            </div>

            {/* Encrypted Telemetry Barrier */}
            <div className="mt-6 rounded-xl border border-dashed border-primary/40 bg-primary/5 p-5 text-center">
              <Lock size={24} className="mx-auto text-primary mb-2" />
              <h3 className="font-serif text-base text-foreground font-normal">
                Live Movement Radar & Sensor Downlink Encrypted
              </h3>
              <p className="mx-auto mt-1 max-w-md text-xs text-muted-foreground leading-relaxed">
                Real-time overflight vectors, altitude, G-force shock readings, and optical tamper seal statuses are available only to the authenticated depositor in the Private Client Portal.
              </p>

              <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
                <Link
                  href="/portal"
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground hover:opacity-95 transition shadow-sm"
                >
                  <Key size={14} />
                  <span>Authenticate in Client Depository to Track Live Movement</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-8 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-xs text-destructive flex items-center gap-3">
            <AlertCircle size={18} className="shrink-0" />
            <div>
              <p className="font-semibold">Reference Not Recognized</p>
              <p className="mt-0.5 opacity-90">
                The reference code entered does not match active sovereign custody manifests. Please verify the code or contact your AurumVault officer.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Security Architecture Explainer */}
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-5 text-xs text-muted-foreground">
          <Shield size={18} className="text-primary mb-2" />
          <p className="font-semibold text-foreground text-sm mb-1">Dual-Custody Keying</p>
          <p className="leading-relaxed">
            All transit corridors enforce biometric dual custody. Neither couriers nor pilots can open casks unilaterally in flight.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 text-xs text-muted-foreground">
          <Plane size={18} className="text-primary mb-2" />
          <p className="font-semibold text-foreground text-sm mb-1">Chartered Specie Airspace</p>
          <p className="leading-relaxed">
            Consignments travel via designated diplomatic routes with real-time transponder encryption downlinked to Zurich/Geneva HQ.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 text-xs text-muted-foreground">
          <Award size={18} className="text-primary mb-2" />
          <p className="font-semibold text-foreground text-sm mb-1">LBMA Good Delivery</p>
          <p className="leading-relaxed">
            All vaulted bullion bars are assayed to 999.9 purity and certified with immutable SHA-256 chain-of-custody certificates.
          </p>
        </div>
      </div>
    </div>
  )
}
