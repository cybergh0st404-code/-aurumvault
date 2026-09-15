'use client'

import { useState, useEffect, useRef } from 'react'
import { Shipment } from '@/lib/types'
import {
  Plane,
  Shield,
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

  // Progress ratio 0.0 to 1.0 based on current shipment state
  const [progress, setProgress] = useState(shipment.progress / 100)
  const [telemetryJitter, setTelemetryJitter] = useState({ altJitter: 0, spdJitter: 0 })

  // Sync with external shipment changes (from server poller)
  useEffect(() => {
    setProgress(shipment.progress / 100)
  }, [shipment.progress, shipment.id])

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

  // Continuous animation loop for real-time movement
  const lastTimeRef = useRef<number | null>(null)

  useEffect(() => {
    if (!isPlaying) {
      lastTimeRef.current = null
      return
    }

    let animationFrameId: number

    const step = (timestamp: number) => {
      if (lastTimeRef.current === null) {
        lastTimeRef.current = timestamp
      }

      const deltaMs = timestamp - lastTimeRef.current
      lastTimeRef.current = timestamp

      // Real-time advance rate
      const speedRate = (0.008 * speedMultiplier * deltaMs) / 1000

      setProgress(prev => {
        let next = prev + speedRate
        if (next >= 1.0) {
          next = 0.02
        }
        return next
      })

      animationFrameId = requestAnimationFrame(step)
    }

    animationFrameId = requestAnimationFrame(step)
    return () => cancelAnimationFrame(animationFrameId)
  }, [isPlaying, speedMultiplier])

  // Periodic sensor telemetry jitter for realistic avionics
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

  // Dynamic Altitude calculation (Chartered Air-Specie Corridor)
  let dynamicAltitude = '38,200 ft'
  let dynamicSpeed = '518 kts'

  if (t < 0.15) {
    const alt = Math.round(5000 + (t / 0.15) * 33000 + telemetryJitter.altJitter)
    dynamicAltitude = `${alt.toLocaleString()} ft (Climbing)`
    dynamicSpeed = `${420 + telemetryJitter.spdJitter} kts`
  } else if (t > 0.85) {
    const alt = Math.round(38000 - ((t - 0.85) / 0.15) * 34000 + telemetryJitter.altJitter)
    dynamicAltitude = `${Math.max(1200, alt).toLocaleString()} ft (Descent)`
    dynamicSpeed = `${380 + telemetryJitter.spdJitter} kts`
  } else {
    const alt = 38200 + telemetryJitter.altJitter
    dynamicAltitude = `${alt.toLocaleString()} ft (Cruise FL380)`
    dynamicSpeed = `${518 + telemetryJitter.spdJitter} kts`
  }

  // Trailing breadcrumbs
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
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary/20 text-primary">
            <Navigation size={17} className="rotate-45" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                Live Flight Corridor Telemetry
              </span>
              <span className="relative flex size-2">
                <span
                  className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    isPlaying ? 'animate-ping bg-emerald-400' : 'bg-amber-400'
                  }`}
                />
                <span
                  className={`relative inline-flex size-2 rounded-full ${
                    isPlaying ? 'bg-emerald-400' : 'bg-amber-400'
                  }`}
                />
              </span>
              <span
                className={`font-mono text-[10px] font-semibold ${
                  isPlaying ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                {isPlaying ? 'TRACKING LIVE • 100% IN CORRIDOR' : 'RADAR STANDBY • CONTROL HOLD (PAUSED)'}
              </span>
            </div>
            <p className="text-xs text-background/70 font-mono">
              Vector: {shipment.origin.code} ➔ {shipment.destination.code} • {shipment.carrierFlightNumber || 'ARMORED-CONVOY'}
            </p>
          </div>
        </div>

        {/* Real-time Dynamic Flight Instruments */}
        <div className="flex items-center gap-5 text-xs font-mono">
          <div className="hidden sm:block text-right">
            <span className="text-[10px] uppercase text-background/45 block">Live Altitude</span>
            <span className="text-primary font-bold">{dynamicAltitude}</span>
          </div>
          <div className="hidden sm:block text-right">
            <span className="text-[10px] uppercase text-background/45 block">Air/Ground Speed</span>
            <span className="text-background font-bold">{dynamicSpeed}</span>
          </div>
          <div className="text-right">
            <span className="text-[10px] uppercase text-background/45 block">GPS Coordinates</span>
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
                <linearGradient id="flightGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#c29b43" stopOpacity="0.3" />
                  <stop offset={`${progress * 100}%`} stopColor="#c29b43" stopOpacity="1" />
                  <stop offset={`${progress * 100}%`} stopColor="#ffffff" stopOpacity="0.1" />
                  <stop offset="100%" stopColor="#ffffff" stopOpacity="0.1" />
                </linearGradient>

                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
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

              {/* Flown / Traveled Route Arc (Glowing Gold) */}
              <path
                d={`M ${p0.x} ${p0.y} Q ${p1.x} ${p1.y} ${p2.x} ${p2.y}`}
                fill="none"
                stroke="url(#flightGradient)"
                strokeWidth="3.5"
                filter="url(#glow)"
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

              {/* Jet Stream / Trailing Wave Radiating Behind Carrier */}
              <circle
                cx={currentX}
                cy={currentY}
                r="18"
                className="fill-none stroke-primary/30 animate-ping-slow"
              />
            </svg>

            {/* Origin Vault Node */}
            <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 text-left z-20">
              <div className="relative">
                <span className="size-4 rounded-full bg-primary block shadow-[0_0_15px_#c29b43]" />
                <span className="absolute -inset-1 rounded-full border border-primary/60 animate-ping-slow" />
              </div>
              <div className="mt-3">
                <div className="flex items-center gap-1 font-mono text-xs font-bold text-background">
                  <span>{shipment.origin.code}</span>
                  <span className="size-1 rounded-full bg-emerald-400" />
                </div>
                <p className="text-[11px] text-background/90 font-medium">{shipment.origin.city}</p>
                <p className="text-[10px] text-background/50 max-w-[140px] truncate">{shipment.origin.facility}</p>
              </div>
            </div>

            {/* Moving Carrier Aircraft / Vehicle Icon with Tangent Rotation */}
            <div
              suppressHydrationWarning
              className="absolute top-0 left-0 z-30 pointer-events-auto transition-transform duration-75 ease-linear"
              style={{
                transform: `translate(${(((currentX - 50) / 500) * 100).toFixed(2)}%, ${(currentY - 24).toFixed(2)}px)`,
                left: '8%',
                width: '84%',
              }}
            >
              <div className="relative -translate-x-1/2 flex flex-col items-center">
                {/* Vehicle Emblem with Dynamic Heading Rotation */}
                <div
                  suppressHydrationWarning
                  className="relative flex size-11 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_0_25px_rgba(194,155,67,0.9)] border-2 border-white/60 transition-transform duration-100"
                  style={{ transform: `rotate(${tangentAngle.toFixed(2)}deg)` }}
                >
                  <Plane size={22} className="rotate-45 drop-shadow" />
                </div>

                {/* Floating Telemetry Callout Pill */}
                <div className="mt-2.5 whitespace-nowrap rounded-xl bg-background/95 px-3 py-1.5 text-[11px] text-foreground shadow-2xl border border-primary/50 backdrop-blur-md">
                  <div className="font-semibold flex items-center gap-1.5 text-primary">
                    <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                    {shipment.id} • {Math.round(progress * 100)}% Traversed
                  </div>
                  <div className="text-[10px] text-muted-foreground font-mono mt-0.5 flex items-center justify-between gap-3">
                    <span>{dynamicAltitude}</span>
                    <span>{dynamicSpeed}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Destination Vault Node */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 text-right z-20">
              <div className="relative ml-auto w-fit">
                <span
                  className={`size-4 rounded-full block ${
                    progress >= 0.98
                      ? 'bg-emerald-400 shadow-[0_0_18px_#34d399]'
                      : 'border-2 border-primary/70 bg-foreground'
                  }`}
                />
              </div>
              <div className="mt-3">
                <div className="flex items-center justify-end gap-1 font-mono text-xs font-bold text-background">
                  <span className="size-1 rounded-full bg-primary" />
                  <span>{shipment.destination.code}</span>
                </div>
                <p className="text-[11px] text-background/90 font-medium">{shipment.destination.city}</p>
                <p className="text-[10px] text-background/50 max-w-[140px] truncate">{shipment.destination.facility}</p>
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
                className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition shadow-sm cursor-pointer"
              >
                {isPlaying ? <Pause size={13} /> : <Play size={13} />}
                {isPlaying ? 'Pause Radar' : 'Resume Live'}
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
          <div className="relative z-10 flex items-center justify-between rounded-xl border border-background/10 bg-background/5 px-4 py-2.5 backdrop-blur-md text-xs">
            <div className="flex items-center gap-2 text-background/75">
              <Lock size={12} className="text-primary" />
              <span>Sovereign Transit Corridor: <strong className="text-background font-medium">Encrypted Live Stream</strong></span>
            </div>
            <div className={`flex items-center gap-2 font-mono text-[11px] ${isPlaying ? 'text-emerald-400' : 'text-amber-400'}`}>
              <span className={`size-2 rounded-full ${isPlaying ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`} />
              <span>{isPlaying ? 'Telemetry Downlink: 99.4% Synchronized' : 'Operations Hold: Flight Paused by Command'}</span>
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
