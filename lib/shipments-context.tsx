'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { Shipment, Checkpoint, QuoteInquiry, VaultHolding } from './types'
import { shipmentsData as defaultShipments, initialVaultHoldings as defaultVaultHoldings } from './shipments-data'

interface SimulationSettings {
  isCruising: boolean
  cruiseSpeed: number // 1, 4, 10
}

interface ShipmentsContextType {
  shipments: Shipment[]
  selectedShipmentId: string
  setSelectedShipmentId: (id: string) => void
  selectedShipment: Shipment | undefined
  updateShipmentProgress: (id: string, progress: number) => void
  updateShipmentStatus: (id: string, status: string, statusType: Shipment['statusType']) => void
  togglePlayPause: (id: string, isPausedOverride?: boolean) => Promise<void>
  setSpeedMultiplier: (id: string, speed: 1 | 4 | 10) => Promise<void>
  addCheckpoint: (id: string, cp: Omit<Checkpoint, 'id'>) => void
  toggleSealTamper: (id: string) => void
  createShipment: (newShipment: Shipment) => void
  deleteShipment: (id: string) => void
  quoteInquiries: QuoteInquiry[]
  addQuoteInquiry: (inquiry: Omit<QuoteInquiry, 'id' | 'createdAt' | 'status'>) => void
  updateQuoteStatus: (id: string, status: QuoteInquiry['status']) => void
  vaultHoldings: VaultHolding[]
  requestVaultTransit: (holdingId: string, destinationCity: string, transitNotes: string) => void
  simulationSettings: SimulationSettings
  setSimulationSettings: React.Dispatch<React.SetStateAction<SimulationSettings>>
  resetToDefaults: () => void
}


const initialQuotes: QuoteInquiry[] = [
  {
    id: 'INQ-2026-0941',
    clientName: 'Lord Alistair Sterling',
    email: 'sterling.trust@genevaprivate.ch',
    assetType: 'Fine Horology & Rare Timepieces',
    declaredValue: 4200000,
    originCity: 'Zurich',
    originCode: 'ZRH-FP',
    destinationCity: 'Singapore',
    destinationCode: 'SIN-LEFP',
    transitMode: 'Dedicated Chartered Aircraft',
    notes: 'Requires dual armed tarmac escort at Changi VIP ramp. Nitrogen-purged cask requested.',
    createdAt: '14 Mar 2026, 09:40 CET',
    status: 'pending',
  },
  {
    id: 'INQ-2026-0882',
    clientName: 'Dr. Elena Rostova',
    email: 'rostova.specie@zurich-metals.com',
    assetType: 'Precious Metals & Bullion',
    declaredValue: 12500000,
    originCity: 'Dubai',
    originCode: 'DXB-DMCC',
    destinationCity: 'Geneva',
    destinationCode: 'GVA-FP',
    transitMode: 'Bonded Air-Specie Hold',
    notes: 'Twenty (20) x 400 oz 999.9 Good Delivery cast bars. Direct inward Freeport vaulting.',
    createdAt: '13 Mar 2026, 18:20 UTC',
    status: 'approved',
  },
]

const ShipmentsContext = createContext<ShipmentsContextType | undefined>(undefined)

const STORAGE_KEY = 'aurumvault_shipments_v1'
const QUOTES_STORAGE_KEY = 'aurumvault_quotes_v1'
const HOLDINGS_STORAGE_KEY = 'aurumvault_holdings_v1'

export function ShipmentsProvider({ children }: { children: React.ReactNode }) {
  const [shipments, setShipments] = useState<Shipment[]>(defaultShipments)
  const [selectedShipmentId, setSelectedShipmentId] = useState<string>(defaultShipments[0].id)
  const [quoteInquiries, setQuoteInquiries] = useState<QuoteInquiry[]>(initialQuotes)
  const [vaultHoldings, setVaultHoldings] = useState<VaultHolding[]>(defaultVaultHoldings)
  const [simulationSettings, setSimulationSettings] = useState<SimulationSettings>({
    isCruising: true,
    cruiseSpeed: 1,
  })

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const savedShipments = localStorage.getItem(STORAGE_KEY)
      if (savedShipments) {
        const parsed: Shipment[] = JSON.parse(savedShipments)
        // Refresh default shipments with current flight parameters while preserving live progress
        const merged = defaultShipments.map(def => {
          const saved = parsed.find(s => s.id === def.id)
          return saved
            ? { ...def, progress: saved.progress ?? def.progress }
            : def
        })
        const custom = parsed.filter(s => !defaultShipments.some(def => def.id === s.id))
        setShipments([...merged, ...custom])
      }
      const savedQuotes = localStorage.getItem(QUOTES_STORAGE_KEY)
      if (savedQuotes) {
        setQuoteInquiries(JSON.parse(savedQuotes))
      }
      const savedHoldings = localStorage.getItem(HOLDINGS_STORAGE_KEY)
      if (savedHoldings) {
        const parsed: VaultHolding[] = JSON.parse(savedHoldings)
        const mergedHoldings = defaultVaultHoldings.map(def => {
          const saved = parsed.find(h => h.id === def.id)
          return saved
            ? { ...def, status: saved.status ?? def.status }
            : def
        })
        const customHoldings = parsed.filter(h => !defaultVaultHoldings.some(def => def.id === h.id))
        setVaultHoldings([...mergedHoldings, ...customHoldings])
      }
    } catch (e) {
      console.warn('LocalStorage unavailable:', e)
    }
  }, [])

  // Real-time server telemetry background sync (cross-device sync across phones/laptops)
  useEffect(() => {
    let isMounted = true

    const fetchServerTelemetry = async () => {
      try {
        const res = await fetch('/api/telemetry', { cache: 'no-store' })
        if (!res.ok) return
        const data = await res.json()
        if (!data.success || !data.telemetry || !isMounted) return

        const telemetryMap: Record<string, { progress: number; is_paused: number; speed_multiplier: number; status: string | null }> = data.telemetry

        setShipments(prev =>
          prev.map(s => {
            const remote = telemetryMap[s.id]
            if (!remote) return s

            const isPaused = Boolean(remote.is_paused)
            const speedMultiplier = remote.speed_multiplier ? Number(remote.speed_multiplier) : (s.speedMultiplier ?? 1)
            const remoteProgress = Number(remote.progress)

            const hasPauseChanged = s.isPaused !== isPaused
            const hasSpeedChanged = s.speedMultiplier !== speedMultiplier
            const hasSignificantProgressDiff = Math.abs(s.progress - remoteProgress) > 2.0

            if (hasPauseChanged || hasSpeedChanged || (isPaused && hasSignificantProgressDiff) || Math.abs(s.progress - remoteProgress) > 5.0) {
              return {
                ...s,
                isPaused,
                speedMultiplier,
                progress: isPaused ? remoteProgress : (hasSignificantProgressDiff ? remoteProgress : s.progress),
                status: remote.status || s.status,
              }
            }

            return {
              ...s,
              isPaused,
              speedMultiplier,
            }
          })
        )
      } catch (err) {
        // Silently tolerate temporary network blips
      }
    }

    fetchServerTelemetry()
    const interval = setInterval(fetchServerTelemetry, 1500)
    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [])

  // Sync to localStorage
  const persistShipments = (newShipments: Shipment[]) => {
    setShipments(newShipments)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newShipments))
    } catch (e) {
      console.warn('Could not persist shipments:', e)
    }
  }

  const persistQuotes = (newQuotes: QuoteInquiry[]) => {
    setQuoteInquiries(newQuotes)
    try {
      localStorage.setItem(QUOTES_STORAGE_KEY, JSON.stringify(newQuotes))
    } catch (e) {
      console.warn('Could not persist quotes:', e)
    }
  }

  const persistHoldings = (newHoldings: VaultHolding[]) => {
    setVaultHoldings(newHoldings)
    try {
      localStorage.setItem(HOLDINGS_STORAGE_KEY, JSON.stringify(newHoldings))
    } catch (e) {
      console.warn('Could not persist vault holdings:', e)
    }
  }

  const selectedShipment = shipments.find(s => s.id === selectedShipmentId) || shipments[0]

  // Global Auto-Cruise animation when enabled by Admin
  useEffect(() => {
    if (!simulationSettings.isCruising) return

    const interval = setInterval(() => {
      setShipments(prev =>
        prev.map(s => {
          if (s.statusType === 'delivered' || s.isPaused) return s

          const speed = s.speedMultiplier ?? simulationSettings.cruiseSpeed
          const increment = (0.2 * speed)
          let nextProgress = s.progress + increment
          if (nextProgress > 100) nextProgress = 100

          return {
            ...s,
            progress: Number(nextProgress.toFixed(1)),
          }
        })
      )
    }, 1000)

    return () => clearInterval(interval)
  }, [simulationSettings.isCruising, simulationSettings.cruiseSpeed])

  const togglePlayPause = async (id: string, isPausedOverride?: boolean) => {
    const target = shipments.find(s => s.id === id)
    const newPaused = isPausedOverride !== undefined ? isPausedOverride : !(target?.isPaused ?? false)

    const updated = shipments.map(s => {
      if (s.id !== id) return s
      return {
        ...s,
        isPaused: newPaused,
      }
    })
    persistShipments(updated)

    try {
      await fetch('/api/telemetry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shipmentId: id,
          isPaused: newPaused,
          progress: target?.progress,
          speedMultiplier: target?.speedMultiplier ?? 1,
        }),
      })
    } catch (e) {
      console.warn('Telemetry sync error:', e)
    }
  }

  const setSpeedMultiplier = async (id: string, speed: 1 | 4 | 10) => {
    const target = shipments.find(s => s.id === id)

    const updated = shipments.map(s => {
      if (s.id !== id) return s
      return {
        ...s,
        speedMultiplier: speed,
      }
    })
    persistShipments(updated)

    try {
      await fetch('/api/telemetry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shipmentId: id,
          speedMultiplier: speed,
          isPaused: target?.isPaused ?? false,
          progress: target?.progress,
        }),
      })
    } catch (e) {
      console.warn('Telemetry sync error:', e)
    }
  }

  const updateShipmentProgress = (id: string, newProgress: number) => {
    const clamped = Math.max(0, Math.min(100, Math.round(newProgress)))
    const updated = shipments.map(s => {
      if (s.id !== id) return s
      return {
        ...s,
        progress: clamped,
        statusType: clamped >= 100 ? ('delivered' as const) : s.statusType,
        status: clamped >= 100 ? 'Delivered — Verified Handover' : s.status,
      }
    })
    persistShipments(updated)

    fetch('/api/telemetry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        shipmentId: id,
        progress: clamped,
      }),
    }).catch(e => console.warn('Telemetry broadcast error:', e))
  }

  const updateShipmentStatus = (id: string, status: string, statusType: Shipment['statusType']) => {
    const newProgress = statusType === 'delivered' ? 100 : undefined
    const updated = shipments.map(s => {
      if (s.id !== id) return s
      return {
        ...s,
        status,
        statusType,
        progress: newProgress !== undefined ? newProgress : s.progress,
      }
    })
    persistShipments(updated)

    fetch('/api/telemetry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        shipmentId: id,
        status,
        progress: newProgress,
      }),
    }).catch(e => console.warn('Telemetry broadcast error:', e))
  }

  const addCheckpoint = (id: string, cpData: Omit<Checkpoint, 'id'>) => {
    const updated = shipments.map(s => {
      if (s.id !== id) return s
      const newCp: Checkpoint = {
        ...cpData,
        id: `cp-${Date.now()}`,
        hash: `SHA256:${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
      }
      return {
        ...s,
        checkpoints: [...s.checkpoints, newCp],
      }
    })
    persistShipments(updated)
  }

  const toggleSealTamper = (id: string) => {
    const updated = shipments.map(s => {
      if (s.id !== id) return s
      const current = s.telemetry.electronicSeal.status
      const nextStatus: 'SECURE' | 'TAMPER_ALERT' = current === 'SECURE' ? 'TAMPER_ALERT' : 'SECURE'
      return {
        ...s,
        telemetry: {
          ...s.telemetry,
          electronicSeal: {
            ...s.telemetry.electronicSeal,
            status: nextStatus,
          },
        },
      }
    })
    persistShipments(updated)
  }

  const createShipment = (newShipment: Shipment) => {
    const updated = [newShipment, ...shipments]
    persistShipments(updated)
    setSelectedShipmentId(newShipment.id)
  }

  const deleteShipment = (id: string) => {
    const updated = shipments.filter(s => s.id !== id)
    persistShipments(updated)
    if (selectedShipmentId === id && updated.length > 0) {
      setSelectedShipmentId(updated[0].id)
    }
  }

  const addQuoteInquiry = (inquiry: Omit<QuoteInquiry, 'id' | 'createdAt' | 'status'>) => {
    const newInquiry: QuoteInquiry = {
      ...inquiry,
      id: `INQ-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      createdAt: new Date().toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      status: 'pending',
    }
    persistQuotes([newInquiry, ...quoteInquiries])
  }

  const updateQuoteStatus = (id: string, status: QuoteInquiry['status']) => {
    const updated = quoteInquiries.map(q => (q.id === id ? { ...q, status } : q))
    persistQuotes(updated)
  }

  const requestVaultTransit = (holdingId: string, destinationCity: string, transitNotes: string) => {
    const holding = vaultHoldings.find(h => h.id === holdingId)
    if (!holding) return
    const updatedHoldings = vaultHoldings.map(h =>
      h.id === holdingId ? { ...h, status: 'Allocated For Transit' as const } : h
    )
    persistHoldings(updatedHoldings)

    // Automatically create a high-priority dispatch inquiry for operations review
    const transitInquiry: Omit<QuoteInquiry, 'id' | 'createdAt' | 'status'> = {
      clientName: holding.clientCode ? `Authorized Depositor (${holding.clientCode})` : 'Private Client Depository',
      email: 'client@sovereign-vault.ch',
      assetType: holding.assetCategory,
      declaredValue: holding.declaredValueUSD,
      originCity: holding.vaultCity,
      originCode: holding.vaultFacility.split(' ')[0] || 'VAULT',
      destinationCity: destinationCity,
      destinationCode: destinationCity.toUpperCase().slice(0, 3) + '-SPEC',
      transitMode: 'Dedicated Chartered Aircraft / Armed Specie Escort',
      notes: `Vault Extraction Request for Holding #${holding.id} (${holding.assetTitle}). Bar Serials: ${holding.barSerialNumbers.join(', ')}. Instructions: ${transitNotes}`,
    }
    addQuoteInquiry(transitInquiry)
  }

  const resetToDefaults = () => {
    try {
      localStorage.removeItem(STORAGE_KEY)
      localStorage.removeItem(QUOTES_STORAGE_KEY)
      localStorage.removeItem(HOLDINGS_STORAGE_KEY)
    } catch (e) {
      console.warn(e)
    }
    setShipments(defaultShipments)
    setSelectedShipmentId(defaultShipments[0].id)
    setQuoteInquiries(initialQuotes)
    setVaultHoldings(defaultVaultHoldings)
    setSimulationSettings({ isCruising: true, cruiseSpeed: 1 })
  }

  return (
    <ShipmentsContext.Provider
      value={{
        shipments,
        selectedShipmentId,
        setSelectedShipmentId,
        selectedShipment,
        updateShipmentProgress,
        updateShipmentStatus,
        togglePlayPause,
        setSpeedMultiplier,
        addCheckpoint,
        toggleSealTamper,
        createShipment,
        deleteShipment,
        quoteInquiries,
        addQuoteInquiry,
        updateQuoteStatus,
        vaultHoldings,
        requestVaultTransit,
        simulationSettings,
        setSimulationSettings,
        resetToDefaults,
      }}
    >
      {children}
    </ShipmentsContext.Provider>
  )
}

export function useShipments() {
  const context = useContext(ShipmentsContext)
  if (!context) {
    throw new Error('useShipments must be used within a ShipmentsProvider')
  }
  return context
}
