'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useShipments } from '@/lib/shipments-context'
import { Shipment, VaultHolding } from '@/lib/types'
import { TrackingMap } from '@/components/tracking/tracking-map'
import { CustodyCertificateModal } from '@/components/tracking/custody-certificate-modal'
import { ClientNoticeModal } from '@/components/client/client-notice-modal'
import {
  Shield,
  Lock,
  Box,
  Plane,
  FileText,
  PlusCircle,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  Download,
  Building2,
  Calendar,
  LogOut,
  Sparkles,
  Search,
  Radio,
  Clock,
  Layers,
  Award,
  LayoutDashboard,
  Compass,
  Menu,
  X,
  ChevronRight,
  Key,
  User,
  ShieldCheck,
  TrendingUp,
  Activity,
  Printer,
  Coins,
} from 'lucide-react'
import Link from 'next/link'

type ClientViewTab = 'overview' | 'radar' | 'vault' | 'compliance' | 'booking'

export function ClientDashboard() {
  const { user, logout } = useAuth()
  const { shipments, vaultHoldings, setSelectedShipmentId, requestVaultTransit, addQuoteInquiry } = useShipments()

  const [activeTab, setActiveTab] = useState<ClientViewTab>('overview')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [selectedHoldingForBooking, setSelectedHoldingForBooking] = useState<VaultHolding | null>(null)
  const [activeCertificateShipment, setActiveCertificateShipment] = useState<Shipment | null>(null)
  const [noticeModalOpen, setNoticeModalOpen] = useState(false)
  const lastNoticeCloseTimestampRef = useRef<number>(0)

  const prevNoticeFingerprintRef = useRef<string | null>(null)

  // Automatically trigger modal when noticeActive is active or notice content updates
  useEffect(() => {
    if (user?.noticeActive) {
      const fingerprint = `${user.noticeActive}-${user.noticeTitle || ''}-${user.noticeMessage || ''}`
      if (prevNoticeFingerprintRef.current !== fingerprint) {
        setNoticeModalOpen(true)
        prevNoticeFingerprintRef.current = fingerprint
      }
    } else {
      setNoticeModalOpen(false)
      prevNoticeFingerprintRef.current = null
    }
  }, [user?.noticeActive, user?.noticeTitle, user?.noticeMessage])

  // When user opens the live radar page, allow the cockpit and live flight map to render first,
  // then pop up the notice modal smoothly right after the page opens!
  useEffect(() => {
    if (activeTab === 'radar' && user?.noticeActive) {
      const timer = setTimeout(() => {
        setNoticeModalOpen(true)
      }, 450)
      return () => clearTimeout(timer)
    }
  }, [activeTab, user?.noticeActive])

  // Centralized tab navigation handler:
  // When notice is active:
  // - The user CAN freely interact with the rest of the dashboard (overview, radar, telemetry, scrolling, logging out).
  // - The Live Radar page opens normally, with notice popping up 450ms after opening.
  // - BUT the 3 restricted menus ('vault', 'compliance', 'booking') DO NOT OPEN,
  //   and instead trigger the notice popup!
  const handleTabNavigation = (targetTab: ClientViewTab) => {
    if (user?.noticeActive && (targetTab === 'vault' || targetTab === 'compliance' || targetTab === 'booking')) {
      setNoticeModalOpen(true)
      return
    }

    if (user?.isDashboardLocked && targetTab !== activeTab) {
      return
    }

    setActiveTab(targetTab)
    setSidebarOpen(false)
  }

  const handleCloseNoticeModal = () => {
    lastNoticeCloseTimestampRef.current = Date.now()
    setNoticeModalOpen(false)
  }

  // Booking Form State
  const [bookingDestination, setBookingDestination] = useState('London (LBMA Vault Complex)')
  const [bookingNotes, setBookingNotes] = useState('')
  const [bookingSuccess, setBookingSuccess] = useState(false)

  // Filter client's specific shipments and vault holdings
  const clientShipments = shipments.filter(s => s.clientCode === user?.clientCode)
  const clientHoldings = vaultHoldings.filter(h => h.clientCode === user?.clientCode)

  // Dedicated active consignment for client - NEVER leaks another user's consignment!
  const userFallbackShipment: Shipment = {
    id: `GOLD-2026-${user?.clientCode?.replace(/[^A-Z0-9]/gi, '') || 'SECURE'}`,
    trackingNumber: user?.clientCode ? `AV-${user.clientCode}` : 'AV-PENDING-ALLOCATION',
    status: 'In Transit — Chartered Air-Specie Corridor',
    statusType: 'in-flight',
    category: 'Precious Metals & Bullion',
    origin: {
      city: 'Indiana',
      country: 'United States',
      facility: `State: Hanover. Pk. Illinois 1365. Fremont Dr. Zip code :60133. (Shipper: ${user?.name || 'Linda S Hudson'}, +1 470-305-9614)`,
      code: 'IND-ORD',
      coords: [41.9961, -88.1473],
    },
    destination: {
      city: 'Kentucky',
      country: 'United States',
      facility: '321 Pimlico Ct, Crittenden, KY 41030 (Receiver: Chris Bucksath, +1 859-907-3706)',
      code: 'KY-CVG',
      coords: [38.7845, -84.6063],
    },
    currentLocation: {
      name: 'Midwest Airspace Flight Corridor (FL280 • Heading 142°)',
      coords: [39.1031, -84.5120],
      statusText: 'Cruising FL280 • Chartered Air-Specie Convoy Flight',
    },
    eta: '17/09/26, 14:00 EDT',
    dispatchedAt: '14 Sep 2026, 08:30 CDT',
    progress: 55,
    transportMode: 'Chartered Air-Specie Flight (AV-US-93901)',
    carrierFlightNumber: 'AV-US-93901 / SPECIE-AIR',
    custodyOfficer: 'Chief Flight Marshal D. Miller (ID: #US-AIR-410)',
    clientCode: user?.clientCode,
    shipperName: user?.name || 'Linda S Hudson',
    shipperAddress: 'State: Hanover. Pk. Illinois 1365. Fremont Dr. Zip code :60133.',
    shipperPhone: '+1 (470) 305-9614',
    receiverName: 'Chris Bucksath',
    receiverContact: '+1 (859) 907-3706',
    receiverAddress: '321 Pimlico Ct Crittenden Ky 41030',
    shippingWeight: '93.9 g',
    checkpoints: [
      {
        id: `cp-auto-1`,
        timestamp: '14 Sep 2026, 08:30 CDT',
        title: 'Shipper Handover & Custody Seal Verification',
        location: 'Hanover Park, IL / Indiana Corridor',
        facility: 'State: Hanover. Pk. Illinois 1365. Fremont Dr. Zip code :60133.',
        status: 'completed',
        officer: 'Agent T. Vance (ID: #AV-CHI-992)',
        officerId: 'AV-CHI-992',
        sealId: `SEAL-${user?.clientCode || 'AV'}-A`,
        hash: 'SHA256:8f43b129a0e41b95b871c890226dfc2d4b1fa3d677284addd200126d9069',
        notes: `Precious bullion item received from shipper ${user?.name || 'Linda S Hudson'} (+1 470-305-9614). Calibrated weight confirmed at 93.9 g (3.019 ozt). Dual tamper-evident container locked.`,
      },
      {
        id: `cp-auto-2`,
        timestamp: '14 Sep 2026, 11:45 CDT',
        title: 'Airside Loading & Aircraft Specie Clearance',
        location: 'Midwest Regional Airside Apron',
        facility: 'VIP Air Cargo Apron Stand #4',
        status: 'completed',
        officer: 'Flight Security Lead K. Bennett',
        officerId: 'AV-AIR-301',
        sealId: `SEAL-${user?.clientCode || 'AV'}-B`,
        notes: 'Tamper seal intact. IoT electronic tracking beacon confirmed online. Specie cask locked in pressurized aircraft hold.',
      },
      {
        id: `cp-auto-3`,
        timestamp: '15 Sep 2026, 02:15 EDT',
        title: 'Airborne In-Flight Corridor Transit (FL280)',
        location: 'Midwest Regional Airspace',
        facility: 'Flight AV-SPECIE (Cruising FL280)',
        status: 'current',
        officer: 'Captain R. Vance & Marshal D. Miller',
        officerId: 'US-AIR-410',
        sealId: `AES-${user?.clientCode || 'AV'}-ACTIVE`,
        notes: 'Aircraft cruising at FL280 with active radar downlink. All environmental sensors nominal.',
      },
      {
        id: `cp-auto-4`,
        timestamp: '17 Sep 2026, 14:00 EDT (17/09/26)',
        title: 'CVG Airside Reception & Final Handover',
        location: 'Destination Sector ➔ Doorstep',
        facility: '321 Pimlico Ct, Crittenden, KY 41030',
        status: 'pending',
        officer: 'Designated Receiver: Chris Bucksath (+1 859-907-3706)',
        officerId: 'PENDING-VERIFICATION',
        notes: 'Dual photographic identification & biometric PIN signature required from receiver Chris Bucksath upon physical delivery handover.',
      },
    ],
    telemetry: {
      electronicSeal: {
        id: `AES-${user?.clientCode || 'AV'}-ACTIVE`,
        status: 'SECURE',
        battery: '99.4%',
        lastPing: '2 mins ago',
      },
      gForce: { current: 1.01, maxRecorded: 1.15, threshold: 3.5, unit: 'G' },
      lightExposure: { current: 0, status: 'SEALED_VAULT', unit: 'lux' },
      temperature: { current: 21.2, min: 19.5, max: 22.8, unit: '°C' },
      gps: {
        lat: 39.1031,
        lng: -84.5120,
        altitude: '28,000 ft',
        speed: '440 knots',
        satellites: 14,
        signalStrength: '99%',
        geofenceStatus: 'CORRIDOR_COMPLIANT',
      },
      escort: {
        code: 'ESC-US-410',
        unit: 'AurumVault Armed Air-Specie Courier Detail',
        protocol: 'Lloyd’s of London Air-Specie Protection Protocol Tier-II',
      },
    },
    manifest: {
      itemType: 'Precious Air-Specie Consignment',
      description: `Chartered Gold Specie Flight Package (Shipper: ${user?.name || 'Linda S Hudson'}, Receiver: Chris Bucksath)`,
      grossWeight: '93.9 g (3.019 ozt)',
      netFineWeight: '93.9 g Fine Specie',
      fineness: '999.9 / 1000 Au',
      sealNumber: `SEAL-${user?.clientCode || 'AV'}-A`,
      assayLab: 'Swiss Precious Metals & Assayer Certification',
      assayCertNumber: `ASSAY-${user?.clientCode || 'AV'}`,
      declaredValue: '$16,355.00 USD',
      underwriter: 'Lloyd’s of London Specie Syndicate #33',
      policyNumber: `LL-SPEC-${user?.clientCode || 'AV'}`,
      securityTier: 'TIER-II DUAL CUSTODY CHARTERED AIR-SPECIE TRANSIT',
    },
  }

  // Selected consignment for the Live Radar tab - NEVER fall back to another client's shipment!
  const [selectedConsignmentId, setSelectedConsignmentId] = useState<string>(
    clientShipments[0]?.id || ''
  )

  useEffect(() => {
    if (clientShipments.length > 0 && !clientShipments.some(s => s.id === selectedConsignmentId)) {
      setSelectedConsignmentId(clientShipments[0].id)
    }
  }, [clientShipments, selectedConsignmentId])

  const activeConsignment: Shipment =
    (clientShipments.length > 0
      ? clientShipments.find(s => s.id === selectedConsignmentId) || clientShipments[0]
      : userFallbackShipment)

  const displayShipments = clientShipments.length > 0 ? clientShipments : [userFallbackShipment]

  // Compute live portfolio metrics
  const totalFineOunces = clientHoldings.reduce((sum, h) => sum + h.weightOzt, 0)
  const totalVaultValueUSD = clientHoldings.reduce((sum, h) => sum + h.declaredValueUSD, 0)
  const activeConsignmentsValueUSD = displayShipments.reduce((sum, s) => {
    const val = parseFloat(s.manifest.declaredValue.replace(/[^0-9.]/g, ''))
    return sum + (isNaN(val) ? 0 : val)
  }, 0)
  const grandTotalValueUSD = totalVaultValueUSD + activeConsignmentsValueUSD

  const handleOpenBookingWithHolding = (holding: VaultHolding) => {
    if (user?.noticeActive) {
      setNoticeModalOpen(true)
      return
    }
    setSelectedHoldingForBooking(holding)
    setActiveTab('booking')
    setBookingNotes(`Priority transit for ${holding.assetTitle} (Assay Cert: ${holding.assayCertNumber}). Bar Serials: ${holding.barSerialNumbers.join(', ')}.`)
  }

  const handleExecuteBooking = (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedHoldingForBooking) {
      requestVaultTransit(
        selectedHoldingForBooking.id,
        bookingDestination,
        bookingNotes || 'Direct allocated transfer under insured specie protocols.'
      )
    } else {
      addQuoteInquiry({
        clientName: user?.name || 'Verified Client',
        email: user?.email || '',
        assetType: 'Precious Metals & Bullion',
        declaredValue: 2500000,
        originCity: 'Geneva Freeport',
        originCode: 'GVA-FP',
        destinationCity: bookingDestination,
        destinationCode: bookingDestination.slice(0, 3).toUpperCase() + '-SPEC',
        transitMode: 'Dedicated Chartered Aircraft / Armed Escort Detail',
        notes: bookingNotes || 'Custom specie transit inquiry initiated from Client Portal.',
      })
    }
    setBookingSuccess(true)
    setTimeout(() => {
      setBookingSuccess(false)
      setSelectedHoldingForBooking(null)
      setBookingNotes('')
      setActiveTab('vault')
    }, 2500)
  }

  const navMenuItems: { id: ClientViewTab; label: string; icon: React.ReactNode; badge?: string | number }[] = [
    { id: 'overview', label: 'Portfolio Overview', icon: <LayoutDashboard size={18} /> },
    {
      id: 'radar',
      label: 'Live Consignment Radar',
      icon: <Compass size={18} />,
      badge: clientShipments.filter(s => s.statusType === 'in-flight').length > 0 ? 'LIVE' : undefined,
    },
    { id: 'vault', label: 'Allocated Vault Holdings', icon: <Coins size={18} />, badge: clientHoldings.length },
    { id: 'compliance', label: 'Certificates & Compliance', icon: <Award size={18} /> },
    { id: 'booking', label: 'Book Specie Movement', icon: <PlusCircle size={18} /> },
  ]

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#0a0c10] text-[#f4f4f6] font-sans antialiased">
      {/* MOBILE SIDEBAR BACKDROP */}
      {sidebarOpen && (
        <div
          data-sidebar-backdrop="true"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-md lg:hidden transition-opacity duration-300"
        />
      )}

      {/* DEDICATED LUXURY SWISS CLIENT SIDEBAR */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 sm:w-80 flex-col border-r border-[#242833] bg-[#0e1117] transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Header with Gold Monogram */}
        <div className="flex items-center justify-between border-b border-[#242833] px-6 py-5 bg-[#0b0e14]">
          <Link href="/" className="flex items-center gap-3.5 group">
            <span className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-[#dfba6c] via-[#c29b43] to-[#916e25] text-black shadow-lg shadow-[#c29b43]/20 transition group-hover:scale-105">
              <Sparkles size={19} className="text-black" />
            </span>
            <div className="flex flex-col">
              <span className="font-serif text-xl font-bold tracking-tight text-white">
                Aurum<span className="text-[#dfba6c]">Vault</span>
              </span>
              <span className="text-[9px] uppercase tracking-[0.28em] text-[#dfba6c] font-mono -mt-0.5">
                Swiss Private Depository
              </span>
            </div>
          </Link>
          <button
            data-sidebar-toggle="true"
            onClick={() => setSidebarOpen(false)}
            className="rounded-lg p-1.5 text-gray-400 hover:text-white hover:bg-white/10 lg:hidden transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Depositor Identity Card */}
        <div className="p-5 border-b border-[#242833] bg-gradient-to-b from-[#141822] to-[#0e1117]">
          <div className="flex items-center gap-3.5">
            <div className="relative flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#dfba6c] to-[#a6802e] text-black text-sm font-bold shadow-md shrink-0">
              {user?.avatarInitials || 'AS'}
              <span className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full bg-emerald-500 ring-2 ring-[#0e1117]" />
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="rounded bg-[#dfba6c]/15 px-2 py-0.5 text-[9px] font-mono font-bold text-[#dfba6c]">
                  {user?.clientCode || 'CLIENT-VAULT'}
                </span>
                <span className="text-[10px] text-gray-400 font-mono truncate">
                  ALLOCATED
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-xl bg-[#090b0f] border border-[#262b38] p-3 shadow-inner">
            <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-gray-400 font-medium">
              <span>Custody Valuation</span>
              <span className="text-emerald-400 flex items-center gap-1 font-mono">
                <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                AUDITED
              </span>
            </div>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="font-serif text-lg sm:text-xl font-bold text-[#dfba6c]">
                ${grandTotalValueUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-[10px] font-mono text-gray-400 font-semibold">USD</span>
            </div>
          </div>
        </div>

        {/* Sidebar Navigation Menu */}
        <nav className="flex-1 space-y-1.5 overflow-y-auto p-4">
          <span className="px-3 text-[10px] font-semibold uppercase tracking-wider text-gray-500 block mb-2 font-mono">
            Depository Console
          </span>
          {navMenuItems.map(item => {
            const isActive = activeTab === item.id
            const isLocked = Boolean(user?.isDashboardLocked) && !isActive
            return (
              <button
                key={item.id}
                data-tab={item.id}
                disabled={isLocked}
                onClick={() => {
                  if (isLocked) return
                  handleTabNavigation(item.id)
                }}
                className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-xs sm:text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-[#dfba6c] to-[#c29b43] text-black font-bold shadow-lg shadow-[#c29b43]/20 scale-[1.02]'
                    : isLocked
                    ? 'text-gray-500 bg-[#12151c]/60 cursor-not-allowed opacity-60'
                    : 'text-gray-300 hover:bg-[#181d28] hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={isActive ? 'text-black' : isLocked ? 'text-gray-500' : 'text-[#dfba6c]'}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>
                {isLocked ? (
                  <span className="flex items-center gap-1 text-[10px] font-mono text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    <Lock size={11} />
                    <span>LOCKED</span>
                  </span>
                ) : item.badge ? (
                  <span
                    className={`rounded-full px-2 py-0.5 text-[9px] font-bold tracking-wider ${
                      isActive
                        ? 'bg-black/20 text-black font-extrabold'
                        : item.badge === 'LIVE'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 animate-pulse'
                        : 'bg-[#222736] text-gray-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                ) : null}
              </button>
            )
          })}
        </nav>

        {/* Sidebar Footer Controls */}
        <div className="border-t border-[#242833] p-4 space-y-3 bg-[#0a0d13]">

          <div className="flex items-center justify-between pt-1">
            <Link
              href="/"
              className="flex items-center gap-2 text-xs font-medium text-gray-400 hover:text-white transition py-1"
            >
              <ExternalLink size={14} className="text-[#dfba6c]" />
              <span>Public Website</span>
            </Link>

            <button
              data-signout="true"
              onClick={logout}
              className="flex items-center gap-1.5 text-xs font-medium text-red-400 hover:text-red-300 transition py-1 px-2 rounded-lg hover:bg-red-500/10"
            >
              <LogOut size={14} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT WORKSPACE */}
      <div className="flex flex-1 flex-col overflow-hidden bg-[#0a0c10]">
        {/* TOP COMMAND BAR */}
        <header className="sticky top-0 z-30 flex h-16 sm:h-20 items-center justify-between border-b border-[#242833] bg-[#0e1117]/90 px-4 sm:px-8 backdrop-blur-xl">
          <div className="flex items-center gap-3.5">
            <button
              data-sidebar-toggle="true"
              onClick={() => setSidebarOpen(true)}
              className="rounded-xl border border-[#2a2f3d] bg-[#141822] p-2.5 text-white lg:hidden hover:bg-[#1a202d] transition"
              aria-label="Open Navigation Menu"
            >
              <Menu size={20} />
            </button>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="font-serif text-lg sm:text-2xl font-bold text-white tracking-tight">
                  {navMenuItems.find(i => i.id === activeTab)?.label}
                </h2>
                <span className="hidden md:inline-flex items-center gap-1 rounded-full border border-[#dfba6c]/30 bg-[#dfba6c]/10 px-2.5 py-0.5 text-[10px] font-mono text-[#dfba6c] font-bold">
                  <ShieldCheck size={11} />
                  TIER-IV DEEP VAULT ALLOCATED
                </span>
              </div>
              <p className="text-[11px] text-gray-400 hidden sm:block font-mono mt-0.5">
                Geneva Freeport Vault B-12 • Swiss Secrecy Protocols • Lloyd's Cover #LL-9924-SPEC
              </p>
            </div>
          </div>

          {/* Right Header Actions & Live Metals Bar */}
          <div className="flex items-center gap-2.5 sm:gap-4">
            {/* Live Gold Spot Indicator */}
            <div className="hidden md:flex items-center gap-3 rounded-full border border-[#2a2f3d] bg-[#141822] px-4 py-1.5 text-xs font-mono shadow-sm">
              <span className="flex items-center gap-2 text-white font-semibold">
                <span className="size-2 rounded-full bg-[#dfba6c] animate-pulse" />
                XAU/USD $2,934.40
              </span>
              <span className="text-emerald-400 font-bold">▲ +0.48%</span>
            </div>

            <button
              disabled={Boolean(user?.isDashboardLocked)}
              onClick={() => {
                if (user?.isDashboardLocked) return
                handleTabNavigation('booking')
              }}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition shadow-lg ${
                user?.isDashboardLocked
                  ? 'bg-[#181d28] border border-amber-500/30 text-amber-300/80 cursor-not-allowed'
                  : 'bg-gradient-to-r from-[#dfba6c] to-[#c29b43] text-black hover:opacity-95 shadow-[#c29b43]/20'
              }`}
            >
              {user?.isDashboardLocked ? <Lock size={14} className="text-amber-400" /> : <PlusCircle size={15} />}
              <span className="hidden sm:inline">
                {user?.isDashboardLocked ? 'Movement Booking Locked' : 'Book Specie Movement'}
              </span>
              <span className="sm:hidden">{user?.isDashboardLocked ? 'Locked' : 'Book'}</span>
            </button>

            <button
              data-signout="true"
              onClick={logout}
              className="rounded-xl border border-[#2a2f3d] bg-[#141822] p-2 text-gray-400 hover:text-red-400 hover:border-red-500/30 transition"
              title="Sign Out Session"
            >
              <LogOut size={16} />
            </button>
          </div>
        </header>

        {/* WORKSPACE CANVAS SCROLLER */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
          {/* ADMINISTRATIVE LOCKDOWN WARNING BANNER */}
          {user?.isDashboardLocked && (
            <div className="max-w-7xl mx-auto rounded-2xl border border-amber-500/40 bg-gradient-to-r from-amber-500/15 via-[#181a20] to-[#12141a] p-4 sm:p-5 text-amber-200 shadow-2xl flex items-start gap-4">
              <div className="rounded-xl bg-amber-500/20 p-2.5 text-amber-300 border border-amber-500/30 shrink-0 mt-0.5">
                <Lock size={20} />
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-mono text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-amber-400 animate-ping" />
                    Sovereign Administrative Menu Lockdown Active
                  </span>
                  <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-200 font-semibold">
                    Enforced by Federal Operations Command (Geneva HQ)
                  </span>
                </div>
                <p className="text-xs text-amber-100/85 mt-1.5 leading-relaxed">
                  Dashboard navigation menus and transfer authorizations have been placed on administrative hold under Swiss Sovereign Specie Protocol. Tab switching and booking requests are restricted.
                </p>
              </div>
            </div>
          )}

          {/* TAB 1: PORTFOLIO OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6 max-w-7xl mx-auto">
              {/* Grand Luxury Hero Banner */}
              <div className="relative overflow-hidden rounded-3xl border border-[#dfba6c]/30 bg-gradient-to-br from-[#161a24] via-[#10131a] to-[#0b0e14] p-6 sm:p-10 shadow-2xl">
                <div className="absolute top-0 right-0 size-[400px] rounded-full bg-[radial-gradient(circle_at_70%_20%,rgba(223,186,108,0.15),transparent_70%)] pointer-events-none" />

                <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-[#dfba6c]/30 bg-[#dfba6c]/10 px-3 py-1 text-xs font-mono font-bold text-[#dfba6c] mb-3">
                      <ShieldCheck size={13} />
                      OFFICIAL PHYSICAL HOLDINGS LEDGER
                    </div>
                    <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight">
                      ${grandTotalValueUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      <span className="text-base sm:text-xl text-[#dfba6c] font-mono ml-2 font-normal">USD</span>
                    </h1>
                    <p className="mt-2 text-xs sm:text-sm text-gray-300 max-w-xl leading-relaxed">
                      Physical allocated gold bullion and rare museum horology masterworks vaulted on a numbered basis under Swiss sovereignty at the Geneva Freeport and Zurich Depository.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      onClick={() => handleTabNavigation('radar')}
                      className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#dfba6c] to-[#c29b43] px-5 py-3 text-xs sm:text-sm font-bold text-black hover:opacity-95 transition shadow-xl shadow-[#c29b43]/20"
                    >
                      <Compass size={16} />
                      <span>Live Radar Stream</span>
                      <ArrowUpRight size={15} />
                    </button>
                    <button
                      onClick={() => handleTabNavigation('booking')}
                      className="inline-flex items-center gap-2 rounded-xl border border-[#2a2f3d] bg-[#141822] px-4 py-3 text-xs sm:text-sm font-semibold text-white hover:bg-[#1a202d] transition"
                    >
                      <PlusCircle size={15} className="text-[#dfba6c]" />
                      <span>Request Transit</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* 4 Stat Highlights Grid */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-2xl border border-[#242833] bg-[#11141c] p-5 shadow-lg">
                  <div className="flex items-center justify-between text-gray-400 mb-2">
                    <span className="text-[11px] font-semibold uppercase tracking-wider font-mono">Fine Gold Weight</span>
                    <div className="rounded-lg bg-[#dfba6c]/10 p-2 text-[#dfba6c]">
                      <Coins size={18} />
                    </div>
                  </div>
                  <p className="font-serif text-2xl sm:text-3xl text-white font-bold">
                    {totalFineOunces.toLocaleString('en-US', { minimumFractionDigits: 2 })} <span className="text-xs font-sans text-gray-400 font-normal">ozt</span>
                  </p>
                  <p className="mt-1.5 text-xs text-gray-400 font-mono">
                    {((totalFineOunces * 31.1035) / 1000).toFixed(3)} kg 999.9 Good Delivery
                  </p>
                </div>

                <div className="rounded-2xl border border-[#242833] bg-[#11141c] p-5 shadow-lg">
                  <div className="flex items-center justify-between text-gray-400 mb-2">
                    <span className="text-[11px] font-semibold uppercase tracking-wider font-mono">Vaulted Lots</span>
                    <div className="rounded-lg bg-[#dfba6c]/10 p-2 text-[#dfba6c]">
                      <Building2 size={18} />
                    </div>
                  </div>
                  <p className="font-serif text-2xl sm:text-3xl text-white font-bold">
                    {clientHoldings.length} <span className="text-xs font-sans text-gray-400 font-normal">Audited Parcels</span>
                  </p>
                  <p className="mt-1.5 text-xs text-emerald-400 font-mono flex items-center gap-1">
                    <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Geneva & Zurich Vaults
                  </p>
                </div>

                <div className="rounded-2xl border border-[#242833] bg-[#11141c] p-5 shadow-lg">
                  <div className="flex items-center justify-between text-gray-400 mb-2">
                    <span className="text-[11px] font-semibold uppercase tracking-wider font-mono">Airborne In-Transit</span>
                    <div className="rounded-lg bg-[#dfba6c]/10 p-2 text-[#dfba6c]">
                      <Plane size={18} />
                    </div>
                  </div>
                  <p className="font-serif text-2xl sm:text-3xl text-white font-bold">
                    {clientShipments.filter(s => s.statusType === 'in-flight').length} <span className="text-xs font-sans text-gray-400 font-normal">Active Convoy</span>
                  </p>
                  <p className="mt-1.5 text-xs text-[#dfba6c] font-mono">
                    Cruising FL380 • Armed Escort
                  </p>
                </div>

                <div className="rounded-2xl border border-[#242833] bg-[#11141c] p-5 shadow-lg">
                  <div className="flex items-center justify-between text-gray-400 mb-2">
                    <span className="text-[11px] font-semibold uppercase tracking-wider font-mono">Lloyd's Underwriting</span>
                    <div className="rounded-lg bg-[#dfba6c]/10 p-2 text-[#dfba6c]">
                      <Shield size={18} />
                    </div>
                  </div>
                  <p className="font-serif text-2xl sm:text-3xl text-white font-bold">
                    100% <span className="text-xs font-sans text-emerald-400 font-semibold">Protected</span>
                  </p>
                  <p className="mt-1.5 text-xs text-gray-400 font-mono">
                    Zero Deductible Master Specie
                  </p>
                </div>
              </div>

              {/* Active Radar Teaser Banner */}
              {displayShipments.length > 0 && (
                <div className="rounded-3xl border border-[#dfba6c]/30 bg-[#12151e] p-6 sm:p-8 shadow-xl">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-[#242833] pb-6">
                    <div>
                      <div className="flex items-center gap-2.5 mb-1.5">
                        <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#dfba6c]">
                          Armed Specie Convoy Airborne
                        </span>
                        <span className="font-mono text-xs text-gray-400">
                          {displayShipments[0].trackingNumber}
                        </span>
                      </div>
                      <h3 className="font-serif text-xl sm:text-2xl font-bold text-white">
                        {displayShipments[0].origin.city} ({displayShipments[0].origin.code}) → {displayShipments[0].destination.city} ({displayShipments[0].destination.code})
                      </h3>
                      <p className="text-xs text-gray-300 mt-1 font-mono">
                        Flight {displayShipments[0].carrierFlightNumber || 'AV-US-93901'} • Senior Escort {displayShipments[0].custodyOfficer.split('(')[0].trim()} • ETA: {displayShipments[0].eta}
                      </p>
                    </div>

                    <button
                      onClick={() => handleTabNavigation('radar')}
                      className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#dfba6c] to-[#c29b43] px-5 py-3 text-xs sm:text-sm font-bold text-black hover:opacity-95 transition shadow-lg shadow-[#c29b43]/20 shrink-0 self-start md:self-auto"
                    >
                      <Compass size={16} />
                      <span>Open Interactive Radar</span>
                      <ArrowUpRight size={15} />
                    </button>
                  </div>

                  {/* Visual Timeline Progress */}
                  <div className="mt-6">
                    <div className="flex items-center justify-between text-xs font-mono text-gray-400 mb-2">
                      <span>Origin: {displayShipments[0].origin.facility}</span>
                      <span className="text-[#dfba6c] font-bold">{displayShipments[0].progress}% Handover Progress</span>
                      <span>Dest: {displayShipments[0].destination.facility}</span>
                    </div>
                    <div className="h-2.5 w-full rounded-full bg-[#1e2330] overflow-hidden p-0.5">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#dfba6c] to-[#c29b43] transition-all duration-700 shadow-sm"
                        style={{ width: `${displayShipments[0].progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Grid: Holdings & Compliance Snapshot */}
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Vault Holdings Snapshot */}
                <div className="rounded-3xl border border-[#242833] bg-[#11141c] p-6 shadow-xl">
                  <div className="flex items-center justify-between mb-5 border-b border-[#242833] pb-4">
                    <div>
                      <h3 className="font-serif text-lg font-bold text-white">
                        Allocated Bullion Holdings
                      </h3>
                      <p className="text-xs text-gray-400">Audited bar serial numbers in custody</p>
                    </div>
                    <button
                      onClick={() => handleTabNavigation('vault')}
                      className="text-xs font-mono text-[#dfba6c] hover:underline font-bold"
                    >
                      View All ({clientHoldings.length}) →
                    </button>
                  </div>

                  <div className="space-y-3.5">
                    {clientHoldings.slice(0, 3).map(holding => (
                      <div
                        key={holding.id}
                        className="rounded-2xl border border-[#242833] bg-[#161a24] p-4 text-xs transition hover:border-[#dfba6c]/50"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-bold text-white text-sm">{holding.assetTitle}</p>
                            <p className="text-gray-400 font-mono text-[11px] mt-0.5">
                              {holding.hallmark} • {holding.vaultFacility}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="font-serif text-base font-bold text-[#dfba6c] block">
                              ${holding.declaredValueUSD.toLocaleString()} USD
                            </span>
                            <span className="rounded bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[9px] font-mono text-emerald-400 font-bold">
                              {holding.status}
                            </span>
                          </div>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-1 border-t border-[#222736] pt-2.5">
                          {holding.barSerialNumbers.slice(0, 3).map(s => (
                            <span key={s} className="rounded bg-[#0e1117] border border-[#262b38] px-2 py-0.5 text-[10px] font-mono text-gray-300">
                              {s}
                            </span>
                          ))}
                          {holding.barSerialNumbers.length > 3 && (
                            <span className="text-[10px] font-mono text-gray-500 self-center">
                              +{holding.barSerialNumbers.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Compliance & Security Dossier */}
                <div className="rounded-3xl border border-[#242833] bg-[#11141c] p-6 shadow-xl">
                  <div className="flex items-center justify-between mb-5 border-b border-[#242833] pb-4">
                    <div>
                      <h3 className="font-serif text-lg font-bold text-white">
                        Custody & Insurance Dossier
                      </h3>
                      <p className="text-xs text-gray-400">Master specie underwriting agreement</p>
                    </div>
                    <button
                      onClick={() => handleTabNavigation('compliance')}
                      className="text-xs font-mono text-[#dfba6c] hover:underline font-bold"
                    >
                      Audit Archive →
                    </button>
                  </div>

                  <div className="space-y-3.5 text-xs text-gray-300">
                    <div className="rounded-2xl border border-[#242833] bg-[#161a24] p-4">
                      <div className="flex items-center gap-2 text-white font-bold text-sm">
                        <ShieldCheck size={16} className="text-[#dfba6c]" />
                        Lloyd's of London Specie Underwriting
                      </div>
                      <p className="mt-1 text-gray-400 text-xs leading-relaxed">
                        Master Specie Cargo Policy #LL-9924-SPEC. Insures full declared replacement values in transit and subterranean static vaulting with zero client deductible.
                      </p>
                      <div className="mt-3 flex items-center justify-between border-t border-[#242833] pt-2.5 font-mono text-[11px]">
                        <span className="text-gray-400">Syndicate Limit: $100M USD</span>
                        <span className="text-emerald-400 font-bold">● ACTIVE & SECURED</span>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-[#242833] bg-[#161a24] p-4">
                      <div className="flex items-center gap-2 text-white font-bold text-sm">
                        <Award size={16} className="text-[#dfba6c]" />
                        LBMA Good Delivery Standard
                      </div>
                      <p className="mt-1 text-gray-400 text-xs leading-relaxed">
                        All vaulted bullion bars are assayed to 999.9 fine purity and hallmarked by accredited Swiss melters and assayers (Argor-Heraeus SA, Valcambi Suisse).
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: LIVE CONSIGNMENT RADAR (INSTRUMENT COCKPIT) */}
          {activeTab === 'radar' && (
            <div className="space-y-6 max-w-7xl mx-auto">
              {/* Sovereign Notice Alert Banner on Radar Cockpit */}
              {user?.noticeActive && (
                <div className="rounded-3xl border-2 border-amber-500/40 bg-amber-950/25 p-5 sm:p-6 shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in">
                  <div className="flex items-start sm:items-center gap-3.5">
                    <div className="size-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0 shadow-sm">
                      <AlertTriangle size={20} className="animate-pulse" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-amber-500/20 border border-amber-500/30 px-2 py-0.5 text-[9px] font-mono font-bold text-amber-300 uppercase tracking-wider">
                          CARGO TRANSIT RESTRICTION
                        </span>
                        <span className="font-mono text-xs font-bold text-white">
                          {user.noticeTitle || 'SHIPMENT PROCESSING NOTICE'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-300 font-medium mt-1 line-clamp-2 leading-relaxed">
                        {user.noticeMessage || 'A total fee of US$3,400 is stated for final inspection, processing, and completion of doorstep delivery of the gold consignment. Payment instructions are to be issued separately.'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setNoticeModalOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#dfba6c] to-[#c29b43] px-4 py-2.5 text-xs font-bold text-black hover:opacity-95 transition shrink-0 font-mono shadow-md"
                  >
                    <span>Inspect Full Directive</span>
                    <ArrowUpRight size={14} />
                  </button>
                </div>
              )}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="font-serif text-2xl sm:text-3xl font-bold text-white tracking-tight">
                    Live Sovereign Air-Specie Radar
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-400 font-mono">
                    Real-time flight vector tracking, dynamic tangent heading, and active sensor downlinks.
                  </p>
                </div>

                {/* Multiple Consignments Switcher */}
                {clientShipments.length > 1 && (
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-gray-400 font-mono">Consignment:</label>
                    <select
                      value={selectedConsignmentId}
                      onChange={e => setSelectedConsignmentId(e.target.value)}
                      className="rounded-xl border border-[#242833] bg-[#141822] px-3.5 py-2 text-xs font-mono text-white focus:border-[#dfba6c] focus:outline-none"
                    >
                      {clientShipments.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.trackingNumber} ({s.origin.city} → {s.destination.city})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* EMBEDDED REAL-TIME RADAR DISPLAY */}
              <div className="rounded-3xl border border-[#242833] bg-[#11141c] p-4 sm:p-7 shadow-2xl">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-4 border-b border-[#242833] pb-5">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="size-3 rounded-full bg-emerald-400 animate-pulse ring-4 ring-emerald-500/20" />
                      <span className="font-mono text-base sm:text-lg font-bold text-white">
                        {activeConsignment.trackingNumber}
                      </span>
                      <span className="rounded-full bg-blue-500/15 border border-blue-500/30 px-3 py-0.5 text-xs font-mono font-bold text-blue-400 uppercase">
                        {activeConsignment.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1 font-mono">
                      {activeConsignment.manifest.itemType} • Escort Detail: {activeConsignment.custodyOfficer.split('(')[0].trim()}
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      if (user?.noticeActive) {
                        setNoticeModalOpen(true)
                        return
                      }
                      if (user?.isCertificateLocked) return
                      setActiveCertificateShipment(activeConsignment)
                    }}
                    className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-bold transition shadow-md ${
                      user?.isCertificateLocked
                        ? 'border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20'
                        : 'border-[#2a2f3d] bg-[#161a24] text-[#dfba6c] hover:bg-[#1f2433]'
                    }`}
                  >
                    {user?.isCertificateLocked ? <Lock size={15} className="text-red-400" /> : <Printer size={15} />}
                    <span>
                      {user?.isCertificateLocked
                        ? 'Certificate Access Locked by Operations'
                        : 'Print Chain of Custody Certificate'}
                    </span>
                  </button>
                </div>

                {/* THE RADAR SCREEN */}
                <div className="rounded-2xl overflow-hidden border border-[#242833] bg-black shadow-inner">
                  <TrackingMap shipment={activeConsignment} showAdminControls={false} />
                </div>

                {/* Heads-up Sensor Telemetry Gauges */}
                <div className="mt-6 grid gap-4 sm:grid-cols-3">
                  <div className="rounded-2xl border border-[#242833] bg-[#161a24] p-4 shadow-md">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-gray-400 block mb-2">
                      Electronic IoT Tamper Seal
                    </span>
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Hardware ID:</span>
                        <span className="font-mono font-bold text-white">
                          {activeConsignment.telemetry.electronicSeal.id}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Status:</span>
                        <span className="font-bold text-emerald-400 flex items-center gap-1 font-mono">
                          <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          {activeConsignment.telemetry.electronicSeal.status}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Optic Exposure:</span>
                        <span className="font-mono text-white">
                          {activeConsignment.telemetry.lightExposure.current} lux (Vault Sealed)
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-[#242833] bg-[#161a24] p-4 shadow-md">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-gray-400 block mb-2">
                      Flight Escort & Convoy
                    </span>
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Officer Lead:</span>
                        <span className="font-semibold text-white">
                          {activeConsignment.custodyOfficer.split('(')[0].trim()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Carrier / Call:</span>
                        <span className="font-mono text-white">
                          {activeConsignment.carrierFlightNumber || activeConsignment.transportMode}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Security Protocol:</span>
                        <span className="text-gray-300">
                          {activeConsignment.telemetry.escort.protocol}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-[#242833] bg-[#161a24] p-4 shadow-md">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-gray-400 block mb-2">
                      Lloyd's Specie Underwriting
                    </span>
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Declared Value:</span>
                        <span className="font-serif font-bold text-[#dfba6c] text-sm">
                          {activeConsignment.manifest.declaredValue}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Policy Number:</span>
                        <span className="font-mono text-gray-300">
                          {activeConsignment.manifest.policyNumber}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Assay Cert:</span>
                        <span className="font-mono text-gray-300">
                          {activeConsignment.manifest.assayCertNumber}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ALLOCATED VAULT HOLDINGS */}
          {activeTab === 'vault' && (
            <div className="space-y-6 max-w-7xl mx-auto">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="font-serif text-2xl sm:text-3xl font-bold text-white tracking-tight">
                    Allocated Bullion Depository
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-400 font-mono">
                    Numbered gold bullion cast bars and complications held under Swiss property law.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-3.5 py-1 text-xs font-mono font-bold text-emerald-400">
                    ● 100% AUDITED & PHYSICAL
                  </span>
                </div>
              </div>

              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {clientHoldings.map(holding => (
                  <div
                    key={holding.id}
                    className="flex flex-col justify-between rounded-3xl border border-[#242833] bg-gradient-to-br from-[#141822] via-[#11141c] to-[#0e1117] p-6 shadow-xl transition-all duration-300 hover:border-[#dfba6c]/60 hover:-translate-y-1"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <span className="rounded-lg bg-[#1b202d] border border-[#2a2f3d] px-2.5 py-1 text-[11px] font-mono text-[#dfba6c] font-bold">
                          {holding.id}
                        </span>
                        <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider ${
                          holding.status === 'Vaulted'
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                        }`}>
                          {holding.status}
                        </span>
                      </div>

                      <h3 className="font-serif text-lg font-bold text-white leading-snug">
                        {holding.assetTitle}
                      </h3>
                      <p className="mt-1 text-xs text-gray-400 font-mono">
                        {holding.hallmark} • {holding.fineness}
                      </p>

                      <div className="mt-5 space-y-2 rounded-2xl bg-[#0a0c10] border border-[#202533] p-4 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400">Fine Weight:</span>
                          <strong className="font-mono text-white font-bold">{holding.weightOzt.toLocaleString()} ozt</strong>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400">Gross Weight:</span>
                          <strong className="font-mono text-white">{holding.grossWeightKg.toFixed(3)} kg</strong>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400">Vault Location:</span>
                          <span className="text-right text-gray-200 font-medium">{holding.vaultCity}</span>
                        </div>
                        <div className="flex items-center justify-between border-t border-[#202533] pt-2">
                          <span className="text-gray-400">Valuation:</span>
                          <span className="font-serif text-base font-bold text-[#dfba6c]">
                            ${holding.declaredValueUSD.toLocaleString()} USD
                          </span>
                        </div>
                      </div>

                      {/* Bar Serial Numbers Chips */}
                      <div className="mt-4">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-gray-400 block mb-1.5">
                          Audited Serial Numbers:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {holding.barSerialNumbers.map(serial => (
                            <span
                              key={serial}
                              className="rounded-md bg-[#161a24] border border-[#262b38] px-2 py-0.5 text-[10px] font-mono text-gray-300"
                            >
                              {serial}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 border-t border-[#242833] pt-4">
                      <button
                        onClick={() => handleOpenBookingWithHolding(holding)}
                        disabled={holding.status === 'Allocated For Transit'}
                        className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#dfba6c] bg-[#dfba6c]/10 py-2.5 text-xs font-bold text-[#dfba6c] transition hover:bg-[#dfba6c] hover:text-black disabled:opacity-40"
                      >
                        <PlusCircle size={15} />
                        <span>
                          {holding.status === 'Allocated For Transit' ? 'In Transit Processing' : 'Request Armored Extraction'}
                        </span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: CERTIFICATES & COMPLIANCE */}
          {activeTab === 'compliance' && (
            <div className="space-y-6 max-w-7xl mx-auto">
              <div>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-white tracking-tight">
                  Custody & Provenance Archive
                </h2>
                <p className="text-xs sm:text-sm text-gray-400 font-mono">
                  LBMA Good Delivery certificates, Lloyd's of London master specie policies, and signed audit sheets.
                </p>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="rounded-3xl border border-[#242833] bg-[#11141c] p-6 shadow-xl">
                  <div className="flex items-center gap-3.5 mb-4">
                    <div className="rounded-2xl bg-[#dfba6c]/10 p-3 text-[#dfba6c]">
                      <Shield size={24} />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">
                        Lloyd's of London Specie Policy #LL-9924-SPEC
                      </h3>
                      <p className="text-xs text-gray-400 font-mono">Master Cargo Specie Syndicate Cover</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-300 leading-relaxed">
                    Full-value all-risks physical loss and damage coverage in transit and static depository vaulting. Zero client deductible, covering up to $100,000,000 USD per convoy.
                  </p>
                  <div className="mt-5 flex items-center justify-between border-t border-[#242833] pt-3 text-xs font-mono">
                    <span className="text-gray-400">Period: 2026–2027</span>
                    <span className="font-bold text-emerald-400">● ACTIVE & SECURED</span>
                  </div>
                </div>

                <div className="rounded-3xl border border-[#242833] bg-[#11141c] p-6 shadow-xl">
                  <div className="flex items-center gap-3.5 mb-4">
                    <div className="rounded-2xl bg-[#dfba6c]/10 p-3 text-[#dfba6c]">
                      <Award size={24} />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">
                        LBMA Responsible Gold Guidance (RGG v9)
                      </h3>
                      <p className="text-xs text-gray-400 font-mono">OECD Due Diligence & Purity Standard</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-300 leading-relaxed">
                    All physical bars are sourced from LBMA Good Delivery accredited refiners (Argor-Heraeus, Valcambi, PAMP) with verified conflict-free provenance certificates.
                  </p>
                  <div className="mt-5 flex items-center justify-between border-t border-[#242833] pt-3 text-xs font-mono">
                    <span className="text-gray-400">Purity Standard: 999.9 Fine</span>
                    <span className="font-bold text-[#dfba6c]">LONDON GOOD DELIVERY</span>
                  </div>
                </div>
              </div>

              {/* Itemized Consignment Documents */}
              <div className="rounded-3xl border border-[#242833] bg-[#11141c] p-6 shadow-xl">
                <h3 className="font-serif text-lg font-bold text-white mb-1">
                  Registered Consignment Custody Certificates
                </h3>
                <p className="text-xs text-gray-400 mb-5 font-mono">
                  Cryptographically verified dual-custody certificates for all client movements:
                </p>

                <div className="divide-y divide-[#242833]">
                  {clientShipments.map(shipment => (
                    <div key={shipment.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="flex items-center gap-2.5">
                          <span className="font-mono text-sm font-bold text-white">
                            {shipment.trackingNumber}
                          </span>
                          <span className="text-xs text-gray-400">
                            • {shipment.origin.city} → {shipment.destination.city}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 font-mono mt-1">
                          Assay Cert: {shipment.manifest.assayCertNumber} | Seal: {shipment.telemetry.electronicSeal.id}
                        </p>
                      </div>

                      <button
                        onClick={() => setActiveCertificateShipment(shipment)}
                        className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-xs font-bold transition self-start sm:self-auto ${
                          user?.isCertificateLocked
                            ? 'border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20'
                            : 'border-[#2a2f3d] bg-[#161a24] text-[#dfba6c] hover:bg-[#1e2330]'
                        }`}
                      >
                        {user?.isCertificateLocked ? <Lock size={14} className="text-red-400" /> : <Printer size={14} />}
                        <span>
                          {user?.isCertificateLocked
                            ? 'Certificate Locked by Operations'
                            : 'Print Official Certificate'}
                        </span>
                        <ArrowUpRight size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: BOOK SPECIE MOVEMENT */}
          {activeTab === 'booking' && (
            <div className="max-w-3xl mx-auto space-y-6">
              <div>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-white tracking-tight">
                  Book Armored Specie Movement
                </h2>
                <p className="text-xs sm:text-sm text-gray-400 font-mono">
                  Request secure vault extraction or cross-border transport under diplomatic escort protocols.
                </p>
              </div>

              {bookingSuccess && (
                <div className="flex items-start gap-3.5 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-5 text-emerald-300">
                  <CheckCircle2 size={22} className="shrink-0 text-emerald-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-white">Movement Order Dispatched to HQ</p>
                    <p className="text-xs mt-1 text-emerald-200 leading-relaxed">
                      AurumVault Specie Operations has received your transfer order. Chief Marshal Henri Weber will review and assign an armored escort detail within 30 minutes.
                    </p>
                  </div>
                </div>
              )}

              <form onSubmit={handleExecuteBooking} className="rounded-3xl border border-[#242833] bg-[#11141c] p-6 sm:p-8 shadow-2xl space-y-6">
                {selectedHoldingForBooking && (
                  <div className="rounded-2xl border border-[#dfba6c]/40 bg-[#dfba6c]/10 p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#dfba6c]">
                        Selected Holding For Extraction:
                      </span>
                      <button
                        type="button"
                        onClick={() => setSelectedHoldingForBooking(null)}
                        className="text-[11px] text-gray-400 hover:text-white underline"
                      >
                        Clear Selection
                      </button>
                    </div>
                    <p className="font-serif text-lg text-white font-bold mt-1">
                      {selectedHoldingForBooking.assetTitle}
                    </p>
                    <p className="text-xs text-gray-300 font-mono mt-0.5">
                      Vault: {selectedHoldingForBooking.vaultFacility} • Value: ${selectedHoldingForBooking.declaredValueUSD.toLocaleString()} USD
                    </p>
                  </div>
                )}

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-mono font-bold uppercase tracking-wider text-gray-400 mb-2">
                      Authorized Depositor
                    </label>
                    <input
                      type="text"
                      disabled
                      value={`${user?.name} (${user?.clientCode})`}
                      className="w-full rounded-xl border border-[#242833] bg-[#0c0e14] px-4 py-3 text-xs text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono font-bold uppercase tracking-wider text-gray-400 mb-2">
                      Authorized Contact
                    </label>
                    <input
                      type="text"
                      disabled
                      value={user?.email || ''}
                      className="w-full rounded-xl border border-[#242833] bg-[#0c0e14] px-4 py-3 text-xs text-white font-mono"
                    />
                  </div>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-mono font-bold uppercase tracking-wider text-gray-400 mb-2">
                      Departure Facility
                    </label>
                    <input
                      type="text"
                      disabled
                      value={selectedHoldingForBooking ? selectedHoldingForBooking.vaultFacility : 'Geneva Freeport Deep Depository Tier-IV'}
                      className="w-full rounded-xl border border-[#242833] bg-[#0c0e14] px-4 py-3 text-xs text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono font-bold uppercase tracking-wider text-gray-400 mb-2">
                      Destination Vault
                    </label>
                    <select
                      value={bookingDestination}
                      onChange={e => setBookingDestination(e.target.value)}
                      className="w-full rounded-xl border border-[#242833] bg-[#161a24] px-4 py-3 text-xs text-white font-mono focus:border-[#dfba6c] focus:outline-none"
                    >
                      <option value="London (LBMA Vault Complex)">London (LBMA Vault Complex)</option>
                      <option value="Zurich Kloten Safe Depository">Zurich Kloten Safe Depository</option>
                      <option value="Singapore Freeport (Changi Airside)">Singapore Freeport (Changi Airside)</option>
                      <option value="Dubai Multi Commodities Centre (DMCC)">Dubai Multi Commodities Centre (DMCC)</option>
                      <option value="New York Federal Reserve Depository">New York Federal Reserve Depository</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold uppercase tracking-wider text-gray-400 mb-2">
                    Special Escort & Custody Instructions
                  </label>
                  <textarea
                    rows={3}
                    value={bookingNotes}
                    onChange={e => setBookingNotes(e.target.value)}
                    placeholder="Specify tamper seal requirements, nitrogen-purged cask preferences, or VIP ramp handover detail..."
                    className="w-full rounded-xl border border-[#242833] bg-[#161a24] p-4 text-xs text-white placeholder:text-gray-500 focus:border-[#dfba6c] focus:outline-none"
                  />
                </div>

                <div className="border-t border-[#242833] pt-5">
                  <button
                    type="submit"
                    className="flex w-full items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-[#dfba6c] to-[#c29b43] py-3.5 text-xs sm:text-sm font-bold text-black hover:opacity-95 transition shadow-xl shadow-[#c29b43]/20"
                  >
                    <Lock size={16} />
                    <span>Submit Signed Armored Transit Order</span>
                    <ArrowUpRight size={16} />
                  </button>
                </div>
              </form>
            </div>
          )}
        </main>
      </div>

      {/* Custody Certificate Modal */}
      {activeCertificateShipment && (
        <CustodyCertificateModal
          shipment={activeCertificateShipment}
          isOpen={!!activeCertificateShipment}
          onClose={() => setActiveCertificateShipment(null)}
          isLocked={Boolean(user?.isCertificateLocked)}
        />
      )}

      {/* Sovereign Client Notice Modal */}
      {(() => {
        let recipient = activeConsignment.receiverName || user?.name || 'Chris Bucksath'
        if (!activeConsignment.receiverName && activeConsignment?.destination?.facility && activeConsignment.destination.facility.includes('Receiver:')) {
          const match = activeConsignment.destination.facility.match(/Receiver:\s*([^,)]+)/i)
          if (match && match[1]) recipient = match[1].trim()
        }

        return (
          <ClientNoticeModal
            isOpen={noticeModalOpen && Boolean(user?.noticeActive)}
            onClose={handleCloseNoticeModal}
            title={user?.noticeTitle}
            message={user?.noticeMessage}
            clientName={activeConsignment.shipperName || user?.name}
            clientCode={user?.clientCode}
            recipientName={recipient}
          />
        )
      })()}
    </div>
  )
}
