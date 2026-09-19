'use client'

import { useState, useEffect, useRef } from 'react'
import { Shipment } from '@/lib/types'
import {
  Plane,
  Truck,
  Building2,
  CheckCircle2,
  Shield,
  ShieldCheck,
  Radio,
  Navigation,
  Compass,
  Play,
  Pause,
  RotateCcw,
  Gauge,
  Activity,
  Sliders,
  Lock,
  Award,
} from 'lucide-react'

interface TrackingMapProps {
  shipment: Shipment
  showAdminControls?: boolean
  onProgressChange?: (newProgress: number) => void
  onPlayPauseChange?: (isPlaying: boolean) => void
  onSpeedChange?: (speed: 1 | 4 | 10) => void
}

export function TrackingMap({
  shipment,
  showAdminControls = false,
  onProgressChange,
  onPlayPauseChange,
  onSpeedChange,
}: TrackingMapProps) {
  // Respect server-synchronized pause and speed states
  const [localIsPlaying, setLocalIsPlaying] = useState(
    shipment.isPaused !== undefined ? !shipment.isPaused : true
  )
  const isPlaying = shipment.isPaused !== undefined ? !shipment.isPaused : localIsPlaying

  const [localSpeedMultiplier, setLocalSpeedMultiplier] = useState<1 | 4 | 10>(
    (shipment.speedMultiplier as 1 | 4 | 10) || 1
  )
  const speedMultiplier = (shipment.speedMultiplier as 1 | 4 | 10) || localSpeedMultiplier

  // Determine Operational Mission Stage
  const statusLower = (shipment.status || '').toLowerCase()
  const statusType = shipment.statusType

  const isDelivered = statusType === 'delivered' || statusLower.includes('deliver')
  const isCustoms = statusType === 'customs' || statusLower.includes('custom')
  const isStaged = statusType === 'staging' || statusLower.includes('staging')
  const isConvoy = statusLower.includes('convoy') || statusLower.includes('ground') || statusLower.includes('armored')
  const isAirborne = !isDelivered && !isCustoms && !isStaged && !isConvoy

  // Calculate target progress from operational stage
  const getTargetProgress = (): number => {
    if (isDelivered) return 1.0
    if (isCustoms) return Math.max(0.85, (shipment.progress ?? 85) / 100)
    if (isStaged) return Math.min(0.15, (shipment.progress ?? 15) / 100)
    if (isConvoy) return Math.max(0.20, Math.min(0.50, (shipment.progress ?? 35) / 100))
    return Math.max(0.05, Math.min(0.95, (shipment.progress ?? 60) / 100))
  }

  // Progress ratio 0.0 to 1.0 based on current shipment state
  const [progress, setProgress] = useState(getTargetProgress)
  const [telemetryJitter, setTelemetryJitter] = useState({ altJitter: 0, spdJitter: 0 })

  // Synchronize progress immediately when external shipment updates or stage changes
  useEffect(() => {
    setProgress(getTargetProgress())
  }, [shipment.progress, shipment.id, shipment.status, isDelivered, isCustoms, isStaged, isConvoy])

  useEffect(() => {
    if (shipment.isPaused !== undefined) {
      setLocalIsPlaying(!shipment.isPaused)
    }
  }, [shipment.isPaused])

  useEffect(() => {
    if (shipment.speedMultiplier) {
      setLocalSpeedMultiplier(shipment.speedMultiplier as 1 | 4 | 10)
    }
  }, [shipment.speedMultiplier])

  // Continuous animation loop for real-time simulation
  const lastTimeRef = useRef<number | null>(null)

  useEffect(() => {
    // When paused or when static stages are active:
    // Keep vehicle anchored strictly at its authentic progress location!
    if (!isPlaying || isDelivered || isStaged || isCustoms) {
      lastTimeRef.current = null
      return
    }

    let animationFrameId: number

    const step = (timestamp: number) => {
      if (lastTimeRef.current === null) {
        lastTimeRef.current = timestamp
      }

      const deltaMs = Math.min(timestamp - lastTimeRef.current, 100) // cap to prevent large jumps on tab refocus
      lastTimeRef.current = timestamp

      // Real-time advance rate (smooth 60fps translation along bezier curve)
      const speedRate = (0.012 * speedMultiplier * deltaMs) / 1000

      setProgress(prev => {
        let next = prev + speedRate
        if (next >= 0.98) {
          next = 0.05
        }
        return next
      })

      animationFrameId = requestAnimationFrame(step)
    }

    animationFrameId = requestAnimationFrame(step)
    return () => cancelAnimationFrame(animationFrameId)
  }, [isPlaying, speedMultiplier, isDelivered, isStaged, isCustoms])

  // Periodic sensor telemetry jitter for realistic avionics / transponder ping
  useEffect(() => {
    const interval = setInterval(() => {
      setTelemetryJitter({
        altJitter: Math.floor((Math.random() - 0.5) * 40),
        spdJitter: Math.floor((Math.random() - 0.5) * 6),
      })
    }, 1500)
    return () => clearInterval(interval)
  }, [])

  // Quadratic Bezier Curve Geometry: P0=(50, 45), P1=(300, -15), P2=(550, 45)
  const p0 = { x: 50, y: 45 }
  const p1 = { x: 300, y: -15 }
  const p2 = { x: 550, y: 45 }

  const t = Math.max(0.01, Math.min(0.99, progress))

  // Position on Bezier curve
  const currentX = (1 - t) * (1 - t) * p0.x + 2 * (1 - t) * t * p1.x + t * t * p2.x
  const currentY = (1 - t) * (1 - t) * p0.y + 2 * (1 - t) * t * p1.y + t * t * p2.y

  // Tangent angle
  const dx = 2 * (1 - t) * (p1.x - p0.x) + 2 * t * (p2.x - p1.x)
  const dy = 2 * (1 - t) * (p1.y - p0.y) + 2 * t * (p2.y - p1.y)
  const tangentAngle = (Math.atan2(dy, dx) * 180) / Math.PI

  // Dynamic Geographic Coordinates interpolation
  const currentLat = shipment.origin.coords[0] + t * (shipment.destination.coords[0] - shipment.origin.coords[0])
  const currentLng = shipment.origin.coords[1] + t * (shipment.destination.coords[1] - shipment.origin.coords[1])

  // Dynamic Stage Persona, Readouts & Telemetry Branding
  let stageConfig = {
    modeTitle: 'SOVEREIGN CHARTERED AIR-SPECIE CORRIDOR',
    modeSubtitle: 'Dedicated air corridor flight transit with active transponder downlink',
    statusBadge: 'AIRBORNE IN-TRANSIT',
    badgeColor: 'text-[#dfba6c] bg-[#dfba6c]/15 border-[#dfba6c]/30',
    altitude: '28,000 ft (Cruising FL280)',
    speed: `${440 + telemetryJitter.spdJitter} kts (Chartered Flight)`,
    iconType: 'plane' as 'plane' | 'convoy' | 'staging' | 'customs' | 'delivered',
    nodeColor: 'from-[#dfba6c] to-[#c29b43]',
    shadowGlow: '#c29b43',
    calloutTitle: `${shipment.carrierFlightNumber || 'AV-US-93901'} • ${Math.round(progress * 100)}% Traversed`,
    calloutSubtitle: 'Midwest Airspace Corridor (FL280 • Heading 142°)',
    surveillanceText: 'Telemetry Downlink: 99.4% Synchronized (Air Corridor Transit Active)',
  }

  if (isDelivered) {
    stageConfig = {
      modeTitle: 'MISSION COMPLETE — VERIFIED HANDOVER COMPLETE',
      modeSubtitle: 'Dual biometric signature verified. Consignment in receiver physical custody',
      statusBadge: 'DELIVERED & HANDOVER VERIFIED',
      badgeColor: 'text-emerald-300 bg-emerald-500/15 border-emerald-500/30',
      altitude: 'Destination Doorstep (Handover Complete)',
      speed: '0 kts (Final Delivery Confirmed)',
      iconType: 'delivered',
      nodeColor: 'from-emerald-400 to-emerald-600',
      shadowGlow: '#10b981',
      calloutTitle: 'Handover Complete • 100% Delivered',
      calloutSubtitle: `Receiver: ${shipment.receiverName || 'Designated Receiver'} (Biometric PIN Verified)`,
      surveillanceText: 'Mission Complete: Verified Handover & Custody Signature Confirmed',
    }
  } else if (isCustoms) {
    stageConfig = {
      modeTitle: 'BONDED CUSTOMS CLEARANCE & AIRSIDE HOLD',
      modeSubtitle: 'Diplomatic port of entry customs inspection and electronic seal audit',
      statusBadge: 'BONDED CUSTOMS CLEARANCE IN PROGRESS',
      badgeColor: 'text-amber-300 bg-amber-500/15 border-amber-500/30',
      altitude: 'Airside Port of Entry Terminal',
      speed: 'Stationary (Customs Bond Hold)',
      iconType: 'customs',
      nodeColor: 'from-amber-400 to-amber-600',
      shadowGlow: '#f59e0b',
      calloutTitle: `Customs Port of Entry • ${Math.round(progress * 100)}% Cleared`,
      calloutSubtitle: 'Port Customs Warehouse • Dual Tamper Seals Audited',
      surveillanceText: 'Diplomatic Hold: Customs Airside Clearance Active (Tamper Seals Intact)',
    }
  } else if (isConvoy) {
    stageConfig = {
      modeTitle: 'TACTICAL ARMORED GROUND CONVOY TELEMETRY',
      modeSubtitle: 'Level-B6 armored carrier inter-state highway transit with armed guard detail',
      statusBadge: 'ARMORED GROUND CONVOY IN TRANSIT',
      badgeColor: 'text-orange-300 bg-orange-500/15 border-orange-500/30',
      altitude: 'Surface Highway Level (Inter-State Route)',
      speed: `${62 + telemetryJitter.spdJitter} mph (Armored Escort)`,
      iconType: 'convoy',
      nodeColor: 'from-orange-400 to-amber-500',
      shadowGlow: '#f97316',
      calloutTitle: `Armored Convoy • ${Math.round(progress * 100)}% Traversed`,
      calloutSubtitle: 'Level-B6 Carrier Detail • Armed Guard Convoy En Route',
      surveillanceText: 'Convoy Active: Level-B6 Inter-State Ground Transit • GPS Locked',
    }
  } else if (isStaged) {
    stageConfig = {
      modeTitle: 'DEPOSITORY VAULT STAGING & ASSAY CALIBRATION',
      modeSubtitle: 'Subterranean staging vault release and dual-officer bar assay verification',
      statusBadge: 'VAULT STAGING & ASSAY VERIFIED',
      badgeColor: 'text-blue-300 bg-blue-500/15 border-blue-500/30',
      altitude: 'Subterranean Vault (Tier-IV Depository)',
      speed: 'Stationary (Origin Assay Staging)',
      iconType: 'staging',
      nodeColor: 'from-blue-400 to-indigo-600',
      shadowGlow: '#3b82f6',
      calloutTitle: `Depository Staging • ${Math.round(progress * 100)}% Verified`,
      calloutSubtitle: 'Origin Vault Facility • Assay Calibration & Custody Seal Affixed',
      surveillanceText: 'Depository Hold: Origin Vault Release & Dual-Officer Assay Verified',
    }
  }

  // If paused during transit, display clear Command Standby status
  if (!isPlaying && !isDelivered && !isStaged && !isCustoms) {
    stageConfig.statusBadge = 'RADAR STANDBY (TRANSIT PAUSED)'
    stageConfig.badgeColor = 'text-amber-300 bg-amber-500/15 border-amber-500/30'
    stageConfig.speed = '0 kts (Command Hold Standby)'
    stageConfig.surveillanceText = 'Corridor Standby: Radar Tracking Paused by Operations Command'
  }

  // Trailing breadcrumbs along path
  const breadcrumbs = [0.15, 0.3, 0.45, 0.6, 0.75, 0.9]
    .filter(bt => bt < t)
    .map(bt => {
      const bx = (1 - bt) * (1 - bt) * p0.x + 2 * (1 - bt) * bt * p1.x + bt * bt * p2.x
      const by = (1 - bt) * (1 - bt) * p0.y + 2 * (1 - bt) * bt * p1.y + bt * bt * p2.y
      return { x: bx, y: by }
    })

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-foreground text-background shadow-2xl">
      {/* Top Telemetry HUD Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-background/10 bg-background/5 px-5 py-3.5 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className={`flex size-10 items-center justify-center rounded-xl bg-gradient-to-br ${stageConfig.nodeColor} text-white font-bold shadow-md`}>
            {stageConfig.iconType === 'delivered' ? (
              <CheckCircle2 size={21} className="text-white drop-shadow" />
            ) : stageConfig.iconType === 'customs' ? (
              <ShieldCheck size={21} className="text-white drop-shadow" />
            ) : stageConfig.iconType === 'convoy' ? (
              <Truck size={21} className="text-white drop-shadow" />
            ) : stageConfig.iconType === 'staging' ? (
              <Building2 size={21} className="text-white drop-shadow" />
            ) : (
              <Plane size={21} className="rotate-45 text-white drop-shadow" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-primary">
                {stageConfig.modeTitle}
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${stageConfig.badgeColor}`}>
                ● {stageConfig.statusBadge}
              </span>
            </div>
            <p className="text-xs text-background/70 font-mono mt-0.5">
              Vector: <strong className="text-background">{shipment.origin.city} ({shipment.origin.code})</strong> ➔ <strong className="text-background">{shipment.destination.city} ({shipment.destination.code})</strong> • Escort: {shipment.custodyOfficer.split('(')[0].trim()}
            </p>
          </div>
        </div>

        {/* Real-time Dynamic Telemetry Instruments */}
        <div className="flex items-center gap-5 text-xs font-mono">
          <div className="hidden sm:block text-right">
            <span className="text-[10px] uppercase text-background/45 block">Corridor Altitude / Mode</span>
            <span className="text-primary font-bold">{stageConfig.altitude}</span>
          </div>
          <div className="hidden sm:block text-right">
            <span className="text-[10px] uppercase text-background/45 block">Velocity / Transit Speed</span>
            <span className="text-background font-bold">{stageConfig.speed}</span>
          </div>
          <div className="text-right">
            <span className="text-[10px] uppercase text-background/45 block">Current GPS Position</span>
            <span className="text-emerald-400 font-medium">
              {currentLat.toFixed(4)}°N, {currentLng.toFixed(4)}°E
            </span>
          </div>
        </div>
      </div>

      {/* Main Vector Radar Visualization Area */}
      <div className="relative min-h-[380px] w-full p-6 sm:p-10 flex flex-col justify-between radar-grid overflow-hidden">
        {/* Background Radar Sweeping Cone & Concentric Distance Rings */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden">
          <div className="size-[580px] rounded-full border border-primary/15 relative">
            <div className="absolute inset-10 rounded-full border border-primary/10" />
            <div className="absolute inset-24 rounded-full border border-primary/10" />
            <div className="absolute inset-40 rounded-full border border-primary/5" />
            <div className="absolute inset-0 rounded-full animate-radar-sweep opacity-25 bg-[conic-gradient(from_0deg,transparent_0deg,rgba(194,155,67,0.35)_60deg,transparent_65deg)]" />
          </div>
        </div>

        {/* Vector Route Overlay with Smooth Motion */}
        <div className="relative z-10 w-full my-auto py-8">
          <div className="mx-auto max-w-2xl relative">
            {/* SVG Flight Corridor Arc */}
            <svg className="w-full h-28 overflow-visible" viewBox="0 0 600 90">
              <defs>
                <linearGradient id="corridorGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop
                    offset="0%"
                    stopColor={isDelivered ? '#10b981' : isCustoms ? '#f59e0b' : isStaged ? '#3b82f6' : isConvoy ? '#f97316' : '#dfba6c'}
                    stopOpacity="0.4"
                  />
                  <stop
                    offset={`${progress * 100}%`}
                    stopColor={isDelivered ? '#10b981' : isCustoms ? '#f59e0b' : isStaged ? '#3b82f6' : isConvoy ? '#f97316' : '#dfba6c'}
                    stopOpacity="1"
                  />
                  <stop offset={`${progress * 100}%`} stopColor="#ffffff" stopOpacity="0.1" />
                  <stop offset="100%" stopColor="#ffffff" stopOpacity="0.1" />
                </linearGradient>

                <filter id="corridorGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="glow" />
                  <feComposite in="SourceGraphic" in2="glow" operator="over" />
                </filter>
              </defs>

              {/* Planned Route Guide (Dotted) */}
              <path
                d={`M ${p0.x} ${p0.y} Q ${p1.x} ${p1.y} ${p2.x} ${p2.y}`}
                fill="none"
                stroke="rgba(255,255,255,0.12)"
                strokeWidth="3"
                strokeDasharray="6 4"
              />

              {/* Traveled Corridor Arc (Glowing with Stage Persona Color) */}
              <path
                d={`M ${p0.x} ${p0.y} Q ${p1.x} ${p1.y} ${p2.x} ${p2.y}`}
                fill="none"
                stroke="url(#corridorGradient)"
                strokeWidth="3.5"
                filter="url(#corridorGlow)"
              />

              {/* Waypoint Breadcrumbs along path */}
              {breadcrumbs.map((b, i) => (
                <circle
                  key={i}
                  cx={b.x}
                  cy={b.y}
                  r="2.5"
                  className="fill-primary/60 animate-pulse"
                />
              ))}

              {/* Radiating Transponder Wave Behind Carrier */}
              <circle
                cx={currentX}
                cy={currentY}
                r="20"
                className="fill-none animate-ping-slow"
                stroke={stageConfig.shadowGlow}
                strokeOpacity="0.4"
              />
            </svg>

            {/* Origin Vault Node */}
            <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 text-left z-20">
              <div className="relative">
                <span
                  className={`size-4 rounded-full block shadow-md ${
                    isStaged
                      ? 'bg-blue-400 shadow-[0_0_20px_#3b82f6] ring-4 ring-blue-500/30 animate-pulse'
                      : 'bg-primary shadow-[0_0_15px_#c29b43]'
                  }`}
                />
                {isStaged && (
                  <span className="absolute -inset-1.5 rounded-full border border-blue-400/80 animate-ping-slow" />
                )}
              </div>
              <div className="mt-3">
                <div className="flex items-center gap-1 font-mono text-xs font-bold text-background">
                  <span>{shipment.origin.code}</span>
                  <span className={`size-1.5 rounded-full ${isStaged ? 'bg-blue-400' : 'bg-emerald-400'}`} />
                </div>
                <p className="text-[11px] text-background/90 font-medium">{shipment.origin.city}</p>
                <p className="text-[10px] text-background/50 max-w-[140px] truncate">{shipment.origin.facility}</p>
                {isStaged && (
                  <span className="mt-0.5 inline-block text-[9px] font-mono font-bold text-blue-300 bg-blue-500/20 px-1.5 py-0.5 rounded border border-blue-500/30">
                    ● ACTIVE VAULT STAGE
                  </span>
                )}
              </div>
            </div>

            {/* Moving Carrier Aircraft / Vehicle Icon with Tangent Heading Rotation */}
            <div
              suppressHydrationWarning
              className="absolute top-0 left-0 z-30 pointer-events-auto transition-transform duration-300 ease-out"
              style={{
                transform: `translate(${(((currentX - 50) / 500) * 100).toFixed(2)}%, ${(currentY - 24).toFixed(2)}px)`,
                left: '8%',
                width: '84%',
              }}
            >
              <div className="relative -translate-x-1/2 flex flex-col items-center">
                {/* Vehicle Emblem with Stage-Specific Icon and Dynamic Heading */}
                <div
                  suppressHydrationWarning
                  className={`relative flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br ${stageConfig.nodeColor} text-white shadow-2xl border-2 border-white/70 transition-all duration-300 hover:scale-110`}
                  style={{
                    transform: stageConfig.iconType === 'plane' ? `rotate(${tangentAngle.toFixed(2)}deg)` : undefined,
                    boxShadow: `0 0 28px ${stageConfig.shadowGlow}`,
                  }}
                >
                  {stageConfig.iconType === 'delivered' ? (
                    <CheckCircle2 size={24} className="text-white drop-shadow" />
                  ) : stageConfig.iconType === 'customs' ? (
                    <ShieldCheck size={24} className="text-white drop-shadow" />
                  ) : stageConfig.iconType === 'convoy' ? (
                    <Truck size={24} className="text-white drop-shadow" />
                  ) : stageConfig.iconType === 'staging' ? (
                    <Building2 size={24} className="text-white drop-shadow" />
                  ) : (
                    <Plane size={24} className="rotate-45 text-white drop-shadow" />
                  )}
                </div>

                {/* Floating Telemetry Callout Pill */}
                <div className="mt-3 whitespace-nowrap rounded-2xl bg-background/95 px-3.5 py-2 text-[11px] text-foreground shadow-2xl border border-primary/40 backdrop-blur-md flex flex-col items-center gap-0.5">
                  <div className="font-semibold flex items-center gap-1.5 text-primary font-mono">
                    <span className={`size-2 rounded-full ${isDelivered ? 'bg-emerald-400' : 'bg-emerald-500 animate-pulse'}`} />
                    {stageConfig.calloutTitle}
                  </div>
                  <div className="text-[10px] text-muted-foreground font-mono">
                    {stageConfig.calloutSubtitle}
                  </div>
                  <div className="text-[10px] text-primary/80 font-mono mt-0.5 flex items-center gap-3">
                    <span>{stageConfig.altitude}</span>
                    <span>•</span>
                    <span>{stageConfig.speed}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Destination Vault Node */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 text-right z-20">
              <div className="relative ml-auto w-fit">
                <span
                  className={`size-4 rounded-full block ${
                    isDelivered
                      ? 'size-5 bg-emerald-400 shadow-[0_0_25px_#10b981] ring-4 ring-emerald-500/30 animate-pulse'
                      : isCustoms
                      ? 'size-5 bg-amber-400 shadow-[0_0_20px_#f59e0b] ring-4 ring-amber-500/30 animate-pulse'
                      : progress >= 0.98
                      ? 'bg-emerald-400 shadow-[0_0_18px_#34d399]'
                      : 'border-2 border-primary/70 bg-foreground'
                  }`}
                />
                {isDelivered && (
                  <span className="absolute -inset-2 rounded-full border-2 border-emerald-400/80 animate-ping-slow" />
                )}
                {isCustoms && (
                  <span className="absolute -inset-1.5 rounded-full border border-amber-400/80 animate-ping-slow" />
                )}
              </div>
              <div className="mt-3">
                <div className="flex items-center justify-end gap-1 font-mono text-xs font-bold text-background">
                  <span className={`size-1.5 rounded-full ${isDelivered ? 'bg-emerald-400' : 'bg-primary'}`} />
                  <span>{shipment.destination.code}</span>
                </div>
                <p className="text-[11px] text-background/90 font-medium">{shipment.destination.city}</p>
                <p className="text-[10px] text-background/50 max-w-[140px] truncate">{shipment.destination.facility}</p>
                {isDelivered && (
                  <span className="mt-0.5 inline-block text-[9px] font-mono font-bold text-emerald-300 bg-emerald-500/20 px-1.5 py-0.5 rounded border border-emerald-500/30">
                    ✓ HANDOVER COMPLETE
                  </span>
                )}
                {isCustoms && (
                  <span className="mt-0.5 inline-block text-[9px] font-mono font-bold text-amber-300 bg-amber-500/20 px-1.5 py-0.5 rounded border border-amber-500/30">
                    ● PORT CUSTOMS HOLD
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* If showAdminControls is TRUE: render the Operations Toolbar. If FALSE: render client status pill */}
        {showAdminControls ? (
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-background/15 bg-background/10 p-3 backdrop-blur-md text-xs">
            {/* Play / Pause / Replay Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const nextPlaying = !isPlaying
                  setLocalIsPlaying(nextPlaying)
                  if (onPlayPauseChange) onPlayPauseChange(nextPlaying)
                }}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-semibold transition cursor-pointer ${
                  isPlaying
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30'
                }`}
              >
                {isPlaying ? <Pause size={13} /> : <Play size={13} />}
                <span>{isPlaying ? 'Pause' : 'Play'}</span>
              </button>

              <button
                onClick={() => {
                  setProgress(0.02)
                  if (onProgressChange) onProgressChange(2)
                  setLocalIsPlaying(true)
                  if (onPlayPauseChange) onPlayPauseChange(true)
                }}
                className="inline-flex items-center gap-1 rounded-full border border-background/20 bg-background/5 px-2.5 py-1.5 text-xs text-background/80 hover:bg-background/10 transition cursor-pointer"
              >
                <RotateCcw size={12} />
                Reset Route
              </button>
            </div>

            {/* Speed Multiplier */}
            <div className="flex items-center gap-2 text-[11px] font-mono">
              <span className="text-background/60">Cruise Speed:</span>
              {([1, 4, 10] as const).map(rate => (
                <button
                  key={rate}
                  onClick={() => {
                    setLocalSpeedMultiplier(rate)
                    if (onSpeedChange) onSpeedChange(rate)
                  }}
                  className={`rounded px-2 py-0.5 font-semibold transition cursor-pointer ${
                    speedMultiplier === rate
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-background/10 text-background/70 hover:bg-background/20'
                  }`}
                >
                  {rate}x
                </button>
              ))}
            </div>

            {/* Scrubber Range */}
            <div className="flex items-center gap-2 flex-1 max-w-xs">
              <span className="text-[10px] font-mono text-background/50">SCRUB:</span>
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round(progress * 100)}
                onChange={e => {
                  const val = Number(e.target.value)
                  setProgress(val / 100)
                  if (onProgressChange) onProgressChange(val)
                }}
                className="w-full accent-primary h-1.5 bg-background/20 rounded cursor-pointer"
              />
              <span className="text-[10px] font-mono text-primary font-bold w-9 text-right">
                {Math.round(progress * 100)}%
              </span>
            </div>
          </div>
        ) : (
          /* Client-facing clean surveillance status banner */
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl border border-background/10 bg-background/5 px-4 py-2.5 backdrop-blur-md text-xs">
            <div className="flex items-center gap-2 text-background/75">
              <Lock size={12} className="text-primary" />
              <span>Sovereign Transit Corridor: <strong className="text-background font-medium">Encrypted Live Downlink</strong></span>
            </div>
            <div className={`flex items-center gap-2 font-mono text-[11px] ${
              isDelivered
                ? 'text-emerald-400'
                : isCustoms
                ? 'text-amber-400'
                : isStaged
                ? 'text-blue-400'
                : 'text-[#dfba6c]'
            }`}>
              <span className={`size-2 rounded-full ${
                isDelivered
                  ? 'bg-emerald-400'
                  : isCustoms
                  ? 'bg-amber-400'
                  : isStaged
                  ? 'bg-blue-400'
                  : 'bg-[#dfba6c] animate-ping'
              }`} />
              <span>{stageConfig.surveillanceText}</span>
            </div>
          </div>
        )}

        {/* Bottom HUD Bar */}
        <div className="relative z-10 grid gap-3 border-t border-background/10 pt-4 sm:grid-cols-3 text-xs">
          <div className="flex items-center gap-2.5">
            <Radio size={14} className="text-primary animate-pulse" />
            <div>
              <span className="text-[10px] uppercase text-background/45 block">Active Telemetry Downlink</span>
              <span className="font-medium text-background/90 text-[11px] font-mono">
                {currentLat.toFixed(3)}°N, {currentLng.toFixed(3)}°E • Heading {Math.round(tangentAngle + 90)}°
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Shield size={14} className="text-emerald-400" />
            <div>
              <span className="text-[10px] uppercase text-background/45 block">Geofence Compliance</span>
              <span className="font-medium text-emerald-400 text-[11px]">
                {shipment.telemetry.gps.geofenceStatus}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:justify-end">
            <Compass size={14} className="text-primary" />
            <div className="sm:text-right">
              <span className="text-[10px] uppercase text-background/45 block">Target Vault Reception</span>
              <span className="font-mono font-semibold text-primary text-[11px]">{shipment.eta}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
