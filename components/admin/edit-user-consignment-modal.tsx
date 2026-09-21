'use client'

import React, { useState, useEffect, useRef } from 'react'
import {
  X,
  Shield,
  User,
  Plane,
  Radio,
  MapPin,
  Phone,
  Calendar,
  Weight,
  DollarSign,
  Lock,
  CheckCircle2,
  AlertCircle,
  Play,
  Pause,
  Gauge,
  Compass,
  ArrowRight,
  Sparkles,
  Building,
  Building2,
  Coins,
  Layers,
  KeyRound,
  FileText,
} from 'lucide-react'
import { Shipment, VaultHolding } from '@/lib/types'
import { parseWeightToOzt, formatGoldWeight, formatDeclaredValue, parseDeclaredValue } from '@/lib/weight-utils'

export interface DbUserRecordForModal {
  id: string
  name: string
  email: string
  role: 'admin' | 'client'
  client_code?: string | null
  organization?: string
  security_clearance?: string
  is_suspended?: number | boolean
  is_dashboard_locked?: number | boolean
  is_certificate_locked?: number | boolean
  notice_active?: number | boolean
  notice_title?: string | null
  notice_message?: string | null
}

interface EditUserConsignmentModalProps {
  isOpen: boolean
  onClose: () => void
  user: DbUserRecordForModal | null
  shipment?: Shipment | null
  vaultHoldings?: VaultHolding[]
  onSaved: () => void
}

export function EditUserConsignmentModal({
  isOpen,
  onClose,
  user,
  shipment,
  vaultHoldings = [],
  onSaved,
}: EditUserConsignmentModalProps) {
  if (!isOpen || !user) return null

  // User Identity state
  const [name, setName] = useState(user.name || '')
  const [email, setEmail] = useState(user.email || '')
  const [password, setPassword] = useState('')
  const [organization, setOrganization] = useState(user.organization || 'Swiss Private Depository Client')
  const [securityClearance, setSecurityClearance] = useState(user.security_clearance || 'ALLOCATED SOVEREIGN DEPOSITOR')
  const [clientCode, setClientCode] = useState(user.client_code || '')

  // Consignment Shipper state
  const [shipperName, setShipperName] = useState('')
  const [origin, setOrigin] = useState('')
  const [shipperAddress, setShipperAddress] = useState('')
  const [shipperPhone, setShipperPhone] = useState('')

  // Consignment Receiver state
  const [receiverName, setReceiverName] = useState('')
  const [receiverContact, setReceiverContact] = useState('')
  const [receiverAddress, setReceiverAddress] = useState('')
  const [destination, setDestination] = useState('')

  // Cargo & Flight state
  const [shippingWeight, setShippingWeight] = useState('93.9 g')
  const [eta, setEta] = useState('Pending Transit Orders')
  const [declaredValue, setDeclaredValue] = useState('$0.00 USD')
  const [carrierFlightNumber, setCarrierFlightNumber] = useState('PENDING DISPATCH')
  const [custodyOfficer, setCustodyOfficer] = useState('Senior Vault Depository Marshal')
  const [status, setStatus] = useState('Vault Staging & Depository Custody')

  // Depository Vault & Bullion Lots state (supports fluid backspacing & string while typing)
  const [vaultedLots, setVaultedLots] = useState<number | string>(1)
  const [vaultFacility, setVaultFacility] = useState('Geneva Freeport Deep Depository Tier-IV')
  const [bullionTitle, setBullionTitle] = useState('')

  // Radar Telemetry state
  const [progress, setProgress] = useState(0)
  const [isPaused, setIsPaused] = useState(true)
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1)

  // Status & Feedback
  const [isSaving, setIsSaving] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [activeTab, setActiveTab] = useState<'consignment' | 'vault' | 'radar' | 'profile'>('consignment')

  // Live Telemetry Broadcast state
  const [broadcastFeedback, setBroadcastFeedback] = useState<string | null>(null)
  const [isBroadcastingStage, setIsBroadcastingStage] = useState(false)

  // Track initialization key so background telemetry polling (every 1.5s) does NOT overwrite active edits!
  const lastInitializedKeyRef = useRef<string | null>(null)

  // Initialize fields from existing shipment or intelligent defaults ONCE when modal is opened for this user
  useEffect(() => {
    if (!isOpen || !user) {
      lastInitializedKeyRef.current = null
      return
    }

    const initKey = `${user.id}`
    if (lastInitializedKeyRef.current === initKey) {
      // Already initialized for this active modal session; do not wipe out admin's typing!
      return
    }
    lastInitializedKeyRef.current = initKey

    setName(user.name || '')
    setEmail(user.email || '')
    setPassword('')
    setOrganization(user.organization || 'Swiss Private Depository Client')
    setSecurityClearance(user.security_clearance || 'ALLOCATED SOVEREIGN DEPOSITOR')
    setClientCode(user.client_code || `CLIENT-${user.name.split(' ').pop()?.toUpperCase() || 'VAULT'}`)

    if (vaultHoldings && vaultHoldings.length > 0) {
      setVaultedLots(vaultHoldings.length)
      setVaultFacility(vaultHoldings[0].vaultFacility || 'Geneva Freeport Deep Depository Tier-IV')
      setBullionTitle(vaultHoldings[0].assetTitle || 'Allocated Investment-Grade Specie Package')
    } else {
      setVaultedLots(1)
      setVaultFacility('Geneva Freeport Deep Depository Tier-IV')
      setBullionTitle('Allocated Investment-Grade Specie Package')
    }

    if (shipment) {
      setShipperName(shipment.shipperName !== undefined ? shipment.shipperName : (user.name || ''))
      setOrigin(shipment.origin?.city || '')
      setShipperAddress(shipment.shipperAddress !== undefined ? shipment.shipperAddress : '')
      setShipperPhone(shipment.shipperPhone !== undefined ? shipment.shipperPhone : '')

      setReceiverName(shipment.receiverName !== undefined ? shipment.receiverName : '')
      setReceiverContact(shipment.receiverContact !== undefined ? shipment.receiverContact : '')
      setReceiverAddress(shipment.receiverAddress !== undefined ? shipment.receiverAddress : '')
      setDestination(shipment.destination?.city || '')

      setShippingWeight(shipment.shippingWeight || shipment.manifest?.grossWeight || '93.9 g')
      setEta(shipment.eta || '')
      setDeclaredValue(shipment.manifest?.declaredValue !== undefined ? formatDeclaredValue(shipment.manifest.declaredValue) : '$0.00 USD')
      setCarrierFlightNumber(shipment.carrierFlightNumber || '')
      setCustodyOfficer(shipment.custodyOfficer || 'Senior Custody Officer')
      setStatus(shipment.status || 'Vault Staging & Depository Custody')

      setProgress(shipment.progress ?? 0)
      setIsPaused(Boolean(shipment.isPaused))
      setSpeedMultiplier(Number(shipment.speedMultiplier) || 1)
    } else {
      // Default initial consignment values (clean staging mode)
      setShipperName(user.name || '')
      setOrigin('Geneva Depository')
      setShipperAddress('')
      setShipperPhone('')

      setReceiverName('')
      setReceiverContact('')
      setReceiverAddress('')
      setDestination('Pending Destination Assignment')

      setShippingWeight('93.9 g')
      setEta('Pending Transit Orders')
      setDeclaredValue('$0.00 USD')
      setCarrierFlightNumber('PENDING DISPATCH')
      setCustodyOfficer('Senior Vault Depository Marshal')
      setStatus('Vault Staging & Depository Custody')
      setProgress(0)
      setIsPaused(true)
      setSpeedMultiplier(1)
    }
  }, [isOpen, user?.id])

  const MISSION_STAGES = [
    {
      label: 'In Transit — Chartered Air-Specie Corridor',
      type: 'in-flight' as const,
      progress: 60,
      shortTitle: 'Airborne Flight',
      description: 'Dedicated air corridor flight transit with continuous satellite transponder downlinks.',
      badgeClass: 'bg-[#dfba6c]/15 border-[#dfba6c]/30 text-[#dfba6c]',
    },
    {
      label: 'Vault Staging & Assay Verified',
      type: 'staging' as const,
      progress: 15,
      shortTitle: 'Vault Staging',
      description: 'Subterranean staging vault release & dual-officer bar assay verification.',
      badgeClass: 'bg-blue-500/15 border-blue-500/30 text-blue-300',
    },
    {
      label: 'In Transit — Armored Ground Convoy',
      type: 'in-flight' as const,
      progress: 35,
      shortTitle: 'Armored Convoy',
      description: 'Level-B6 armored carrier inter-state ground transit under dual-armed escort.',
      badgeClass: 'bg-amber-500/15 border-amber-500/30 text-amber-300',
    },
    {
      label: 'Bonded Customs Clearance in Progress',
      type: 'customs' as const,
      progress: 85,
      shortTitle: 'Customs Hold',
      description: 'Diplomatic / bonded federal airside customs clearance & seal validation.',
      badgeClass: 'bg-orange-500/15 border-orange-500/30 text-orange-300',
    },
    {
      label: 'Delivered — Verified Handover Complete',
      type: 'delivered' as const,
      progress: 100,
      shortTitle: 'Delivered Handover',
      description: 'Dual biometric signature confirmed. Final physical parcel handover complete.',
      badgeClass: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300',
    },
  ]

  const handleSelectStage = async (stage: (typeof MISSION_STAGES)[number]) => {
    setStatus(stage.label)
    setProgress(stage.progress)
    const shouldPause = stage.type === 'delivered'
    if (shouldPause) {
      setIsPaused(true)
    }

    setIsBroadcastingStage(true)
    setBroadcastFeedback(null)

    try {
      const targetClientCode = clientCode || user.client_code
      const targetShipId =
        shipment?.id ||
        (targetClientCode ? `GOLD-2026-${targetClientCode.replace(/[^A-Z0-9]/gi, '')}` : undefined)

      // 1. Broadcast immediately to /api/telemetry
      await fetch('/api/telemetry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shipmentId: targetShipId,
          clientCode: targetClientCode,
          progress: stage.progress,
          isPaused: shouldPause ? true : isPaused,
          speedMultiplier,
          status: stage.label,
        }),
      })

      // 2. Persist to shipments table via /api/admin/users
      await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: user.id,
          userId: user.id,
          action: 'update_profile',
          shipmentId: targetShipId,
          clientCode: targetClientCode,
          consignment: {
            status: stage.label,
            statusType: stage.type,
            progress: stage.progress,
            isPaused: shouldPause ? true : isPaused,
          },
        }),
      })

      setBroadcastFeedback(`✓ Live on client radar: ${stage.label}`)
      onSaved()
      setTimeout(() => setBroadcastFeedback(null), 4500)
    } catch (err) {
      console.error('Failed to broadcast stage:', err)
      setBroadcastFeedback('⚠️ Broadcast error. Saved locally.')
    } finally {
      setIsBroadcastingStage(false)
    }
  }

  const handleBroadcastCurrentRadarState = async () => {
    setIsBroadcastingStage(true)
    setBroadcastFeedback(null)

    try {
      const targetClientCode = clientCode || user.client_code
      const targetShipId =
        shipment?.id ||
        (targetClientCode ? `GOLD-2026-${targetClientCode.replace(/[^A-Z0-9]/gi, '')}` : undefined)

      let derivedStatusType = 'in-flight'
      if (status.toLowerCase().includes('deliver')) derivedStatusType = 'delivered'
      else if (status.toLowerCase().includes('custom')) derivedStatusType = 'customs'
      else if (status.toLowerCase().includes('staging')) derivedStatusType = 'staging'

      // 1. Broadcast to /api/telemetry
      await fetch('/api/telemetry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shipmentId: targetShipId,
          clientCode: targetClientCode,
          progress,
          isPaused,
          speedMultiplier,
          status,
        }),
      })

      // 2. Persist to shipments table via /api/admin/users
      await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: user.id,
          userId: user.id,
          action: 'update_profile',
          shipmentId: targetShipId,
          clientCode: targetClientCode,
          consignment: {
            status,
            statusType: derivedStatusType,
            progress,
            isPaused,
            speedMultiplier,
          },
        }),
      })

      setBroadcastFeedback(`✓ Telemetry broadcast live: ${status} (${progress}%)`)
      onSaved()
      setTimeout(() => setBroadcastFeedback(null), 4500)
    } catch (err) {
      console.error('Failed to broadcast radar state:', err)
      setBroadcastFeedback('⚠️ Broadcast failed. Check network.')
    } finally {
      setIsBroadcastingStage(false)
    }
  }

  const handleTogglePauseDirect = async (newPaused: boolean) => {
    setIsPaused(newPaused)
    setIsBroadcastingStage(true)
    setBroadcastFeedback(null)

    try {
      const targetClientCode = clientCode || user.client_code
      const targetShipId =
        shipment?.id ||
        (targetClientCode ? `GOLD-2026-${targetClientCode.replace(/[^A-Z0-9]/gi, '')}` : undefined)

      let derivedStatusType = 'in-flight'
      if (status.toLowerCase().includes('deliver')) derivedStatusType = 'delivered'
      else if (status.toLowerCase().includes('custom')) derivedStatusType = 'customs'
      else if (status.toLowerCase().includes('staging')) derivedStatusType = 'staging'

      // 1. Instant broadcast to /api/telemetry
      await fetch('/api/telemetry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shipmentId: targetShipId,
          clientCode: targetClientCode,
          progress,
          isPaused: newPaused,
          speedMultiplier,
          status,
        }),
      })

      // 2. Persist to shipments table via /api/admin/users
      await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: user.id,
          userId: user.id,
          action: 'update_profile',
          shipmentId: targetShipId,
          clientCode: targetClientCode,
          consignment: {
            status,
            statusType: derivedStatusType,
            progress,
            isPaused: newPaused,
            speedMultiplier,
          },
        }),
      })

      setBroadcastFeedback(newPaused ? '✓ Flight frozen on radar (Standby Hold)' : '✓ Flight live tracking resumed (Smooth Cruise)')
      onSaved()
      setTimeout(() => setBroadcastFeedback(null), 4500)
    } catch (err) {
      console.error('Failed to toggle play/pause:', err)
      setBroadcastFeedback('⚠️ Toggle error. Try again.')
    } finally {
      setIsBroadcastingStage(false)
    }
  }

  const handleSpeedDirect = async (newSpeed: number) => {
    setSpeedMultiplier(newSpeed)
    setIsBroadcastingStage(true)
    setBroadcastFeedback(null)

    try {
      const targetClientCode = clientCode || user.client_code
      const targetShipId =
        shipment?.id ||
        (targetClientCode ? `GOLD-2026-${targetClientCode.replace(/[^A-Z0-9]/gi, '')}` : undefined)

      await fetch('/api/telemetry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shipmentId: targetShipId,
          clientCode: targetClientCode,
          speedMultiplier: newSpeed,
        }),
      })

      setBroadcastFeedback(`✓ Radar speed set to ${newSpeed}x`)
      onSaved()
      setTimeout(() => setBroadcastFeedback(null), 4000)
    } catch (err) {
      console.error('Failed to update speed:', err)
    } finally {
      setIsBroadcastingStage(false)
    }
  }

  const handleProgressDirect = async (newProgress: number) => {
    setProgress(newProgress)
    try {
      const targetClientCode = clientCode || user.client_code
      const targetShipId =
        shipment?.id ||
        (targetClientCode ? `GOLD-2026-${targetClientCode.replace(/[^A-Z0-9]/gi, '')}` : undefined)

      await fetch('/api/telemetry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shipmentId: targetShipId,
          clientCode: targetClientCode,
          progress: newProgress,
          isPaused,
          speedMultiplier,
          status,
        }),
      })

      setBroadcastFeedback(`✓ Flight position set to ${newProgress}%`)
      onSaved()
      setTimeout(() => setBroadcastFeedback(null), 3500)
    } catch (err) {
      console.error('Failed to sync progress:', err)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setFeedback(null)

    try {
      const formattedVal = formatDeclaredValue(declaredValue)
      const numericVal = parseDeclaredValue(declaredValue)
      const finalLots = Math.max(1, Number(vaultedLots) || 1)

      let derivedStatusType = 'in-flight'
      if (status.toLowerCase().includes('deliver')) derivedStatusType = 'delivered'
      else if (status.toLowerCase().includes('custom')) derivedStatusType = 'customs'
      else if (status.toLowerCase().includes('staging')) derivedStatusType = 'staging'

      // 1. Update user profile, consignment, and vaulted lots in one coordinated API call
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: user.id,
          userId: user.id,
          action: 'update_profile',
          name,
          email,
          password: password.trim() ? password.trim() : undefined,
          organization,
          securityClearance,
          clientCode,
          shipmentId: shipment?.id,
          vaultedLots: finalLots,
          vaultFacility,
          goldWeight: shippingWeight,
          declaredValueUSD: numericVal,
          consignment: {
            shipperName,
            origin,
            shipperAddress,
            shipperPhone,
            receiverName,
            receiverContact,
            receiverAddress,
            destination,
            shippingWeight,
            vaultedLots: finalLots,
            vaultFacility,
            eta,
            status,
            statusType: derivedStatusType,
            progress,
            isPaused,
            speedMultiplier,
            carrierFlightNumber,
            custodyOfficer,
            declaredValue: formattedVal,
          },
        }),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to commit updates to database')
      }

      // 2. Direct synchronization with /api/vault-holdings for immediate reflection
      try {
        await fetch('/api/vault-holdings', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clientCode: clientCode || user.client_code,
            lotCount: finalLots,
            goldWeight: shippingWeight,
            declaredValueUSD: numericVal,
            vaultFacility,
          }),
        })
      } catch (vaultErr) {
        console.warn('Vault holdings sync fallback:', vaultErr)
      }

      // 3. Direct broadcast to /api/telemetry for real-time radar sync
      const targetShipId = shipment?.id || (data.user?.client_code ? `GOLD-2026-${data.user.client_code.replace(/[^A-Z0-9]/gi, '')}` : undefined)
      if (targetShipId) {
        try {
          await fetch('/api/telemetry', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              shipmentId: targetShipId,
              clientCode: clientCode || user.client_code,
              progress,
              isPaused,
              speedMultiplier,
              status,
            }),
          })
        } catch (telemetryErr) {
          console.warn('Telemetry broadcast fallback:', telemetryErr)
        }
      }

      setFeedback({
        type: 'success',
        message: '✓ User account, dedicated consignment, and vaulted lots ledger updated successfully in SQLite!',
      })

      // Reset initialized key so next open gets freshly persisted data
      lastInitializedKeyRef.current = null

      onSaved()
      setTimeout(() => {
        setFeedback(null)
      }, 4000)
    } catch (err: any) {
      console.error('Save failed:', err)
      setFeedback({
        type: 'error',
        message: err.message || 'Error communicating with Federal Database Gateway',
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-6 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-3xl border border-[#dfba6c]/40 bg-[#0e1117] shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col text-white">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#242833] bg-[#090c12] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-2xl bg-gradient-to-br from-[#dfba6c] to-[#a6802e] text-black flex items-center justify-center font-bold shadow-md">
              <Sparkles size={19} className="text-black" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif text-lg sm:text-xl font-bold text-white tracking-tight">
                  Configure User & Dedicated Consignment
                </h3>
                <span className="rounded-full bg-[#dfba6c]/15 border border-[#dfba6c]/30 px-2.5 py-0.5 text-[10px] font-mono font-bold text-[#dfba6c]">
                  {clientCode || 'CLIENT-VAULT'}
                </span>
              </div>
              <p className="text-xs text-gray-400 font-mono mt-0.5">
                Target User: <strong className="text-white">{user.name}</strong> ({user.email})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl p-2 text-gray-400 hover:text-white hover:bg-white/10 transition"
            aria-label="Close Modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-[#242833] bg-[#11141c] px-6 text-xs font-mono">
          <button
            type="button"
            onClick={() => setActiveTab('consignment')}
            className={`flex items-center gap-2 border-b-2 py-3.5 px-4 font-bold transition ${
              activeTab === 'consignment'
                ? 'border-[#dfba6c] text-[#dfba6c]'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <Plane size={15} />
            <span>Consignment & Shipper/Receiver</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('vault')}
            className={`flex items-center gap-2 border-b-2 py-3.5 px-4 font-bold transition ${
              activeTab === 'vault'
                ? 'border-[#dfba6c] text-[#dfba6c]'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <Coins size={15} />
            <span>Vaulted Lots & Gold Weight</span>
            <span className="rounded-full bg-[#dfba6c]/20 px-2 py-0.2 text-[10px] text-[#dfba6c] font-bold">
              {Math.max(1, Number(vaultedLots) || 1)}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('radar')}
            className={`flex items-center gap-2 border-b-2 py-3.5 px-4 font-bold transition ${
              activeTab === 'radar'
                ? 'border-[#dfba6c] text-[#dfba6c]'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <Radio size={15} />
            <span>Live Radar & Telemetry</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2 border-b-2 py-3.5 px-4 font-bold transition ${
              activeTab === 'profile'
                ? 'border-[#dfba6c] text-[#dfba6c]'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <User size={15} />
            <span>Account & Access Credentials</span>
          </button>
        </div>

        {/* Modal Body & Forms */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6">
          {feedback && (
            <div
              className={`rounded-2xl p-4 text-xs font-mono flex items-center gap-3 border ${
                feedback.type === 'success'
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                  : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
              }`}
            >
              {feedback.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
              <span>{feedback.message}</span>
            </div>
          )}

          {/* TAB 1: CONSIGNMENT DETAILS */}
          {activeTab === 'consignment' && (
            <div className="space-y-6">
              {/* Notice Banner */}
              <div className="rounded-2xl border border-[#262c3b] bg-[#141824] p-4 text-xs">
                <p className="text-gray-300 leading-relaxed font-sans">
                  Configure the designated <strong className="text-white">Shipper</strong>, <strong className="text-white">Receiver</strong>, and cargo manifest for this client. These details populate their live radar vector, interactive HUD, and Chain of Custody certificate.
                </p>
              </div>

              {/* Quick Mode Preset: Vault Staging ($0, Stationary) vs Air-Specie Transit */}
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-blue-500/30 bg-blue-500/10 p-3.5 text-xs font-mono">
                <div className="flex items-center gap-2">
                  <Building2 size={16} className="text-blue-400 shrink-0" />
                  <div>
                    <span className="text-white font-bold">Depository Staging Mode: </span>
                    <span className="text-gray-300">Gold held in static vault custody ($0.00 value &amp; transit fields unassigned until movement)</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setStatus('Vault Staging & Depository Custody')
                    setProgress(0)
                    setIsPaused(true)
                    setDeclaredValue('$0.00 USD')
                    setCarrierFlightNumber('PENDING DISPATCH')
                    setCustodyOfficer('Senior Vault Depository Marshal')
                    setEta('Pending Transit Orders')
                    setDestination('Pending Destination Assignment')
                    setReceiverName('')
                    setReceiverContact('')
                    setReceiverAddress('')
                  }}
                  className="rounded-xl bg-blue-500/25 border border-blue-500/50 px-3 py-1.5 text-xs font-bold text-blue-200 hover:bg-blue-500/40 transition shrink-0"
                >
                  ⚡ Set to Vault Staging ($0)
                </button>
              </div>

              {/* Shipper & Origin Box */}
              <div className="rounded-2xl border border-[#242833] bg-[#12151e] p-5 space-y-4">
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#dfba6c] uppercase tracking-wider">
                  <MapPin size={15} />
                  <span>1. Shipper &amp; Origin Information (Optional for Staging)</span>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 text-xs">
                  <div>
                    <label className="block text-[11px] font-mono text-gray-400 mb-1">
                      Shipper Name:
                    </label>
                    <input
                      type="text"
                      value={shipperName}
                      onChange={e => setShipperName(e.target.value)}
                      placeholder="Leave empty or enter shipper name"
                      className="w-full rounded-xl border border-[#2a2f3d] bg-[#161a24] px-3.5 py-2.5 text-white focus:border-[#dfba6c] focus:outline-none font-sans"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-gray-400 mb-1">
                      Origin State / City / Vault:
                    </label>
                    <input
                      type="text"
                      value={origin}
                      onChange={e => setOrigin(e.target.value)}
                      placeholder="e.g. Geneva Depository / Indiana"
                      className="w-full rounded-xl border border-[#2a2f3d] bg-[#161a24] px-3.5 py-2.5 text-white focus:border-[#dfba6c] focus:outline-none font-sans"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-mono text-gray-400 mb-1">
                      Shipper Address (Physical Handover Facility):
                    </label>
                    <input
                      type="text"
                      value={shipperAddress}
                      onChange={e => setShipperAddress(e.target.value)}
                      placeholder="Leave empty for staging or enter facility address"
                      className="w-full rounded-xl border border-[#2a2f3d] bg-[#161a24] px-3.5 py-2.5 text-white focus:border-[#dfba6c] focus:outline-none font-sans"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-gray-400 mb-1">
                      Phone Number (Shipper Contact):
                    </label>
                    <input
                      type="text"
                      value={shipperPhone}
                      onChange={e => setShipperPhone(e.target.value)}
                      placeholder="Leave empty or phone number"
                      className="w-full rounded-xl border border-[#2a2f3d] bg-[#161a24] px-3.5 py-2.5 text-white focus:border-[#dfba6c] focus:outline-none font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Receiver & Destination Box */}
              <div className="rounded-2xl border border-[#242833] bg-[#12151e] p-5 space-y-4">
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#dfba6c] uppercase tracking-wider">
                  <User size={15} />
                  <span>2. Designated Receiver &amp; Destination (Optional for Staging)</span>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 text-xs">
                  <div>
                    <label className="block text-[11px] font-mono text-gray-400 mb-1">
                      Receiver Name:
                    </label>
                    <input
                      type="text"
                      value={receiverName}
                      onChange={e => setReceiverName(e.target.value)}
                      placeholder="Leave empty for staging / pending assignment"
                      className="w-full rounded-xl border border-[#2a2f3d] bg-[#161a24] px-3.5 py-2.5 text-white focus:border-[#dfba6c] focus:outline-none font-sans"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-gray-400 mb-1">
                      Receiver Contact / Phone:
                    </label>
                    <input
                      type="text"
                      value={receiverContact}
                      onChange={e => setReceiverContact(e.target.value)}
                      placeholder="Leave empty or phone number"
                      className="w-full rounded-xl border border-[#2a2f3d] bg-[#161a24] px-3.5 py-2.5 text-white focus:border-[#dfba6c] focus:outline-none font-mono"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-mono text-gray-400 mb-1">
                      Receiver Address (Doorstep / Vault Final Handover):
                    </label>
                    <input
                      type="text"
                      value={receiverAddress}
                      onChange={e => setReceiverAddress(e.target.value)}
                      placeholder="Leave empty for staging or enter recipient address"
                      className="w-full rounded-xl border border-[#2a2f3d] bg-[#161a24] px-3.5 py-2.5 text-white focus:border-[#dfba6c] focus:outline-none font-sans"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-gray-400 mb-1">
                      Destination State / City:
                    </label>
                    <input
                      type="text"
                      value={destination}
                      onChange={e => setDestination(e.target.value)}
                      placeholder="Leave empty for staging / pending destination"
                      className="w-full rounded-xl border border-[#2a2f3d] bg-[#161a24] px-3.5 py-2.5 text-white focus:border-[#dfba6c] focus:outline-none font-sans"
                    />
                  </div>
                </div>
              </div>

              {/* Cargo Manifest & Dispatch Specs */}
              <div className="rounded-2xl border border-[#242833] bg-[#12151e] p-5 space-y-4">
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#dfba6c] uppercase tracking-wider">
                  <Weight size={15} />
                  <span>3. Cargo Manifest & Delivery Timeline</span>
                </div>

                <div className="grid gap-4 sm:grid-cols-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-mono text-gray-400 mb-1">
                      Fine Gold / Shipping Weight:
                    </label>
                    <input
                      type="text"
                      value={shippingWeight}
                      onChange={e => setShippingWeight(e.target.value)}
                      placeholder="e.g. 93.9 g"
                      className="w-full rounded-xl border border-[#2a2f3d] bg-[#161a24] px-3.5 py-2.5 text-white focus:border-[#dfba6c] focus:outline-none font-mono font-bold"
                      required
                    />
                    <div className="mt-1 text-[10px] text-[#dfba6c] font-mono flex items-center gap-1 truncate">
                      <span>➔ ~{formatGoldWeight(parseWeightToOzt(shippingWeight)).oztStr} ({formatGoldWeight(parseWeightToOzt(shippingWeight)).kgStr})</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-gray-400 mb-1">
                      Vaulted Lots (Audited Parcels):
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={vaultedLots}
                      onChange={e => setVaultedLots(e.target.value)}
                      onBlur={() => {
                        if (vaultedLots === '' || Number(vaultedLots) < 1) {
                          setVaultedLots(1)
                        }
                      }}
                      className="w-full rounded-xl border border-[#2a2f3d] bg-[#161a24] px-3.5 py-2.5 text-white focus:border-[#dfba6c] focus:outline-none font-mono font-bold"
                      required
                    />
                    <div className="mt-1 text-[10px] text-gray-400 font-mono">
                      <span>Client Dashboard: <strong className="text-[#dfba6c]">{Math.max(1, Number(vaultedLots) || 1)} Audited Parcels</strong></span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-gray-400 mb-1">
                      Estimated Delivery Date (ETA):
                    </label>
                    <input
                      type="text"
                      value={eta}
                      onChange={e => setEta(e.target.value)}
                      placeholder="e.g. Pending Transit Orders or 17/09/26"
                      className="w-full rounded-xl border border-[#2a2f3d] bg-[#161a24] px-3.5 py-2.5 text-white focus:border-[#dfba6c] focus:outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-gray-400 mb-1">
                      Declared Insured Value:
                    </label>
                    <input
                      type="text"
                      value={declaredValue}
                      onChange={e => setDeclaredValue(e.target.value)}
                      placeholder="e.g. $0.00 USD"
                      className="w-full rounded-xl border border-[#2a2f3d] bg-[#161a24] px-3.5 py-2.5 text-white focus:border-[#dfba6c] focus:outline-none font-mono font-bold"
                    />
                    <div className="mt-1 text-[10px] text-[#dfba6c] font-mono flex items-center gap-1 truncate">
                      <span>➔ {formatDeclaredValue(declaredValue)}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-gray-400 mb-1">
                      Flight / Convoy Carrier Call:
                    </label>
                    <input
                      type="text"
                      value={carrierFlightNumber}
                      onChange={e => setCarrierFlightNumber(e.target.value)}
                      placeholder="e.g. AV-US-93901 / SPECIE-AIR"
                      className="w-full rounded-xl border border-[#2a2f3d] bg-[#161a24] px-3.5 py-2.5 text-white focus:border-[#dfba6c] focus:outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-gray-400 mb-1">
                      Depository Vault Complex:
                    </label>
                    <select
                      value={vaultFacility}
                      onChange={e => setVaultFacility(e.target.value)}
                      className="w-full rounded-xl border border-[#2a2f3d] bg-[#161a24] px-3.5 py-2.5 text-white focus:border-[#dfba6c] focus:outline-none font-sans text-xs"
                    >
                      <option value="Geneva Freeport Deep Depository Tier-IV">Geneva Freeport Deep Depository Tier-IV (Geneva)</option>
                      <option value="Zurich Freeport High-Security Vault Complex B-12">Zurich Freeport Complex B-12 (Zurich)</option>
                      <option value="Midwest Inter-State Transit Hold (Hanover Park / Indiana)">Midwest Specie Depository (Hanover Park / Indiana)</option>
                      <option value="LBMA Bank of England Secure Vault Corridor">LBMA Bank of England Corridor (London)</option>
                      <option value="Singapore Le Freeport Sector 4 Specie Depository">Singapore Le Freeport Sector 4 (Singapore)</option>
                      <option value="Manhattan 5th Ave Private Vaults">Manhattan 5th Ave Private Vaults (New York)</option>
                    </select>
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-[11px] font-mono text-gray-400 mb-1">
                      Custody Escort Lead Officer:
                    </label>
                    <input
                      type="text"
                      value={custodyOfficer}
                      onChange={e => setCustodyOfficer(e.target.value)}
                      placeholder="e.g. Chief Flight Marshal D. Miller (ID: #US-AIR-410)"
                      className="w-full rounded-xl border border-[#2a2f3d] bg-[#161a24] px-3.5 py-2.5 text-white focus:border-[#dfba6c] focus:outline-none font-sans"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ALLOCATED VAULT & BULLION LOTS */}
          {activeTab === 'vault' && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-[#262c3b] bg-[#141824] p-4 text-xs">
                <p className="text-gray-300 leading-relaxed font-sans">
                  Configure this client's <strong className="text-white">Allocated Bullion Depository Holdings</strong>. Changing the <strong className="text-[#dfba6c]">Vaulted Lots</strong> count and <strong className="text-[#dfba6c]">Gold Weight</strong> will update their physical custody ledger in SQLite, reflect on their Client Portal, and update their fine gold total ({formatGoldWeight(parseWeightToOzt(shippingWeight)).summary}).
                </p>
              </div>

              <div className="rounded-2xl border border-[#242833] bg-[#12151e] p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-[#242833] pb-3">
                  <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#dfba6c] uppercase tracking-wider">
                    <Coins size={15} />
                    <span>Allocated Bullion Holdings & Parcel Count</span>
                  </div>
                  <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-3 py-0.5 text-[10px] font-mono font-bold text-emerald-400">
                    ● ALLOCATED PROPERTY
                  </span>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 text-xs">
                  <div>
                    <label className="block text-[11px] font-mono text-gray-400 mb-1">
                      Vaulted Lots (Audited Parcels Count):
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={vaultedLots}
                      onChange={e => setVaultedLots(e.target.value)}
                      onBlur={() => {
                        if (vaultedLots === '' || Number(vaultedLots) < 1) {
                          setVaultedLots(1)
                        }
                      }}
                      className="w-full rounded-xl border border-[#2a2f3d] bg-[#161a24] px-3.5 py-2.5 text-white focus:border-[#dfba6c] focus:outline-none font-mono font-bold"
                      required
                    />
                    <p className="text-[10px] text-gray-400 font-mono mt-1">
                      Displays on Client Dashboard as: <strong className="text-[#dfba6c]">{Math.max(1, Number(vaultedLots) || 1)} Audited Parcels</strong>
                    </p>
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-gray-400 mb-1">
                      Total Fine Gold Weight:
                    </label>
                    <input
                      type="text"
                      value={shippingWeight}
                      onChange={e => setShippingWeight(e.target.value)}
                      placeholder="e.g. 93.9 g"
                      className="w-full rounded-xl border border-[#2a2f3d] bg-[#161a24] px-3.5 py-2.5 text-white focus:border-[#dfba6c] focus:outline-none font-mono font-bold"
                      required
                    />
                    <p className="text-[10px] text-[#dfba6c] font-mono mt-1 flex items-center gap-1">
                      <Sparkles size={11} />
                      <span>{formatGoldWeight(parseWeightToOzt(shippingWeight)).summary}</span>
                    </p>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-mono text-gray-400 mb-1">
                      Vault Depository Facility:
                    </label>
                    <select
                      value={vaultFacility}
                      onChange={e => setVaultFacility(e.target.value)}
                      className="w-full rounded-xl border border-[#2a2f3d] bg-[#161a24] px-3.5 py-2.5 text-white focus:border-[#dfba6c] focus:outline-none font-sans text-xs"
                    >
                      <option value="Geneva Freeport Deep Depository Tier-IV">Geneva Freeport Deep Depository Tier-IV (Geneva, Switzerland)</option>
                      <option value="Zurich Freeport High-Security Vault Complex B-12">Zurich Freeport Complex B-12 (Zurich, Switzerland)</option>
                      <option value="Midwest Inter-State Transit Hold (Hanover Park / Indiana)">Midwest Inter-State Transit Hold (Hanover Park / Indiana, USA)</option>
                      <option value="LBMA Bank of England Secure Vault Corridor">LBMA Bank of England Secure Vault Corridor (London, UK)</option>
                      <option value="Singapore Le Freeport Sector 4 Specie Depository">Singapore Le Freeport Sector 4 Specie Depository (Singapore)</option>
                      <option value="Manhattan 5th Ave Private Vaults">Manhattan 5th Ave Private Vaults (New York, USA)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-gray-400 mb-1">
                      Bullion Asset Title / Description:
                    </label>
                    <input
                      type="text"
                      value={bullionTitle}
                      onChange={e => setBullionTitle(e.target.value)}
                      placeholder="e.g. Allocated 93.9g Investment-Grade Specie Package"
                      className="w-full rounded-xl border border-[#2a2f3d] bg-[#161a24] px-3.5 py-2.5 text-white focus:border-[#dfba6c] focus:outline-none font-sans"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-gray-400 mb-1">
                      Total Declared Valuation (USD):
                    </label>
                    <input
                      type="text"
                      value={declaredValue}
                      onChange={e => setDeclaredValue(e.target.value)}
                      placeholder="e.g. $0.00 USD"
                      className="w-full rounded-xl border border-[#2a2f3d] bg-[#161a24] px-3.5 py-2.5 text-white focus:border-[#dfba6c] focus:outline-none font-mono font-bold"
                    />
                    <div className="mt-1 text-[10px] text-[#dfba6c] font-mono flex items-center gap-1 truncate">
                      <span>➔ Per Lot: ${((parseDeclaredValue(declaredValue)) / Math.max(1, Number(vaultedLots) || 1)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD</span>
                    </div>
                  </div>
                </div>

                {/* Parcel preview cards */}
                <div className="mt-4 pt-4 border-t border-[#242833]">
                  {(() => {
                    const finalLotsCount = Math.max(1, Number(vaultedLots) || 1)
                    return (
                      <>
                        <span className="text-[11px] font-mono text-gray-400 block mb-2 font-bold uppercase tracking-wider">
                          Client Ledger Preview ({finalLotsCount} Audited {finalLotsCount === 1 ? 'Parcel' : 'Parcels'}):
                        </span>
                        <div className="grid gap-3 sm:grid-cols-2">
                          {Array.from({ length: Math.min(finalLotsCount, 4) }).map((_, idx) => {
                            const parcelOzt = (parseWeightToOzt(shippingWeight) / finalLotsCount).toFixed(2)
                            const parcelKg = ((parseWeightToOzt(shippingWeight) * 0.0311035) / finalLotsCount).toFixed(3)
                            return (
                              <div key={idx} className="rounded-xl border border-[#2a2f3d] bg-[#141822] p-3 text-xs space-y-1 font-mono">
                                <div className="flex items-center justify-between">
                                  <span className="text-[#dfba6c] font-bold">Parcel #{idx + 1}</span>
                                  <span className="text-emerald-400 text-[10px] font-bold">● VAULTED</span>
                                </div>
                                <div className="text-white font-sans text-xs font-semibold truncate">
                                  {bullionTitle || `Allocated Specie Parcel #${idx + 1}`}
                                </div>
                                <div className="text-gray-400 text-[10px]">
                                  Weight: <strong className="text-white">{parcelOzt} ozt</strong> ({parcelKg} kg)
                                </div>
                                <div className="text-gray-500 text-[10px] truncate">
                                  {vaultFacility.split('(')[0].trim()}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                        {finalLotsCount > 4 && (
                          <p className="text-[10px] text-gray-400 font-mono mt-2 text-center">
                            + {finalLotsCount - 4} additional audited parcels in Swiss Depository Ledger
                          </p>
                        )}
                      </>
                    )
                  })()}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: LIVE RADAR CONTROLS */}
          {activeTab === 'radar' && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-[#242833] bg-[#12151e] p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#dfba6c] uppercase tracking-wider">
                    <Gauge size={15} />
                    <span>Real-time Flight Telemetry & Radar Position</span>
                  </div>
                  <span className="font-mono text-sm font-bold text-white bg-[#1e2330] px-3 py-1 rounded-xl border border-[#2a2f3d]">
                    {progress}% Progress
                  </span>
                </div>

                {/* Progress Slider */}
                <div>
                  <label className="block text-[11px] font-mono text-gray-400 mb-2">
                    Corridor Handover Progress (0% Vault Release ➔ 100% Doorstep Handover):
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={progress}
                    onChange={e => setProgress(Number(e.target.value))}
                    onPointerUp={e => handleProgressDirect(Number((e.target as HTMLInputElement).value))}
                    onKeyUp={e => handleProgressDirect(Number((e.target as HTMLInputElement).value))}
                    className="w-full accent-[#dfba6c] h-2 bg-[#202532] rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-gray-400 mt-1.5">
                    <span>0% (Origin Vault)</span>
                    <span>50% (Cruising Mid-Flight)</span>
                    <span>100% (Delivered)</span>
                  </div>
                </div>

                {/* Play / Pause Toggle & Speed Multiplier */}
                <div className="grid gap-4 sm:grid-cols-2 pt-2 border-t border-[#242833]">
                  <div>
                    <label className="block text-[11px] font-mono text-gray-400 mb-1.5">
                      Radar Animation Status:
                    </label>
                    <button
                      type="button"
                      onClick={() => handleTogglePauseDirect(!isPaused)}
                      disabled={isBroadcastingStage}
                      className={`w-full flex items-center justify-center gap-2 rounded-xl py-2.5 px-4 text-xs font-mono font-bold transition border shadow-sm ${
                        isPaused
                          ? 'bg-amber-500/15 text-amber-300 border-amber-500/30 hover:bg-amber-500/25'
                          : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/25'
                      }`}
                    >
                      {isPaused ? <Pause size={15} /> : <Play size={15} />}
                      <span>{isPaused ? 'RADAR STANDBY (PAUSED)' : 'LIVE TRACKING (ACTIVE ANIMATION)'}</span>
                    </button>
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-gray-400 mb-1.5">
                      Radar Sweep Speed Multiplier:
                    </label>
                    <div className="flex items-center gap-1.5">
                      {([0.25, 0.5, 1, 2, 4] as const).map(spd => (
                        <button
                          key={spd}
                          type="button"
                          onClick={() => handleSpeedDirect(spd)}
                          disabled={isBroadcastingStage}
                          className={`flex-1 rounded-xl py-2 px-1 text-[11px] font-mono font-bold transition border ${
                            speedMultiplier === spd
                              ? 'bg-[#dfba6c] text-black border-[#dfba6c]'
                              : 'bg-[#161a24] text-gray-300 border-[#2a2f3d] hover:bg-[#1e2433]'
                          }`}
                        >
                          {spd}x
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Mission Stage Selector with Instant Live Radar Push */}
              <div className="rounded-2xl border border-[#242833] bg-[#12151e] p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#242833] pb-3">
                  <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#dfba6c] uppercase tracking-wider">
                    <Sparkles size={15} />
                    <span>Operational Mission Status Stage (Click to Broadcast Live)</span>
                  </div>
                  <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-[#dfba6c]/15 text-[#dfba6c] border border-[#dfba6c]/30 flex items-center gap-1.5 font-bold">
                    <span className="size-1.5 rounded-full bg-[#dfba6c] animate-pulse" />
                    Target Milestone: {progress}%
                  </span>
                </div>

                {/* Instant Feedback Alert */}
                {broadcastFeedback && (
                  <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/15 p-3 text-xs text-emerald-300 font-mono flex items-center justify-between animate-in fade-in">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                      <span>{broadcastFeedback}</span>
                    </div>
                    <span className="text-[10px] text-emerald-400/80 uppercase tracking-widest font-bold">● PUSHED LIVE</span>
                  </div>
                )}

                <p className="text-xs text-gray-400 font-sans leading-relaxed">
                  Clicking any operational stage below <strong className="text-white">instantly pushes</strong> that status and telemetry progress to the client's dashboard and live radar map in real-time.
                </p>

                <div className="grid gap-2.5 sm:grid-cols-2 text-xs">
                  {MISSION_STAGES.map(stage => {
                    const isSelected = status === stage.label
                    return (
                      <button
                        key={stage.label}
                        type="button"
                        onClick={() => handleSelectStage(stage)}
                        disabled={isBroadcastingStage}
                        className={`p-3.5 rounded-xl border text-left transition relative flex flex-col justify-between gap-2 group ${
                          isSelected
                            ? 'border-[#dfba6c] bg-[#dfba6c]/15 text-white shadow-lg ring-1 ring-[#dfba6c]/30'
                            : 'border-[#242833] bg-[#161a24] text-gray-300 hover:bg-[#1e2330] hover:border-[#384154]'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className={`font-mono text-xs font-bold ${isSelected ? 'text-[#dfba6c]' : 'text-white'}`}>
                            {stage.shortTitle}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${stage.badgeClass}`}>
                            {stage.progress}%
                          </span>
                        </div>

                        <div className="text-[11px] font-mono text-gray-300 line-clamp-1">
                          {stage.label}
                        </div>

                        <p className="text-[10px] text-gray-400 line-clamp-2 leading-relaxed font-sans">
                          {stage.description}
                        </p>

                        <div className="flex items-center justify-between pt-1 border-t border-[#222735] text-[10px] font-mono">
                          <span className={isSelected ? 'text-emerald-400 font-bold flex items-center gap-1' : 'text-gray-500'}>
                            {isSelected ? '● ACTIVE ON CLIENT RADAR' : 'Click to Set & Broadcast Live'}
                          </span>
                          <span className="text-[#dfba6c] font-bold group-hover:translate-x-0.5 transition">
                            ➔
                          </span>
                        </div>
                      </button>
                    )
                  })}
                </div>

                {/* Manual Push Button */}
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-[#242833]">
                  <p className="text-[11px] text-gray-400 font-mono">
                    Current Live Setting: <strong className="text-white">{status}</strong> ({progress}%)
                  </p>
                  <button
                    type="button"
                    onClick={handleBroadcastCurrentRadarState}
                    disabled={isBroadcastingStage}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#dfba6c] to-[#c29b43] px-4 py-2 text-xs font-bold text-black hover:opacity-95 transition shadow-md shrink-0 font-mono"
                  >
                    <Sparkles size={14} />
                    <span>{isBroadcastingStage ? 'Broadcasting to Radar...' : '⚡ Broadcast Live to Client Radar Now'}</span>
                  </button>
                </div>
              </div>

              {/* Vector Corridor Summary */}
              <div className="rounded-2xl border border-[#242833] bg-[#0b0e14] p-4 text-xs font-mono flex items-center justify-between text-gray-400">
                <div className="flex items-center gap-2">
                  <Compass size={16} className="text-[#dfba6c]" />
                  <span>
                    Vector: <strong className="text-white">{origin || 'Indiana'}</strong> ➔ <strong className="text-white">{destination || 'Kentucky'}</strong>
                  </span>
                </div>
                <span className="text-emerald-400">● 100% Air Corridor Compliant</span>
              </div>
            </div>
          )}

          {/* TAB 3: USER PROFILE & ACCESS */}
          {activeTab === 'profile' && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-[#242833] bg-[#12151e] p-5 space-y-4 text-xs">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-[11px] font-mono text-gray-400 mb-1">
                      Full Legal Client Name:
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      className="w-full rounded-xl border border-[#2a2f3d] bg-[#161a24] px-3.5 py-2.5 text-white focus:border-[#dfba6c] focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-gray-400 mb-1">
                      Official Email Address:
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full rounded-xl border border-[#2a2f3d] bg-[#161a24] px-3.5 py-2.5 text-white focus:border-[#dfba6c] focus:outline-none font-mono"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-gray-400 mb-1">
                      Reset Password (leave empty to keep current):
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Enter new password or leave blank"
                      className="w-full rounded-xl border border-[#2a2f3d] bg-[#161a24] px-3.5 py-2.5 text-white focus:border-[#dfba6c] focus:outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-gray-400 mb-1">
                      Client Allocation Code:
                    </label>
                    <input
                      type="text"
                      value={clientCode}
                      onChange={e => setClientCode(e.target.value)}
                      placeholder="e.g. CLIENT-HUDSON"
                      className="w-full rounded-xl border border-[#2a2f3d] bg-[#161a24] px-3.5 py-2.5 text-white focus:border-[#dfba6c] focus:outline-none font-mono font-bold text-[#dfba6c]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-gray-400 mb-1">
                      Sovereign Depository Organization:
                    </label>
                    <input
                      type="text"
                      value={organization}
                      onChange={e => setOrganization(e.target.value)}
                      className="w-full rounded-xl border border-[#2a2f3d] bg-[#161a24] px-3.5 py-2.5 text-white focus:border-[#dfba6c] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-gray-400 mb-1">
                      Security Clearance Level:
                    </label>
                    <input
                      type="text"
                      value={securityClearance}
                      onChange={e => setSecurityClearance(e.target.value)}
                      className="w-full rounded-xl border border-[#2a2f3d] bg-[#161a24] px-3.5 py-2.5 text-white focus:border-[#dfba6c] focus:outline-none font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Footer Save Actions */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[#242833] pt-5">
            <div className="text-xs text-gray-400 font-mono">
              Changes are immediately synced across all client devices and SQLite ledger.
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-[#2a2f3d] bg-[#161a24] px-5 py-2.5 text-xs font-semibold text-gray-300 hover:bg-[#1e2433] transition"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSaving}
                className="rounded-xl bg-gradient-to-r from-[#dfba6c] to-[#c29b43] px-6 py-2.5 text-xs font-bold text-black hover:opacity-95 transition shadow-lg shadow-[#c29b43]/20 flex items-center gap-2"
              >
                {isSaving ? (
                  <>
                    <span className="size-3.5 rounded-full border-2 border-black border-t-transparent animate-spin" />
                    <span>Committing to Ledger...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} />
                    <span>Save & Broadcast Updates</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
