'use client'

import React, { useState, useEffect } from 'react'
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
  KeyRound,
  FileText,
} from 'lucide-react'
import { Shipment } from '@/lib/types'

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
  onSaved: () => void
}

export function EditUserConsignmentModal({
  isOpen,
  onClose,
  user,
  shipment,
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
  const [eta, setEta] = useState('17/09/26')
  const [declaredValue, setDeclaredValue] = useState('$16,355.00 USD')
  const [carrierFlightNumber, setCarrierFlightNumber] = useState('AV-US-93901 / SPECIE-AIR')
  const [custodyOfficer, setCustodyOfficer] = useState('Chief Flight Marshal D. Miller (ID: #US-AIR-410)')
  const [status, setStatus] = useState('In Transit — Chartered Air-Specie Corridor')

  // Radar Telemetry state
  const [progress, setProgress] = useState(55)
  const [isPaused, setIsPaused] = useState(false)
  const [speedMultiplier, setSpeedMultiplier] = useState<1 | 4 | 10>(1)

  // Status & Feedback
  const [isSaving, setIsSaving] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [activeTab, setActiveTab] = useState<'consignment' | 'radar' | 'profile'>('consignment')

  // Initialize fields from existing shipment or intelligent defaults
  useEffect(() => {
    if (!user) return

    setName(user.name || '')
    setEmail(user.email || '')
    setPassword('')
    setOrganization(user.organization || 'Swiss Private Depository Client')
    setSecurityClearance(user.security_clearance || 'ALLOCATED SOVEREIGN DEPOSITOR')
    setClientCode(user.client_code || `CLIENT-${user.name.split(' ').pop()?.toUpperCase() || 'VAULT'}`)

    if (shipment) {
      setShipperName(shipment.shipperName || user.name || 'Linda S Hudson')
      setOrigin(shipment.origin?.city || 'Indiana')
      setShipperAddress(shipment.shipperAddress || shipment.origin?.facility?.split('(Shipper:')[0]?.trim() || 'State: Hanover. Pk. Illinois 1365. Fremont Dr. Zip code :60133.')
      setShipperPhone(shipment.shipperPhone || '+1 (470) 305-9614')

      setReceiverName(shipment.receiverName || 'Chris Bucksath')
      setReceiverContact(shipment.receiverContact || '+1 (859) 907-3706')
      setReceiverAddress(shipment.receiverAddress || shipment.destination?.facility?.split('(Receiver:')[0]?.trim() || '321 Pimlico Ct Crittenden Ky 41030')
      setDestination(shipment.destination?.city || 'Kentucky')

      setShippingWeight(shipment.shippingWeight || shipment.manifest?.grossWeight || '93.9 g')
      setEta(shipment.eta || '17/09/26')
      setDeclaredValue(shipment.manifest?.declaredValue || '$16,355.00 USD')
      setCarrierFlightNumber(shipment.carrierFlightNumber || 'AV-US-93901 / SPECIE-AIR')
      setCustodyOfficer(shipment.custodyOfficer || 'Chief Flight Marshal D. Miller (ID: #US-AIR-410)')
      setStatus(shipment.status || 'In Transit — Chartered Air-Specie Corridor')

      setProgress(shipment.progress ?? 55)
      setIsPaused(Boolean(shipment.isPaused))
      setSpeedMultiplier((shipment.speedMultiplier as 1 | 4 | 10) || 1)
    } else {
      // Default initial consignment values
      setShipperName(user.name || 'Linda S Hudson')
      setOrigin('Indiana')
      setShipperAddress('State: Hanover. Pk. Illinois 1365. Fremont Dr. Zip code :60133.')
      setShipperPhone('+1 (470) 305-9614')

      setReceiverName('Chris Bucksath')
      setReceiverContact('+1 (859) 907-3706')
      setReceiverAddress('321 Pimlico Ct Crittenden Ky 41030')
      setDestination('Kentucky')

      setShippingWeight('93.9 g')
      setEta('17/09/26')
      setDeclaredValue('$16,355.00 USD')
      setCarrierFlightNumber('AV-US-93901 / SPECIE-AIR')
      setCustodyOfficer('Chief Flight Marshal D. Miller (ID: #US-AIR-410)')
      setStatus('In Transit — Chartered Air-Specie Corridor')
      setProgress(55)
      setIsPaused(false)
      setSpeedMultiplier(1)
    }
  }, [user, shipment])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setFeedback(null)

    try {
      // 1. Update user profile and consignment in one coordinated API call
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
            eta,
            status,
            progress,
            isPaused,
            speedMultiplier,
            carrierFlightNumber,
            custodyOfficer,
            declaredValue,
          },
        }),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to commit updates to database')
      }

      setFeedback({
        type: 'success',
        message: '✓ User account & dedicated consignment ledger updated successfully in SQLite!',
      })

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

              {/* Shipper & Origin Box */}
              <div className="rounded-2xl border border-[#242833] bg-[#12151e] p-5 space-y-4">
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#dfba6c] uppercase tracking-wider">
                  <MapPin size={15} />
                  <span>1. Shipper & Origin Information</span>
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
                      placeholder="e.g. Linda S Hudson"
                      className="w-full rounded-xl border border-[#2a2f3d] bg-[#161a24] px-3.5 py-2.5 text-white focus:border-[#dfba6c] focus:outline-none font-sans"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-gray-400 mb-1">
                      Origin State / City:
                    </label>
                    <input
                      type="text"
                      value={origin}
                      onChange={e => setOrigin(e.target.value)}
                      placeholder="e.g. Indiana"
                      className="w-full rounded-xl border border-[#2a2f3d] bg-[#161a24] px-3.5 py-2.5 text-white focus:border-[#dfba6c] focus:outline-none font-sans"
                      required
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
                      placeholder="e.g. State: Hanover. Pk. Illinois 1365. Fremont Dr. Zip code :60133."
                      className="w-full rounded-xl border border-[#2a2f3d] bg-[#161a24] px-3.5 py-2.5 text-white focus:border-[#dfba6c] focus:outline-none font-sans"
                      required
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
                      placeholder="e.g. +1 (470) 305-9614"
                      className="w-full rounded-xl border border-[#2a2f3d] bg-[#161a24] px-3.5 py-2.5 text-white focus:border-[#dfba6c] focus:outline-none font-mono"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Receiver & Destination Box */}
              <div className="rounded-2xl border border-[#242833] bg-[#12151e] p-5 space-y-4">
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#dfba6c] uppercase tracking-wider">
                  <User size={15} />
                  <span>2. Designated Receiver & Destination</span>
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
                      placeholder="e.g. Chris Bucksath"
                      className="w-full rounded-xl border border-[#2a2f3d] bg-[#161a24] px-3.5 py-2.5 text-white focus:border-[#dfba6c] focus:outline-none font-sans"
                      required
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
                      placeholder="e.g. +1 (859) 907-3706"
                      className="w-full rounded-xl border border-[#2a2f3d] bg-[#161a24] px-3.5 py-2.5 text-white focus:border-[#dfba6c] focus:outline-none font-mono"
                      required
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
                      placeholder="e.g. 321 Pimlico Ct Crittenden Ky 41030"
                      className="w-full rounded-xl border border-[#2a2f3d] bg-[#161a24] px-3.5 py-2.5 text-white focus:border-[#dfba6c] focus:outline-none font-sans"
                      required
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
                      placeholder="e.g. Kentucky"
                      className="w-full rounded-xl border border-[#2a2f3d] bg-[#161a24] px-3.5 py-2.5 text-white focus:border-[#dfba6c] focus:outline-none font-sans"
                      required
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
                      Shipping Weight:
                    </label>
                    <input
                      type="text"
                      value={shippingWeight}
                      onChange={e => setShippingWeight(e.target.value)}
                      placeholder="e.g. 93.9 g"
                      className="w-full rounded-xl border border-[#2a2f3d] bg-[#161a24] px-3.5 py-2.5 text-white focus:border-[#dfba6c] focus:outline-none font-mono font-bold"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-gray-400 mb-1">
                      Estimated Delivery Date (ETA):
                    </label>
                    <input
                      type="text"
                      value={eta}
                      onChange={e => setEta(e.target.value)}
                      placeholder="e.g. 17/09/26"
                      className="w-full rounded-xl border border-[#2a2f3d] bg-[#161a24] px-3.5 py-2.5 text-white focus:border-[#dfba6c] focus:outline-none font-mono"
                      required
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
                      placeholder="e.g. $16,355.00 USD"
                      className="w-full rounded-xl border border-[#2a2f3d] bg-[#161a24] px-3.5 py-2.5 text-white focus:border-[#dfba6c] focus:outline-none font-mono"
                    />
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

                  <div className="sm:col-span-2">
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
                      onClick={() => setIsPaused(!isPaused)}
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
                    <div className="flex items-center gap-2">
                      {([1, 4, 10] as const).map(spd => (
                        <button
                          key={spd}
                          type="button"
                          onClick={() => setSpeedMultiplier(spd)}
                          className={`flex-1 rounded-xl py-2.5 text-xs font-mono font-bold transition border ${
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

              {/* Mission Stage Selector */}
              <div className="rounded-2xl border border-[#242833] bg-[#12151e] p-5 space-y-3">
                <label className="block text-xs font-mono font-bold text-[#dfba6c] uppercase tracking-wider">
                  Operational Mission Status Stage:
                </label>
                <div className="grid gap-2 sm:grid-cols-2 text-xs">
                  {[
                    { label: 'In Transit — Chartered Air-Specie Corridor', type: 'in-flight' },
                    { label: 'Vault Staging & Assay Verified', type: 'staging' },
                    { label: 'In Transit — Armored Ground Convoy', type: 'in-flight' },
                    { label: 'Bonded Customs Clearance in Progress', type: 'customs' },
                    { label: 'Delivered — Verified Handover Complete', type: 'delivered' },
                  ].map(stage => (
                    <button
                      key={stage.label}
                      type="button"
                      onClick={() => setStatus(stage.label)}
                      className={`p-3 rounded-xl border text-left transition font-mono ${
                        status === stage.label
                          ? 'border-[#dfba6c] bg-[#dfba6c]/15 text-[#dfba6c] font-bold'
                          : 'border-[#242833] bg-[#161a24] text-gray-300 hover:bg-[#1e2330]'
                      }`}
                    >
                      {stage.label}
                    </button>
                  ))}
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
