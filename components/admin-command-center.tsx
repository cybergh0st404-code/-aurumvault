'use client'

import { useState, useEffect } from 'react'
import { useShipments } from '@/lib/shipments-context'
import { Shipment, Checkpoint } from '@/lib/types'
import { TrackingMap } from './tracking/tracking-map'
import { useAuth } from '@/lib/auth-context'
import { EditUserConsignmentModal } from './admin/edit-user-consignment-modal'
import {
  ShieldCheck,
  Radio,
  Activity,
  AlertTriangle,
  Lock,
  Unlock,
  Ban,
  PowerOff,
  ArrowRight,
  Plane,
  Truck,
  Building2,
  FileCheck,
  CheckCircle2,
  RefreshCw,
  Search,
  PlusCircle,
  Sliders,
  Play,
  Pause,
  RotateCcw,
  Check,
  Trash2,
  FileText,
  Clock,
  Sparkles,
  ExternalLink,
  ShieldAlert,
  Send,
  LogOut,
  Key,
  User,
  Menu,
  X,
  ChevronRight,
  LayoutDashboard,
  Coins,
  Compass,
  Gauge,
  Layers,
  Users,
  Bell,
  Eye,
  EyeOff,
  ArrowUpRight,
  Edit3,
  Copy,
  CheckCircle,
} from 'lucide-react'
import Link from 'next/link'

interface DbUser {
  id: string
  email: string
  name: string
  role: 'admin' | 'client'
  client_code: string | null
  organization: string
  avatar_initials: string
  security_clearance: string
  created_at: string
  is_suspended?: number | boolean
  is_dashboard_locked?: number | boolean
  is_certificate_locked?: number | boolean
  notice_active?: number | boolean
  notice_title?: string | null
  notice_message?: string | null
}

const vaultHubOptions = [
  { city: 'Geneva', country: 'Switzerland', code: 'GVA-FP', name: 'Geneva Freeport Complex B-12', coords: [46.2044, 6.1432] as [number, number] },
  { city: 'Zurich', country: 'Switzerland', code: 'ZRH-FP', name: 'Zurich Freeport Vault 7', coords: [47.3769, 8.5417] as [number, number] },
  { city: 'Dubai', country: 'UAE', code: 'DXB-DMCC', name: 'DMCC Vault Alpha-4', coords: [25.2048, 55.2708] as [number, number] },
  { city: 'London', country: 'UK', code: 'LHR-LBMA', name: 'LBMA Bank of England Corridor', coords: [51.5074, -0.1278] as [number, number] },
  { city: 'Singapore', country: 'Singapore', code: 'SIN-LEFP', name: 'Singapore Le Freeport Sector 4', coords: [1.3521, 103.8198] as [number, number] },
  { city: 'New York', country: 'USA', code: 'NYC-PV', name: 'Manhattan 5th Ave Private Vaults', coords: [40.7128, -74.0060] as [number, number] },
  { city: 'Antwerp', country: 'Belgium', code: 'ANR-AWDC', name: 'Antwerp World Diamond Centre', coords: [51.2194, 4.4025] as [number, number] },
  { city: 'Tokyo', country: 'Japan', code: 'TYO-GNZ', name: 'Tokyo Ginza Custody Vault', coords: [35.6762, 139.6503] as [number, number] },
]

export interface NoticePreset {
  label: string
  icon: string
  title: string
  message: string
  badge: string
}

export const NOTICE_PRESETS: NoticePreset[] = [
  {
    label: 'Doorstep Delivery Fee (US$3,400)',
    icon: '🪙',
    badge: 'FEE & SETTLEMENT',
    title: 'SHIPMENT PROCESSING NOTICE',
    message:
      'A total fee of US$3,400 is stated for final inspection, processing, and completion of doorstep delivery of the gold consignment. Payment instructions are to be issued separately.',
  },
  {
    label: 'Customs & Corridor Clearance Hold',
    icon: '🛡️',
    badge: 'CORRIDOR HOLD',
    title: 'CUSTOMS & CORRIDOR CLEARANCE HOLD',
    message:
      'Consignment is held at customs inspection corridor pending mandatory sovereign import documentation endorsement. Air-specie transfer will resume immediately upon clearance release.',
  },
  {
    label: 'Biometric & ID Re-verification',
    icon: '🔏',
    badge: 'SECURITY PROTOCOL',
    title: 'BIOMETRIC RE-VERIFICATION DIRECTIVE',
    message:
      'Dual photographic identification & biometric PIN signature are mandatory from the designated receiver prior to physical armored carrier release at doorstep handover.',
  },
  {
    label: 'Transit Corridor Weather Advisory',
    icon: '✈️',
    badge: 'AVIONICS ADVISORY',
    title: 'TRANSIT CORRIDOR ADVISORY',
    message:
      'Consignment routing has been temporarily held under armed escort protocol due to meteorological conditions along the designated air-specie corridor. Avionics downlinks remain active.',
  },
  {
    label: 'Custom Operational Directive',
    icon: '✏️',
    badge: 'CUSTOM DIRECTIVE',
    title: 'OPERATIONAL DIRECTIVE',
    message: '',
  },
]

export function AdminCommandCenter() {
  const {
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
    updateQuoteStatus,
    simulationSettings,
    setSimulationSettings,
    resetToDefaults,
    updateShipmentDetails,
    refreshShipmentsFromServer,
  } = useShipments()

  const { user, role, logout, quickLogin, login } = useAuth()
  const [adminEmail, setAdminEmail] = useState('')
  const [adminKey, setAdminKey] = useState('')
  const [showAdminKey, setShowAdminKey] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Edit User & Consignment Modal State
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<DbUser | null>(null)
  const [editUserModalOpen, setEditUserModalOpen] = useState(false)

  // Expandable initial consignment config in create user form
  const [expandConsignmentConfig, setExpandConsignmentConfig] = useState(false)
  const [newShipperName, setNewShipperName] = useState('')
  const [newOrigin, setNewOrigin] = useState('Indiana')
  const [newShipperAddress, setNewShipperAddress] = useState('State: Hanover. Pk. Illinois 1365. Fremont Dr.  Zip code :60133.')
  const [newShipperPhone, setNewShipperPhone] = useState('+1 (470) 305-9614')
  const [newReceiverName, setNewReceiverName] = useState('Chris Bucksath')
  const [newReceiverContact, setNewReceiverContact] = useState('+1 (859) 907-3706')
  const [newReceiverAddress, setNewReceiverAddress] = useState('321 Pimlico Ct Crittenden Ky 41030')
  const [newDestination, setNewDestination] = useState('Kentucky')
  const [newShippingWeight, setNewShippingWeight] = useState('93.9 g')
  const [newEta, setNewEta] = useState('17/09/26')

  const [activeTab, setActiveTab] = useState<'fleet' | 'dispatch' | 'quotes' | 'sensors' | 'users' | 'notices'>('fleet')
  const [filter, setFilter] = useState('all')

  // SQLite User Management State
  const [dbUsers, setDbUsers] = useState<DbUser[]>([])
  const [isLoadingUsers, setIsLoadingUsers] = useState(false)
  const [userActionFeedback, setUserActionFeedback] = useState<string | null>(null)

  // Notice Dispatcher Modal State
  const [selectedUserForNotice, setSelectedUserForNotice] = useState<DbUser | null>(null)
  const [noticeTitleInput, setNoticeTitleInput] = useState('SHIPMENT PROCESSING NOTICE')
  const [noticeMessageInput, setNoticeMessageInput] = useState(
    'A total fee of US$3,400 is stated for final inspection, processing, and completion of doorstep delivery of the gold consignment. Payment instructions are to be issued separately.'
  )
  const [isSubmittingNotice, setIsSubmittingNotice] = useState(false)
  const [modalPreviewMode, setModalPreviewMode] = useState<'edit' | 'preview'>('edit')

  // Dedicated Directives & Notices Tab State
  const clientUsers = dbUsers.filter(u => u.role === 'client')
  const [deckSelectedUserId, setDeckSelectedUserId] = useState<string>('')
  const deckSelectedUser = clientUsers.find(u => u.id === deckSelectedUserId) || clientUsers[0] || null

  const [deckNoticeTitle, setDeckNoticeTitle] = useState('SHIPMENT PROCESSING NOTICE')
  const [deckNoticeMessage, setDeckNoticeMessage] = useState(
    'A total fee of US$3,400 is stated for final inspection, processing, and completion of doorstep delivery of the gold consignment. Payment instructions are to be issued separately.'
  )
  const [deckPreviewMode, setDeckPreviewMode] = useState<'banner' | 'modal'>('banner')
  const [isSubmittingDeckNotice, setIsSubmittingDeckNotice] = useState(false)

  // Synchronize deck notice form when selected client changes
  useEffect(() => {
    if (deckSelectedUser) {
      setDeckNoticeTitle(deckSelectedUser.notice_title || 'SHIPMENT PROCESSING NOTICE')
      setDeckNoticeMessage(
        deckSelectedUser.notice_message ||
          'A total fee of US$3,400 is stated for final inspection, processing, and completion of doorstep delivery of the gold consignment. Payment instructions are to be issued separately.'
      )
    }
  }, [deckSelectedUser?.id, deckSelectedUser?.notice_title, deckSelectedUser?.notice_message])

  // Default deck client selection when clients load
  useEffect(() => {
    if (!deckSelectedUserId && clientUsers.length > 0) {
      setDeckSelectedUserId(clientUsers[0].id)
    }
  }, [clientUsers, deckSelectedUserId])

  const activeNoticesCount = dbUsers.filter(u => Boolean(u.notice_active)).length

  const adminNavItems = [
    { id: 'fleet', label: 'Active Fleet & Radar', icon: <Activity size={18} />, badge: shipments.length },
    { id: 'dispatch', label: 'Dispatch New Consignment', icon: <PlusCircle size={18} /> },
    { id: 'quotes', label: 'Client Quotation Dossiers', icon: <FileText size={18} />, badge: quoteInquiries.length },
    { id: 'sensors', label: 'Vault Radar & Sensor Health', icon: <Radio size={18} /> },
    { id: 'users', label: 'User Credentials & Security', icon: <Users size={18} />, badge: dbUsers.length > 0 ? dbUsers.length : undefined },
    { id: 'notices', label: 'Directives & Notices', icon: <Bell size={18} />, badge: activeNoticesCount > 0 ? activeNoticesCount : undefined },
  ]

  // New User Form State
  const [newUserName, setNewUserName] = useState('')
  const [newUserEmail, setNewUserEmail] = useState('')
  const [newUserPassword, setNewUserPassword] = useState('')
  const [newUserRole, setNewUserRole] = useState<'client' | 'admin'>('client')
  const [newUserClientCode, setNewUserClientCode] = useState('')
  const [newUserOrg, setNewUserOrg] = useState('')
  const [newUserClearance, setNewUserClearance] = useState('')

  const fetchUsers = async () => {
    setIsLoadingUsers(true)
    try {
      const res = await fetch('/api/admin/users')
      const data = await res.json()
      if (data && data.users) {
        setDbUsers(data.users)
      }
    } catch (err) {
      console.error('Failed to load SQLite users:', err)
    } finally {
      setIsLoadingUsers(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers()
    }
  }, [activeTab])

  const handleCreateUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setUserActionFeedback(null)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newUserName,
          email: newUserEmail,
          password: newUserPassword,
          role: newUserRole,
          clientCode: newUserClientCode || undefined,
          organization: newUserOrg || (newUserRole === 'admin' ? 'AurumVault Federal Operations Command' : 'Swiss Private Depository Client'),
          securityClearance: newUserClearance || (newUserRole === 'admin' ? 'LEVEL-V SWISS AIRSPACE COMMAND' : 'ALLOCATED VAULT DEPOSITOR'),
          consignment: newUserRole === 'client' ? {
            shipperName: newShipperName || newUserName,
            origin: newOrigin || 'Indiana',
            shipperAddress: newShipperAddress || 'State: Hanover. Pk. Illinois 1365. Fremont Dr.  Zip code :60133.',
            shipperPhone: newShipperPhone || '+1 (470) 305-9614',
            receiverName: newReceiverName || 'Chris Bucksath',
            receiverContact: newReceiverContact || '+1 (859) 907-3706',
            receiverAddress: newReceiverAddress || '321 Pimlico Ct Crittenden Ky 41030',
            destination: newDestination || 'Kentucky',
            shippingWeight: newShippingWeight || '93.9 g',
            eta: newEta || '17/09/26',
          } : undefined,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setUserActionFeedback('✓ New user credentials and dedicated consignment committed to SQLite!')
        setNewUserName('')
        setNewUserEmail('')
        setNewUserPassword('')
        setNewUserClientCode('')
        setNewUserOrg('')
        setNewUserClearance('')
        setNewShipperName('')
        setExpandConsignmentConfig(false)
        fetchUsers()
        if (refreshShipmentsFromServer) {
          refreshShipmentsFromServer()
        }
        setTimeout(() => setUserActionFeedback(null), 5000)
      } else {
        setUserActionFeedback(`Error: ${data.error || 'Failed to create user'}`)
      }
    } catch (err) {
      setUserActionFeedback('Error: Gateway connection failure')
    }
  }

  const handleDeleteUser = async (id: string, name: string) => {
    if (!confirm(`Revoke and delete credentials for ${name}? This action is immediate in SQLite.`)) return
    try {
      const res = await fetch(`/api/admin/users?id=${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        fetchUsers()
      } else {
        alert(data.error || 'Failed to delete user')
      }
    } catch (err) {
      console.error('Failed to delete user:', err)
    }
  }

  const handleUpdateRestriction = async (userId: string, action: string, updates?: Record<string, any>) => {
    try {
      const val = updates?.value ?? updates?.isDashboardLocked ?? updates?.isCertificateLocked ?? updates?.isSuspended
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: userId, userId, action, value: val, ...updates }),
      })
      const data = await res.json()
      if (data.success) {
        setUserActionFeedback(`✓ Operation "${action.replace(/_/g, ' ')}" updated on ledger.`)
        fetchUsers()
        setTimeout(() => setUserActionFeedback(null), 4000)
      } else {
        alert(data.error || 'Failed to update user security privilege')
      }
    } catch (err) {
      console.error('Restriction update failed:', err)
      alert('Network error communicating with Federal Auth Gateway')
    }
  }

  const handleToggleDashboardLock = (u: DbUser) => {
    const nextVal = !Boolean(u.is_dashboard_locked)
    handleUpdateRestriction(u.id, 'toggle_dashboard_lock', { isDashboardLocked: nextVal })
  }

  const handleToggleCertificateLock = (u: DbUser) => {
    const nextVal = !Boolean(u.is_certificate_locked)
    handleUpdateRestriction(u.id, 'toggle_certificate_lock', { isCertificateLocked: nextVal })
  }

  const handleToggleSuspend = (u: DbUser) => {
    const nextVal = !Boolean(u.is_suspended)
    const promptText = nextVal
      ? `Suspend account for ${u.name}? All active sessions will be terminated and access blocked.`
      : `Re-activate and lift suspension for ${u.name}?`
    if (!confirm(promptText)) return
    handleUpdateRestriction(u.id, 'toggle_suspend', { isSuspended: nextVal })
  }

  const handleRemoteLogout = (u: DbUser) => {
    if (!confirm(`Forcibly terminate all active sessions for ${u.name}? User will be logged out immediately.`)) return
    handleUpdateRestriction(u.id, 'logout_user')
  }

  const handleOpenNoticeModal = (u: DbUser) => {
    setSelectedUserForNotice(u)
    setNoticeTitleInput(u.notice_title || 'SHIPMENT PROCESSING NOTICE')
    setNoticeMessageInput(
      u.notice_message ||
        'A total fee of US$3,400 is stated for final inspection, processing, and completion of doorstep delivery of the gold consignment. Payment instructions are to be issued separately.'
    )
    setModalPreviewMode('edit')
  }

  const handleSelectUserForNoticeModal = (u: DbUser) => {
    setSelectedUserForNotice(u)
    setNoticeTitleInput(u.notice_title || 'SHIPMENT PROCESSING NOTICE')
    setNoticeMessageInput(
      u.notice_message ||
        'A total fee of US$3,400 is stated for final inspection, processing, and completion of doorstep delivery of the gold consignment. Payment instructions are to be issued separately.'
    )
  }

  const handleSaveNotice = async (activate: boolean) => {
    if (!selectedUserForNotice) return
    setIsSubmittingNotice(true)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedUserForNotice.id,
          action: 'set_notice',
          noticeActive: activate,
          noticeTitle: noticeTitleInput.trim() || 'SHIPMENT PROCESSING NOTICE',
          noticeMessage: noticeMessageInput.trim(),
        }),
      })
      const data = await res.json()
      if (data.success) {
        setUserActionFeedback(
          activate
            ? `✓ Notice directive activated and broadcasted to ${selectedUserForNotice.name}.`
            : `✓ Notice directive deactivated and withdrawn for ${selectedUserForNotice.name}.`
        )
        setSelectedUserForNotice(null)
        await fetchUsers()
        setTimeout(() => setUserActionFeedback(null), 4000)
      } else {
        alert(data.error || 'Failed to update user notice.')
      }
    } catch (err) {
      console.error('Failed to save notice:', err)
      alert('Network error updating user notice.')
    } finally {
      setIsSubmittingNotice(false)
    }
  }

  const handleSaveDeckNotice = async (activate: boolean) => {
    if (!deckSelectedUser) return
    setIsSubmittingDeckNotice(true)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: deckSelectedUser.id,
          action: 'set_notice',
          noticeActive: activate,
          noticeTitle: deckNoticeTitle.trim() || 'SHIPMENT PROCESSING NOTICE',
          noticeMessage: deckNoticeMessage.trim(),
        }),
      })
      const data = await res.json()
      if (data.success) {
        setUserActionFeedback(
          activate
            ? `✓ Operational notice activated & broadcasted to ${deckSelectedUser.name}.`
            : `✓ Operational notice withdrawn & deactivated for ${deckSelectedUser.name}.`
        )
        await fetchUsers()
        setTimeout(() => setUserActionFeedback(null), 4000)
      } else {
        alert(data.error || 'Failed to update user notice.')
      }
    } catch (err) {
      console.error('Failed to save deck notice:', err)
      alert('Network error updating user notice.')
    } finally {
      setIsSubmittingDeckNotice(false)
    }
  }

  const handleQuickToggleNotice = async (u: DbUser) => {
    const nextVal = !Boolean(u.notice_active)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: u.id,
          action: 'set_notice',
          noticeActive: nextVal,
          noticeTitle: u.notice_title || 'SHIPMENT PROCESSING NOTICE',
          noticeMessage:
            u.notice_message ||
            'A total fee of US$3,400 is stated for final inspection, processing, and completion of doorstep delivery of the gold consignment. Payment instructions are to be issued separately.',
        }),
      })
      const data = await res.json()
      if (data.success) {
        setUserActionFeedback(
          nextVal
            ? `✓ Notice activated for ${u.name}.`
            : `✓ Notice deactivated for ${u.name}.`
        )
        await fetchUsers()
        setTimeout(() => setUserActionFeedback(null), 4000)
      } else {
        alert(data.error || 'Failed to toggle notice.')
      }
    } catch (err) {
      console.error('Failed to toggle notice:', err)
      alert('Network error communicating with Federal Auth Gateway.')
    }
  }

  // Checkpoint creator form state
  const [cpTitle, setCpTitle] = useState('')
  const [cpFacility, setCpFacility] = useState('')
  const [cpLocation, setCpLocation] = useState('')
  const [cpOfficer, setCpOfficer] = useState('')
  const [cpNotes, setCpNotes] = useState('')
  const [cpAddedFeedback, setCpAddedFeedback] = useState(false)

  // New Consignment form state
  const [newId, setNewId] = useState('GOLD-2026-884019')
  const [newCategory, setNewCategory] = useState('Precious Metals & Bullion')
  const [newItemType, setNewItemType] = useState('999.9 Fine Gold Bullion Bars')
  const [newDescription, setNewDescription] = useState('Twenty (20) x 400 oz Investment-Grade Fine Gold Cast Bullion Bars.')
  const [newGrossWeight, setNewGrossWeight] = useState('800.25 ozt (24.89 kg)')
  const [newNetWeight, setNewNetWeight] = useState('800.18 ozt Fine Au')
  const [newFineness, setNewFineness] = useState('999.9 / 1000 Au')
  const [newDeclaredValue, setNewDeclaredValue] = useState('$2,360,000 USD')
  const [newOriginCode, setNewOriginCode] = useState('DXB-DMCC')
  const [newDestCode, setNewDestCode] = useState('GVA-FP')
  const [newTransportMode, setNewTransportMode] = useState('Chartered Air-Specie Convoy')
  const [newOfficer, setNewOfficer] = useState('Senior Escort Marshal V. Vontobel')
  const [newDispatchFeedback, setNewDispatchFeedback] = useState(false)

  const activeShipment = selectedShipment || shipments[0]

  const filteredShipments = shipments.filter(s => {
    if (filter === 'all') return true
    if (filter === 'in-flight') return s.statusType === 'in-flight'
    if (filter === 'customs') return s.statusType === 'customs'
    if (filter === 'delivered') return s.statusType === 'delivered'
    return true
  })

  // Handle adding a verified checkpoint
  const handleAddCheckpointSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeShipment || !cpTitle) return

    const now = new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })

    addCheckpoint(activeShipment.id, {
      timestamp: `${now} UTC`,
      title: cpTitle,
      location: cpLocation || activeShipment.origin.city,
      facility: cpFacility || activeShipment.origin.facility,
      status: 'completed',
      officer: cpOfficer || 'Senior Vault Marshal',
      officerId: `AV-OFFICER-${Math.floor(100 + Math.random() * 900)}`,
      sealId: activeShipment.telemetry.electronicSeal.id,
      notes: cpNotes || 'Custody inspection completed and verified on ledger.',
    })

    setCpTitle('')
    setCpFacility('')
    setCpLocation('')
    setCpOfficer('')
    setCpNotes('')
    setCpAddedFeedback(true)
    setTimeout(() => setCpAddedFeedback(false), 3000)
  }

  // Handle creating a new mission
  const handleCreateShipmentSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const orig = vaultHubOptions.find(h => h.code === newOriginCode) || vaultHubOptions[2]
    const dest = vaultHubOptions.find(h => h.code === newDestCode) || vaultHubOptions[0]

    const created: Shipment = {
      id: newId,
      trackingNumber: `AV-${orig.code.split('-')[0]}-${dest.code.split('-')[0]}-${Math.floor(10000 + Math.random() * 90000)}-X`,
      status: 'In Transit — Secure Air Corridor',
      statusType: 'in-flight',
      category: newCategory,
      origin: {
        city: orig.city,
        country: orig.country,
        facility: orig.name,
        code: orig.code,
        coords: orig.coords,
      },
      destination: {
        city: dest.city,
        country: dest.country,
        facility: dest.name,
        code: dest.code,
        coords: dest.coords,
      },
      currentLocation: {
        name: `${orig.city} to ${dest.city} Sovereign Air Corridor`,
        coords: [(orig.coords[0] + dest.coords[0]) / 2, (orig.coords[1] + dest.coords[1]) / 2],
        statusText: 'Cruising FL380 • Armed Specie Escort Monitored',
      },
      eta: '18:45 UTC (En-Route Flight Corridor FL380)',
      dispatchedAt: new Date().toISOString().slice(0, 10),
      transportMode: newTransportMode,
      carrierFlightNumber: 'AV-SPECIE-884',
      custodyOfficer: newOfficer,
      clientCode: 'CLIENT-STERLING',
      progress: 25,
      checkpoints: [
        {
          id: `cp-${Date.now()}`,
          timestamp: '11:00 UTC',
          title: 'Vault Extraction & Dual Seal Sign-off',
          location: orig.city,
          facility: orig.name,
          status: 'completed',
          officer: newOfficer,
          officerId: 'AV-MARSHAL-771',
          sealId: `AES-${Math.floor(10000 + Math.random() * 90000)}-CH`,
          notes: 'Ingots verified against LBMA assay certificates.',
        },
      ],
      telemetry: {
        electronicSeal: {
          id: `AES-${Math.floor(10000 + Math.random() * 90000)}-CH`,
          status: 'SECURE',
          battery: '98%',
          lastPing: '2s ago',
        },
        gForce: {
          current: 0.04,
          maxRecorded: 0.12,
          threshold: 1.5,
          unit: 'G',
        },
        lightExposure: {
          current: 0.0,
          status: 'SEALED_VAULT',
          unit: 'Lux',
        },
        temperature: {
          current: 19.4,
          min: 18.2,
          max: 20.8,
          unit: '°C',
        },
        gps: {
          lat: (orig.coords[0] + dest.coords[0]) / 2,
          lng: (orig.coords[1] + dest.coords[1]) / 2,
          altitude: '38,200 ft',
          speed: '518 kts',
          satellites: 16,
          signalStrength: '99.2%',
          geofenceStatus: 'CORRIDOR_COMPLIANT',
        },
        escort: {
          code: `TACTICAL-SPECIE-${Math.floor(10 + Math.random() * 90)}`,
          unit: 'Dual Armed Airborne Escort & Vault Marshals',
          protocol: 'Level IV Maximum Specie Escort',
        },
      },
      manifest: {
        itemType: newItemType,
        description: newDescription,
        grossWeight: newGrossWeight,
        netFineWeight: newNetWeight,
        fineness: newFineness,
        sealNumber: `AES-${Math.floor(10000 + Math.random() * 90000)}-CH`,
        assayLab: 'Argor-Heraeus SA / LBMA Refiners',
        assayCertNumber: `CERT-${Math.floor(10000 + Math.random() * 90000)}`,
        declaredValue: newDeclaredValue,
        underwriter: 'Lloyd’s of London Specie Syndicate #2003',
        policyNumber: `LL-SPECIE-${Math.floor(1000000 + Math.random() * 9000000)}`,
        securityTier: 'Level 4 Maximum Sovereign Specie Enclosure',
      },
    }

    createShipment(created)
    setNewId(`GOLD-2026-${Math.floor(100000 + Math.random() * 900000)}`)
    setNewDispatchFeedback(true)
    setTimeout(() => {
      setNewDispatchFeedback(false)
      setActiveTab('fleet')
    }, 1500)
  }

  // Convert Quote to Consignment
  const handleConvertQuote = (q: (typeof quoteInquiries)[0]) => {
    updateQuoteStatus(q.id, 'dispatched')
    setNewCategory(q.assetType.includes('Horology') ? 'Fine Horology & Watches' : 'Precious Metals & Bullion')
    setNewDeclaredValue(`$${q.declaredValue.toLocaleString()} USD`)
    setNewOriginCode(q.originCode)
    setNewDestCode(q.destinationCode)
    setActiveTab('dispatch')
  }

  // Security Gate if not authenticated as Admin
  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-[#0a0c10] text-[#f4f4f6] py-16 flex items-center justify-center px-4 relative overflow-hidden font-sans">
        {/* Subtle Ambient Gold Aura */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#dfba6c]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-lg rounded-3xl border border-[#242833] bg-[#0e1117] p-8 sm:p-10 shadow-2xl relative z-10">
          <div className="text-center mb-7">
            <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#dfba6c] to-[#916e25] text-black shadow-lg shadow-[#c29b43]/20">
              <ShieldAlert size={30} />
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-[#dfba6c]/30 bg-[#dfba6c]/10 px-3.5 py-1 text-[11px] font-semibold text-[#dfba6c] uppercase tracking-wider mb-3">
              <Lock size={12} />
              Sovereign Operations Gate
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Federal Specie Operations Desk
            </h2>
            <p className="text-xs text-gray-400 mt-2 max-w-sm mx-auto leading-relaxed">
              Restricted air-corridor command and dual-custody override terminal. Level-V security clearance required.
            </p>
          </div>

          {user && (
            <div className="mb-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-200">
              <p className="font-bold text-amber-300">Private Client Session Active</p>
              <p className="mt-1 text-gray-300">
                You are currently signed in as <strong>{user.name}</strong> ({user.clientCode}). Operations command requires Chief Marshal authentication.
              </p>
              <div className="mt-3 flex items-center gap-2">
                <Link
                  href="/portal"
                  className="rounded-xl bg-[#161a24] px-3.5 py-1.5 text-[11px] font-medium text-white border border-[#2a2f3d] hover:bg-[#1e2433] transition"
                >
                  Return to Client Depository →
                </Link>
                <button
                  type="button"
                  onClick={logout}
                  className="rounded-xl bg-red-500/15 border border-red-500/30 px-3.5 py-1.5 text-[11px] font-bold text-red-300 hover:bg-red-500/25 transition"
                >
                  Sign Out Client
                </button>
              </div>
            </div>
          )}

          {authError && (
            <div className="mb-5 rounded-2xl border border-red-500/40 bg-red-500/10 p-3.5 text-xs text-red-300">
              {authError}
            </div>
          )}

          <form
            onSubmit={async (e) => {
              e.preventDefault()
              setAuthError(null)
              setIsAuthenticating(true)
              try {
                const res = await login(adminEmail, adminKey)
                if (!res.success) {
                  setAuthError(res.error || 'Authentication rejected.')
                }
              } finally {
                setIsAuthenticating(false)
              }
            }}
            className="space-y-4 text-xs"
          >
            <div>
              <label className="font-mono font-bold uppercase tracking-wider text-gray-400 block mb-1.5">
                Marshal Officer ID / Email
              </label>
              <input
                required
                type="email"
                placeholder="admin@example.com"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                className="h-11 w-full rounded-xl border border-[#242833] bg-[#161a24] px-4 text-sm text-white font-mono focus:border-[#dfba6c] focus:outline-none transition"
              />
            </div>

            <div>
              <label className="font-mono font-bold uppercase tracking-wider text-gray-400 block mb-1.5">
                Cryptographic Key / Hardware Token
              </label>
              <div className="relative">
                <input
                  required
                  type={showAdminKey ? 'text' : 'password'}
                  placeholder="Enter confidential passkey"
                  value={adminKey}
                  onChange={(e) => setAdminKey(e.target.value)}
                  className="h-11 w-full rounded-xl border border-[#242833] bg-[#161a24] pl-4 pr-11 text-sm text-white font-mono focus:border-[#dfba6c] focus:outline-none transition"
                />
                <button
                  type="button"
                  onClick={() => setShowAdminKey(prev => !prev)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition p-1"
                  title={showAdminKey ? 'Hide password' : 'View password'}
                  aria-label={showAdminKey ? 'Hide password' : 'View password'}
                >
                  {showAdminKey ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isAuthenticating}
              className="w-full rounded-xl bg-gradient-to-r from-[#dfba6c] to-[#c29b43] py-3.5 text-xs sm:text-sm font-bold text-black hover:opacity-95 transition shadow-lg shadow-[#c29b43]/20"
            >
              {isAuthenticating ? 'Decrypting Clearance...' : 'Authenticate & Unlock Operations Desk'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#0a0c10] text-[#f4f4f6] font-sans antialiased">
      {/* MOBILE BACKDROP */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-md lg:hidden transition-opacity"
        />
      )}

      {/* OPERATIONS SIDEBAR */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 sm:w-80 flex-col border-r border-[#242833] bg-[#0e1117] transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Header */}
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
                Operations Desk
              </span>
            </div>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="rounded-lg p-1.5 text-gray-400 hover:text-white hover:bg-white/10 lg:hidden transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Officer Identity Card */}
        <div className="p-5 border-b border-[#242833] bg-gradient-to-b from-[#141822] to-[#0e1117]">
          <div className="flex items-center gap-3.5">
            <div className="relative flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#dfba6c] to-[#a6802e] text-black text-sm font-bold shadow-md shrink-0">
              {user?.avatarInitials || 'HW'}
              <span className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full bg-emerald-500 ring-2 ring-[#0e1117] animate-pulse" />
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="rounded bg-[#dfba6c]/15 px-2 py-0.5 text-[9px] font-mono font-bold text-[#dfba6c]">
                  HQ CHIEF MARSHAL
                </span>
                <span className="text-[10px] text-emerald-400 font-mono">
                  ACTIVE
                </span>
              </div>
            </div>
          </div>
          <div className="mt-3 rounded-xl bg-[#090b0f] border border-[#262b38] p-2.5">
            <p className="text-[10px] text-gray-400 font-mono truncate">
              CLEARANCE: <strong className="text-white">{user?.securityClearance || 'LEVEL-V SWISS AIRSPACE'}</strong>
            </p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 space-y-1.5 overflow-y-auto p-4 custom-scrollbar">
          <span className="px-3 text-[10px] font-semibold uppercase tracking-wider text-gray-500 block mb-2 font-mono">
            Station Control
          </span>
          {adminNavItems.map(item => {
            const isActive = activeTab === item.id
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id as typeof activeTab)
                  setSidebarOpen(false)
                }}
                className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-xs sm:text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-[#dfba6c] to-[#c29b43] text-black font-bold shadow-lg shadow-[#c29b43]/20 scale-[1.02]'
                    : 'text-gray-300 hover:bg-[#181d28] hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={isActive ? 'text-black' : 'text-[#dfba6c]'}>{item.icon}</span>
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-mono font-bold ${
                      isActive
                        ? 'bg-black/20 text-black'
                        : 'bg-[#222736] text-gray-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            )
          })}

          {/* Simulation Controls Panel */}
          <div className="pt-4 mt-4 border-t border-[#242833]">
            <span className="px-3 text-[10px] font-semibold uppercase tracking-wider text-gray-400 block mb-2.5 font-mono">
              Radar Simulation Controls
            </span>
            <div className="space-y-2 px-1">
              <button
                onClick={() => setSimulationSettings(s => ({ ...s, isCruising: !s.isCruising }))}
                className={`flex w-full items-center justify-center gap-2 rounded-xl border py-2 text-xs font-semibold transition ${
                  simulationSettings.isCruising
                    ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-400'
                    : 'border-[#242833] bg-[#161a24] text-gray-400 hover:text-white'
                }`}
              >
                {simulationSettings.isCruising ? <Play size={13} className="text-emerald-400" /> : <Pause size={13} />}
                <span>{simulationSettings.isCruising ? 'Auto-Cruising Active' : 'Radar Paused'}</span>
              </button>

              <div className="flex items-center justify-between rounded-xl border border-[#242833] bg-[#141822] p-1.5">
                <span className="text-[10px] font-mono text-gray-400 pl-2">Speed:</span>
                <div className="flex items-center gap-1">
                  {[1, 4, 10].map(speed => (
                    <button
                      key={speed}
                      onClick={() => setSimulationSettings(s => ({ ...s, cruiseSpeed: speed }))}
                      className={`rounded-lg px-2.5 py-1 text-[10px] font-mono font-bold transition ${
                        simulationSettings.cruiseSpeed === speed
                          ? 'bg-[#dfba6c] text-black shadow-sm'
                          : 'text-gray-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      {speed}x
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </nav>

        {/* Sidebar Bottom Controls */}
        <div className="border-t border-[#242833] p-4 space-y-2 bg-[#0a0d13]">
          <button
            onClick={resetToDefaults}
            className="flex w-full items-center justify-between rounded-xl px-3.5 py-2 text-xs font-medium text-gray-400 hover:bg-[#181d28] hover:text-white transition"
          >
            <div className="flex items-center gap-2.5">
              <RotateCcw size={14} className="text-[#dfba6c]" />
              <span>Reset Demo State</span>
            </div>
          </button>

          <Link
            href="/portal"
            className="flex w-full items-center justify-between rounded-xl px-3.5 py-2 text-xs font-medium text-gray-400 hover:bg-[#181d28] hover:text-white transition"
          >
            <div className="flex items-center gap-2.5">
              <Building2 size={14} className="text-[#dfba6c]" />
              <span>Client Depository</span>
            </div>
            <ChevronRight size={14} />
          </Link>

          <Link
            href="/"
            className="flex w-full items-center justify-between rounded-xl px-3.5 py-2 text-xs font-medium text-gray-400 hover:bg-[#181d28] hover:text-white transition"
          >
            <div className="flex items-center gap-2.5">
              <ExternalLink size={14} />
              <span>Public Website</span>
            </div>
            <ChevronRight size={14} />
          </Link>

          <button
            onClick={logout}
            className="flex w-full items-center justify-between rounded-xl px-3.5 py-2 text-xs font-medium text-red-400 hover:bg-red-500/10 transition"
          >
            <div className="flex items-center gap-2.5">
              <LogOut size={14} />
              <span>Sign Out Session</span>
            </div>
          </button>
        </div>
      </aside>

      {/* OPERATIONS MAIN WORKSPACE */}
      <div className="flex flex-1 flex-col overflow-hidden bg-[#0a0c10]">
        {/* Top Operations Station Bar */}
        <header className="sticky top-0 z-30 flex h-16 sm:h-20 items-center justify-between border-b border-[#242833] bg-[#0e1117]/90 px-4 sm:px-8 backdrop-blur-xl">
          <div className="flex items-center gap-3.5">
            <button
              onClick={() => setSidebarOpen(true)}
              className="rounded-xl border border-[#2a2f3d] bg-[#141822] p-2.5 text-white lg:hidden hover:bg-[#1a202d] transition"
              aria-label="Open Operations Menu"
            >
              <Menu size={20} />
            </button>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="font-serif text-lg sm:text-2xl font-bold text-white tracking-tight">
                  {adminNavItems.find(i => i.id === activeTab)?.label}
                </h2>
                <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-0.5 text-[10px] font-mono text-emerald-400 font-bold">
                  <span className="size-1.5 rounded-full bg-emerald-400 animate-ping" />
                  CORRIDORS NOMINAL • FL380
                </span>
              </div>
              <p className="text-[11px] text-gray-400 hidden sm:block font-mono mt-0.5">
                Geneva Operations Hub • {shipments.length} Active Sovereign Consignments
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3">
            <button
              onClick={() => setActiveTab('dispatch')}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#dfba6c] to-[#c29b43] px-3.5 sm:px-4 py-2 text-xs font-bold text-black hover:opacity-95 transition shadow-lg shadow-[#c29b43]/20"
            >
              <PlusCircle size={15} />
              <span className="hidden sm:inline">New Dispatch</span>
              <span className="sm:hidden">Dispatch</span>
            </button>

            <button
              onClick={logout}
              className="rounded-xl border border-[#2a2f3d] bg-[#141822] p-2 text-gray-400 hover:text-red-400 hover:border-red-500/30 transition"
              title="Sign Out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </header>

        {/* WORKSPACE CANVAS */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 custom-scrollbar">

        {/* TAB 1: FLEET & MISSION CONTROL */}
        {activeTab === 'fleet' && (
          <div className="space-y-8">
            {/* Mission Selector & Radar Cockpit */}
            {activeShipment && (
              <div className="rounded-3xl border border-[#242833] bg-[#11141c] p-5 sm:p-8 shadow-2xl space-y-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between border-b border-[#242833] pb-6">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xl sm:text-2xl font-bold text-white tracking-tight">
                        {activeShipment.id}
                      </span>
                      <span className="rounded-full border border-[#dfba6c]/30 bg-[#dfba6c]/10 px-3 py-1 text-xs font-bold font-mono text-[#dfba6c]">
                        {activeShipment.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1.5 font-mono">
                      Vector: <strong className="text-white">{activeShipment.origin.city}</strong> ({activeShipment.origin.code}) ➔ <strong className="text-white">{activeShipment.destination.city}</strong> ({activeShipment.destination.code}) • {activeShipment.transportMode}
                    </p>
                  </div>

                  {/* Consignment Switcher with User Labels & Direct Edit */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-mono text-gray-400 mr-1">Select Mission:</span>
                    {shipments.map(s => {
                      const matchingUser = dbUsers.find(u => u.client_code && u.client_code === s.clientCode)
                      const shipperDisplayName = s.shipperName || matchingUser?.name || s.id
                      return (
                        <button
                          key={s.id}
                          onClick={() => setSelectedShipmentId(s.id)}
                          className={`rounded-xl px-3 py-1.5 text-xs font-mono font-bold transition flex items-center gap-1.5 ${
                            activeShipment.id === s.id
                              ? 'bg-gradient-to-r from-[#dfba6c] to-[#c29b43] text-black shadow-md'
                              : 'border border-[#262c3b] bg-[#161a24] text-gray-300 hover:bg-[#1e2330] hover:text-white'
                          }`}
                        >
                          <span>{shipperDisplayName}</span>
                          <span className="text-[10px] opacity-75">({s.origin.city} ➔ {s.destination.city})</span>
                        </button>
                      )
                    })}
                    {(() => {
                      const clientUser = dbUsers.find(u => u.client_code && u.client_code === activeShipment.clientCode)
                      if (clientUser) {
                        return (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedUserForEdit(clientUser)
                              setEditUserModalOpen(true)
                            }}
                            className="rounded-xl border border-[#dfba6c]/40 bg-[#dfba6c]/10 px-3 py-1.5 text-xs font-mono font-bold text-[#dfba6c] hover:bg-[#dfba6c]/20 transition flex items-center gap-1.5 shadow-sm"
                            title="Edit this consignment's details, shipper, receiver, and radar controls"
                          >
                            <Edit3 size={13} />
                            <span>Edit Mission Details</span>
                          </button>
                        )
                      }
                      return null
                    })()}
                  </div>
                </div>

                {/* Live Radar Map with Admin Controls Enabled */}
                <div className="rounded-2xl border border-[#242833] overflow-hidden bg-[#0a0c10] shadow-xl">
                  <TrackingMap
                    shipment={activeShipment}
                    showAdminControls={true}
                    onProgressChange={p => updateShipmentProgress(activeShipment.id, p)}
                    onPlayPauseChange={playing => togglePlayPause(activeShipment.id, !playing)}
                    onSpeedChange={spd => setSpeedMultiplier(activeShipment.id, spd)}
                  />
                </div>

                {/* Operations Control Deck */}
                <div className="grid gap-6 lg:grid-cols-12 pt-2">
                  {/* Left: Mission Lifecycle & Flight Progress (7 cols) */}
                  <div className="space-y-6 lg:col-span-7">
                    {/* Lifecycle Stages */}
                    <div className="rounded-2xl border border-[#242833] bg-[#0e1117] p-5 sm:p-6 shadow-inner">
                      <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#dfba6c] mb-4 flex items-center gap-2">
                        <Activity size={15} />
                        <span>Advance Mission Lifecycle Stage</span>
                      </h4>
                      <div className="grid gap-2.5 sm:grid-cols-2">
                        <button
                          onClick={() => {
                            updateShipmentStatus(activeShipment.id, 'Vault Staging & Assay Verified', 'staging')
                            updateShipmentProgress(activeShipment.id, 15)
                          }}
                          className="rounded-xl border border-[#242833] bg-[#161a24] p-3.5 text-left hover:border-[#dfba6c]/60 hover:bg-[#1e2330] transition text-xs group"
                        >
                          <span className="font-semibold text-white block group-hover:text-[#dfba6c] transition">1. Vault Release</span>
                          <span className="text-[10px] text-gray-400 font-mono">Staged in bonded vault (15%)</span>
                        </button>

                        <button
                          onClick={() => {
                            updateShipmentStatus(activeShipment.id, 'In Transit — Armored Ground Convoy', 'in-flight')
                            updateShipmentProgress(activeShipment.id, 35)
                          }}
                          className="rounded-xl border border-[#242833] bg-[#161a24] p-3.5 text-left hover:border-[#dfba6c]/60 hover:bg-[#1e2330] transition text-xs group"
                        >
                          <span className="font-semibold text-white block group-hover:text-[#dfba6c] transition">2. Armored Convoy</span>
                          <span className="text-[10px] text-gray-400 font-mono">Level IV airside escort (35%)</span>
                        </button>

                        <button
                          onClick={() => {
                            updateShipmentStatus(activeShipment.id, 'In Transit — Secure Air Corridor', 'in-flight')
                            updateShipmentProgress(activeShipment.id, 68)
                          }}
                          className="rounded-xl border border-[#242833] bg-[#161a24] p-3.5 text-left hover:border-[#dfba6c]/60 hover:bg-[#1e2330] transition text-xs group"
                        >
                          <span className="font-semibold text-white block group-hover:text-[#dfba6c] transition">3. Airborne Specie Hold</span>
                          <span className="text-[10px] text-gray-400 font-mono">En-route cruising FL380 (68%)</span>
                        </button>

                        <button
                          onClick={() => {
                            updateShipmentStatus(activeShipment.id, 'Bonded Customs Clearance in Progress', 'customs')
                            updateShipmentProgress(activeShipment.id, 88)
                          }}
                          className="rounded-xl border border-[#242833] bg-[#161a24] p-3.5 text-left hover:border-[#dfba6c]/60 hover:bg-[#1e2330] transition text-xs group"
                        >
                          <span className="font-semibold text-white block group-hover:text-[#dfba6c] transition">4. Customs Hold</span>
                          <span className="text-[10px] text-gray-400 font-mono">Carnet ATA inspection (88%)</span>
                        </button>

                        <button
                          onClick={() => {
                            updateShipmentStatus(activeShipment.id, 'Delivered — Verified Handover Complete', 'delivered')
                            updateShipmentProgress(activeShipment.id, 100)
                          }}
                          className="sm:col-span-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3.5 text-left hover:bg-emerald-500/20 transition text-xs"
                        >
                          <span className="font-bold text-emerald-400 block flex items-center gap-2">
                            <CheckCircle2 size={15} />
                            5. Final Vault Lodgement (100%)
                          </span>
                          <span className="text-[10px] text-emerald-300 font-mono">Physical handover complete & custody certificate closed</span>
                        </button>
                      </div>
                    </div>

                    {/* Progress Slider & Simulation Controls */}
                    <div className="rounded-2xl border border-[#242833] bg-[#0e1117] p-5 sm:p-6 shadow-inner">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#dfba6c] flex items-center gap-2">
                          <Gauge size={15} />
                          <span>Real-Time Telemetry Controls</span>
                        </h4>
                        <span className="font-mono text-xs font-bold text-white">
                          {activeShipment.progress}% Handover Progress
                        </span>
                      </div>

                      {/* Slider */}
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={activeShipment.progress}
                        onChange={e => updateShipmentProgress(activeShipment.id, Number(e.target.value))}
                        className="w-full accent-[#dfba6c] h-2 bg-[#202532] rounded-lg cursor-pointer"
                      />

                      {/* Global Auto-Cruise Controller */}
                      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#242833] pt-4 text-xs">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              setSimulationSettings(prev => ({ ...prev, isCruising: !prev.isCruising }))
                            }
                            className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 font-bold transition text-xs ${
                              simulationSettings.isCruising
                                ? 'bg-emerald-500 text-black shadow-md'
                                : 'bg-[#1e2330] text-gray-300 hover:text-white'
                            }`}
                          >
                            {simulationSettings.isCruising ? <Play size={13} className="fill-current" /> : <Pause size={13} />}
                            {simulationSettings.isCruising ? 'Auto-Cruise: Running' : 'Auto-Cruise: Off'}
                          </button>

                          <span className="text-[11px] text-gray-400 font-mono">
                            Rate: {simulationSettings.cruiseSpeed}x
                          </span>
                        </div>

                        {/* Speed Rates */}
                        <div className="flex items-center gap-1 font-mono text-[11px]">
                          {([1, 4, 10] as const).map(rate => (
                            <button
                              key={rate}
                              onClick={() => setSimulationSettings(prev => ({ ...prev, cruiseSpeed: rate }))}
                              className={`rounded-lg px-3 py-1.5 transition font-bold ${
                                simulationSettings.cruiseSpeed === rate
                                  ? 'bg-[#dfba6c] text-black shadow-sm'
                                  : 'bg-[#181d28] text-gray-400 hover:text-white'
                              }`}
                            >
                              {rate}x
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Tamper Alert Override */}
                      <div className="mt-4 border-t border-[#242833] pt-3.5 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 font-mono">
                          <ShieldCheck size={15} className="text-[#dfba6c]" />
                          <span className="text-gray-300">Seal: <strong className="text-white">{activeShipment.telemetry.electronicSeal.id}</strong></span>
                        </div>
                        <button
                          onClick={() => toggleSealTamper(activeShipment.id)}
                          className={`rounded-xl px-3.5 py-1.5 text-xs font-mono font-bold transition ${
                            activeShipment.telemetry.electronicSeal.status === 'SECURE'
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25'
                              : 'bg-red-500/20 text-red-300 border border-red-500/40 hover:bg-red-500/30 animate-pulse'
                          }`}
                        >
                          {activeShipment.telemetry.electronicSeal.status === 'SECURE'
                            ? 'Seal Status: INTACT'
                            : 'TAMPER ALERT TRIGGERED'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Right: Append Verified Milestone Checkpoint (5 cols) */}
                  <div className="rounded-2xl border border-[#242833] bg-[#0e1117] p-5 sm:p-6 lg:col-span-5 flex flex-col justify-between shadow-inner">
                    <div>
                      <div className="flex items-center justify-between border-b border-[#242833] pb-3 mb-4">
                        <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#dfba6c] flex items-center gap-2">
                          <PlusCircle size={15} />
                          <span>Append Milestone</span>
                        </h4>
                        <span className="text-[10px] text-gray-400 font-mono">
                          {activeShipment.checkpoints.length} on ledger
                        </span>
                      </div>

                      <form onSubmit={handleAddCheckpointSubmit} className="space-y-3.5 text-xs">
                        <div>
                          <label className="font-mono font-bold text-gray-300 block mb-1">Milestone Title</label>
                          <input
                            required
                            type="text"
                            placeholder="e.g. Airside Apron Tarmac Reception"
                            value={cpTitle}
                            onChange={e => setCpTitle(e.target.value)}
                            className="h-10 w-full rounded-xl border border-[#242833] bg-[#161a24] px-3.5 text-xs text-white placeholder:text-gray-500 outline-none focus:border-[#dfba6c] transition"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2.5">
                          <div>
                            <label className="font-mono font-bold text-gray-300 block mb-1">Facility</label>
                            <input
                              type="text"
                              placeholder={activeShipment.destination.facility}
                              value={cpFacility}
                              onChange={e => setCpFacility(e.target.value)}
                              className="h-10 w-full rounded-xl border border-[#242833] bg-[#161a24] px-3 text-xs text-white placeholder:text-gray-500 outline-none focus:border-[#dfba6c] transition"
                            />
                          </div>
                          <div>
                            <label className="font-mono font-bold text-gray-300 block mb-1">Location / City</label>
                            <input
                              type="text"
                              placeholder={activeShipment.destination.city}
                              value={cpLocation}
                              onChange={e => setCpLocation(e.target.value)}
                              className="h-10 w-full rounded-xl border border-[#242833] bg-[#161a24] px-3 text-xs text-white placeholder:text-gray-500 outline-none focus:border-[#dfba6c] transition"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="font-mono font-bold text-gray-300 block mb-1">Custody Officer Title</label>
                          <input
                            type="text"
                            placeholder="e.g. Chief Inspector M. Reymond"
                            value={cpOfficer}
                            onChange={e => setCpOfficer(e.target.value)}
                            className="h-10 w-full rounded-xl border border-[#242833] bg-[#161a24] px-3.5 text-xs text-white placeholder:text-gray-500 outline-none focus:border-[#dfba6c] transition"
                          />
                        </div>

                        <div>
                          <label className="font-mono font-bold text-gray-300 block mb-1">Inspection Observations</label>
                          <textarea
                            rows={2}
                            placeholder="e.g. Electronic tamper seal intact. Assay serial numbers reconciled."
                            value={cpNotes}
                            onChange={e => setCpNotes(e.target.value)}
                            className="w-full rounded-xl border border-[#242833] bg-[#161a24] p-3 text-xs text-white placeholder:text-gray-500 outline-none focus:border-[#dfba6c] resize-none transition"
                          />
                        </div>

                        <button
                          type="submit"
                          className="w-full rounded-xl bg-gradient-to-r from-[#dfba6c] to-[#c29b43] py-3 text-xs font-bold text-black hover:opacity-95 transition shadow-md flex items-center justify-center gap-2 mt-1"
                        >
                          <Send size={13} />
                          <span>Sign & Commit Milestone to Ledger</span>
                        </button>

                        {cpAddedFeedback && (
                          <p className="text-center text-[11px] text-emerald-400 font-bold mt-2 animate-in fade-in">
                            ✓ Checkpoint signed and committed to cryptographic ledger!
                          </p>
                        )}
                      </form>
                    </div>

                    {/* Delete Consignment Option */}
                    <div className="border-t border-[#242833] pt-4 mt-6 flex justify-between items-center text-xs">
                      <span className="text-gray-400 text-[11px] font-mono">Consignment Actions:</span>
                      <button
                        onClick={() => {
                          if (confirm(`Abort and delete mission ${activeShipment.id}?`)) {
                            deleteShipment(activeShipment.id)
                          }
                        }}
                        className="text-red-400 hover:text-red-300 inline-flex items-center gap-1 text-[11px] font-mono font-semibold"
                      >
                        <Trash2 size={13} />
                        Abort Mission
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Active Fleet Surveillance Table */}
            <div className="rounded-3xl border border-[#242833] bg-[#11141c] shadow-2xl overflow-hidden">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#242833] p-5 sm:p-6">
                <div>
                  <h2 className="font-serif text-xl sm:text-2xl font-bold text-white">Active Fleet Manifest</h2>
                  <p className="text-xs text-gray-400 font-mono mt-0.5">Click any consignment to load into Mission Control.</p>
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-1.5 rounded-2xl bg-[#090b0f] p-1.5 border border-[#242833] text-xs">
                  {['all', 'in-flight', 'customs', 'delivered'].map(f => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={`rounded-xl px-3 py-1 font-mono font-medium capitalize transition ${
                        filter === f
                          ? 'bg-[#dfba6c] text-black font-bold shadow-sm'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#0e1117] text-gray-400 uppercase tracking-wider text-[10px] font-mono border-b border-[#242833]">
                    <tr>
                      <th className="p-4 sm:p-5">Reference & Cargo</th>
                      <th className="p-4 sm:p-5">Route</th>
                      <th className="p-4 sm:p-5">Declared Value</th>
                      <th className="p-4 sm:p-5">Progress & Status</th>
                      <th className="p-4 sm:p-5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1e2330]">
                    {filteredShipments.map(s => {
                      const isSelected = activeShipment?.id === s.id
                      return (
                        <tr
                          key={s.id}
                          onClick={() => setSelectedShipmentId(s.id)}
                          className={`cursor-pointer transition ${
                            isSelected ? 'bg-[#dfba6c]/10 font-medium' : 'hover:bg-[#161a24]'
                          }`}
                        >
                          <td className="p-4 sm:p-5">
                            <p className="font-mono font-bold text-white text-sm">{s.id}</p>
                            <p className="text-[11px] text-gray-400 mt-0.5">{s.manifest.itemType}</p>
                          </td>

                          <td className="p-4 sm:p-5">
                            <div className="flex items-center gap-1.5 font-medium text-white">
                              <span>{s.origin.city}</span>
                              <ArrowRight size={12} className="text-[#dfba6c]" />
                              <span>{s.destination.city}</span>
                            </div>
                            <p className="text-[10px] text-gray-400 font-mono mt-0.5">{s.transportMode}</p>
                          </td>

                          <td className="p-4 sm:p-5">
                            <p className="font-mono font-bold text-[#dfba6c] text-sm">{s.manifest.declaredValue}</p>
                            <p className="text-[10px] text-gray-400 font-mono mt-0.5">Lloyd's Specie</p>
                          </td>

                          <td className="p-4 sm:p-5">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-mono font-bold ${
                                s.statusType === 'delivered'
                                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                  : 'bg-[#dfba6c]/15 text-[#dfba6c] border border-[#dfba6c]/30'
                              }`}
                            >
                              <span className="size-1.5 rounded-full bg-current animate-pulse" />
                              {s.status} ({s.progress}%)
                            </span>
                            <div className="relative mt-2 h-1.5 w-32 overflow-hidden rounded-full bg-[#202532]">
                              <div className="h-full bg-gradient-to-r from-[#dfba6c] to-[#c29b43]" style={{ width: `${s.progress}%` }} />
                            </div>
                          </td>

                          <td className="p-4 sm:p-5 text-right">
                            <button
                              onClick={() => setSelectedShipmentId(s.id)}
                              className="rounded-xl border border-[#2a2f3d] bg-[#161a24] px-3.5 py-1.5 text-xs font-mono font-bold text-white hover:bg-[#202638] transition"
                            >
                              Inspect Cockpit
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: DISPATCH NEW CONSIGNMENT */}
        {activeTab === 'dispatch' && (
          <div className="mx-auto max-w-4xl rounded-3xl border border-[#242833] bg-[#11141c] p-6 sm:p-10 shadow-2xl">
            <div className="border-b border-[#242833] pb-6 mb-7">
              <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-[#dfba6c]">
                <PlusCircle size={15} />
                <span>New Specie Transit Mission</span>
              </div>
              <h2 className="mt-1.5 font-serif text-2xl sm:text-3xl font-bold text-white tracking-tight">
                Dispatch Sovereign Consignment
              </h2>
              <p className="text-xs sm:text-sm text-gray-400 mt-1 font-mono">
                Configure origin, destination, certified cargo manifests, and assign armed custody marshals.
              </p>
            </div>

            <form onSubmit={handleCreateShipmentSubmit} className="space-y-6 text-xs">
              {/* Reference & Category */}
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="font-mono font-bold text-gray-300 block mb-1.5">Mission Reference Code</label>
                  <input
                    required
                    type="text"
                    value={newId}
                    onChange={e => setNewId(e.target.value)}
                    className="h-11 w-full rounded-xl border border-[#242833] bg-[#161a24] px-4 font-mono font-semibold text-sm text-white outline-none focus:border-[#dfba6c] transition"
                  />
                  <span className="text-[10px] text-gray-400 font-mono mt-1 block">Unique international register ID</span>
                </div>

                <div>
                  <label className="font-mono font-bold text-gray-300 block mb-1.5">Asset Classification</label>
                  <select
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value)}
                    className="h-11 w-full rounded-xl border border-[#242833] bg-[#161a24] px-3.5 text-xs text-white font-mono outline-none focus:border-[#dfba6c] transition"
                  >
                    <option value="Precious Metals & Bullion">Precious Metals & Bullion</option>
                    <option value="Fine Horology & Watches">Fine Horology & Watches</option>
                    <option value="High-Value Gemstones & Diamonds">High-Value Gemstones & Diamonds</option>
                    <option value="Fine Art & Museum Specie">Fine Art & Museum Specie</option>
                  </select>
                </div>
              </div>

              {/* Cargo Specification */}
              <div className="rounded-2xl border border-[#242833] p-5 sm:p-6 bg-[#0e1117] space-y-4">
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#dfba6c] flex items-center gap-2">
                  <Coins size={15} />
                  <span>Certified Physical Specifications</span>
                </h3>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="font-mono font-bold text-gray-300 block mb-1">Item Title</label>
                    <input
                      required
                      type="text"
                      value={newItemType}
                      onChange={e => setNewItemType(e.target.value)}
                      className="h-10 w-full rounded-xl border border-[#242833] bg-[#161a24] px-3.5 text-xs text-white outline-none focus:border-[#dfba6c] transition"
                    />
                  </div>

                  <div>
                    <label className="font-mono font-bold text-gray-300 block mb-1">Certified Fineness / Hallmark</label>
                    <input
                      required
                      type="text"
                      value={newFineness}
                      onChange={e => setNewFineness(e.target.value)}
                      className="h-10 w-full rounded-xl border border-[#242833] bg-[#161a24] px-3.5 text-xs text-white outline-none focus:border-[#dfba6c] font-mono transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-mono font-bold text-gray-300 block mb-1">Manifest Description</label>
                  <textarea
                    rows={2}
                    value={newDescription}
                    onChange={e => setNewDescription(e.target.value)}
                    className="w-full rounded-xl border border-[#242833] bg-[#161a24] p-3 text-xs text-white outline-none focus:border-[#dfba6c] resize-none transition"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label className="font-mono font-bold text-gray-300 block mb-1">Gross Weight</label>
                    <input
                      required
                      type="text"
                      value={newGrossWeight}
                      onChange={e => setNewGrossWeight(e.target.value)}
                      className="h-10 w-full rounded-xl border border-[#242833] bg-[#161a24] px-3.5 text-xs text-white outline-none focus:border-[#dfba6c] font-mono transition"
                    />
                  </div>

                  <div>
                    <label className="font-mono font-bold text-gray-300 block mb-1">Net Fine Weight</label>
                    <input
                      required
                      type="text"
                      value={newNetWeight}
                      onChange={e => setNewNetWeight(e.target.value)}
                      className="h-10 w-full rounded-xl border border-[#242833] bg-[#161a24] px-3.5 text-xs text-white outline-none focus:border-[#dfba6c] font-mono transition"
                    />
                  </div>

                  <div>
                    <label className="font-mono font-bold text-gray-300 block mb-1">Declared Insured Value</label>
                    <input
                      required
                      type="text"
                      value={newDeclaredValue}
                      onChange={e => setNewDeclaredValue(e.target.value)}
                      className="h-10 w-full rounded-xl border border-[#242833] bg-[#161a24] px-3.5 text-xs text-[#dfba6c] outline-none focus:border-[#dfba6c] font-mono font-bold transition"
                    />
                  </div>
                </div>
              </div>

              {/* Corridors & Escorts */}
              <div className="rounded-2xl border border-[#242833] p-5 sm:p-6 bg-[#0e1117] space-y-4">
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#dfba6c] flex items-center gap-2">
                  <Compass size={15} />
                  <span>Vault Corridors & Security Officers</span>
                </h3>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="font-mono font-bold text-gray-300 block mb-1">Origin Vault Facility</label>
                    <select
                      value={newOriginCode}
                      onChange={e => setNewOriginCode(e.target.value)}
                      className="h-10 w-full rounded-xl border border-[#242833] bg-[#161a24] px-3 text-xs text-white font-mono outline-none focus:border-[#dfba6c] transition"
                    >
                      {vaultHubOptions.map(h => (
                        <option key={h.code} value={h.code}>
                          {h.city} ({h.country}) — {h.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="font-mono font-bold text-gray-300 block mb-1">Destination Vault</label>
                    <select
                      value={newDestCode}
                      onChange={e => setNewDestCode(e.target.value)}
                      className="h-10 w-full rounded-xl border border-[#242833] bg-[#161a24] px-3 text-xs text-white font-mono outline-none focus:border-[#dfba6c] transition"
                    >
                      {vaultHubOptions.map(h => (
                        <option key={h.code} value={h.code}>
                          {h.city} ({h.country}) — {h.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="font-mono font-bold text-gray-300 block mb-1">Transport Conveyance</label>
                    <select
                      value={newTransportMode}
                      onChange={e => setNewTransportMode(e.target.value)}
                      className="h-10 w-full rounded-xl border border-[#242833] bg-[#161a24] px-3 text-xs text-white font-mono outline-none focus:border-[#dfba6c] transition"
                    >
                      <option value="Chartered Air-Specie Convoy">Dedicated Chartered Aircraft (Sovereign)</option>
                      <option value="Direct Bonded Air-Specie Hold">Scheduled Commercial Bonded Specie Hold</option>
                      <option value="Armored Heavy Ground Convoy">Level IV Armored Ground Convoy</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-mono font-bold text-gray-300 block mb-1">Assigned Escort Marshal</label>
                    <input
                      required
                      type="text"
                      value={newOfficer}
                      onChange={e => setNewOfficer(e.target.value)}
                      className="h-10 w-full rounded-xl border border-[#242833] bg-[#161a24] px-3.5 text-xs text-white outline-none focus:border-[#dfba6c] transition"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full rounded-2xl bg-gradient-to-r from-[#dfba6c] to-[#c29b43] py-4 text-xs sm:text-sm font-bold text-black hover:opacity-95 transition shadow-xl shadow-[#c29b43]/20 flex items-center justify-center gap-2"
              >
                <ShieldCheck size={18} />
                <span>Authorize & Dispatch Sovereign Consignment</span>
              </button>

              {newDispatchFeedback && (
                <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-center text-xs font-bold text-emerald-400 animate-in fade-in">
                  ✓ Mission successfully dispatched and activated on live radar! Switching to cockpit...
                </div>
              )}
            </form>
          </div>
        )}

        {/* TAB 3: CLIENT QUOTATION DOSSIERS */}
        {activeTab === 'quotes' && (
          <div className="space-y-6">
            <div className="rounded-3xl border border-[#242833] bg-[#11141c] p-6 shadow-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="font-serif text-2xl font-bold text-white">Client Quotation Inquiries</h2>
                <p className="text-xs text-gray-400 font-mono mt-1">
                  Direct requests submitted via the public Specie Logistics Estimator.
                </p>
              </div>
              <span className="rounded-full border border-[#dfba6c]/30 bg-[#dfba6c]/10 px-4 py-1.5 text-xs font-bold text-[#dfba6c] font-mono">
                {quoteInquiries.length} Active Dossiers
              </span>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              {quoteInquiries.map(q => (
                <div key={q.id} className="rounded-3xl border border-[#242833] bg-[#11141c] p-6 sm:p-7 shadow-2xl flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between border-b border-[#242833] pb-4">
                      <div>
                        <span className="font-mono font-bold text-white text-base">{q.id}</span>
                        <p className="text-xs text-gray-400 font-mono mt-0.5">{q.createdAt}</p>
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-[10px] font-mono font-bold uppercase ${
                          q.status === 'dispatched'
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : q.status === 'approved'
                            ? 'bg-[#dfba6c]/15 text-[#dfba6c] border border-[#dfba6c]/30'
                            : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {q.status}
                      </span>
                    </div>

                    <div className="mt-5 space-y-3 text-xs">
                      <div>
                        <span className="text-gray-400 text-[11px] font-mono block">Principal / Client:</span>
                        <span className="font-semibold text-white text-sm">{q.clientName}</span>
                        <span className="text-gray-400 font-mono block text-[11px] mt-0.5">{q.email}</span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-3 border-t border-[#242833]">
                        <div>
                          <span className="text-gray-400 text-[10px] font-mono block">Asset Class</span>
                          <span className="font-medium text-white">{q.assetType}</span>
                        </div>
                        <div>
                          <span className="text-gray-400 text-[10px] font-mono block">Declared Valuation</span>
                          <span className="font-mono font-bold text-[#dfba6c] text-sm">${q.declaredValue.toLocaleString()} USD</span>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-[#242833]">
                        <span className="text-gray-400 text-[10px] font-mono block">Requested Route & Mode</span>
                        <p className="font-medium text-white">
                          {q.originCity} ➔ {q.destinationCity} ({q.transitMode})
                        </p>
                      </div>

                      {q.notes && (
                        <div className="rounded-xl bg-[#0e1117] p-3 text-[11px] text-gray-300 font-mono border border-[#242833] mt-2">
                          "{q.notes}"
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-6 border-t border-[#242833] pt-4 flex flex-wrap items-center justify-between gap-2.5">
                    <div className="flex gap-2">
                      {q.status !== 'approved' && q.status !== 'dispatched' && (
                        <button
                          onClick={() => updateQuoteStatus(q.id, 'approved')}
                          className="rounded-xl border border-[#2a2f3d] bg-[#161a24] px-3.5 py-1.5 text-xs font-mono font-bold text-white hover:bg-[#1e2433] transition"
                        >
                          Mark Approved
                        </button>
                      )}
                    </div>

                    <button
                      onClick={() => handleConvertQuote(q)}
                      className="rounded-xl bg-gradient-to-r from-[#dfba6c] to-[#c29b43] px-4 py-2 text-xs font-bold text-black hover:opacity-95 transition shadow-md flex items-center gap-1.5"
                    >
                      <PlusCircle size={14} />
                      <span>Convert to Mission Dispatch</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: GLOBAL SENSOR & VAULT STATUS */}
        {activeTab === 'sensors' && (
          <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-3xl border border-[#242833] bg-[#11141c] p-6 sm:p-7 shadow-2xl">
                <div className="flex items-center justify-between border-b border-[#242833] pb-4">
                  <div className="flex items-center gap-2.5">
                    <Radio size={18} className="text-[#dfba6c] animate-pulse" />
                    <h3 className="font-serif font-bold text-white text-base">Satellite Telemetry Uplink Log</h3>
                  </div>
                  <span className="font-mono text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/30">
                    100% Signal Integrity
                  </span>
                </div>

                <div className="mt-4 space-y-2.5 font-mono text-[11px] text-gray-300">
                  <div className="rounded-xl bg-[#090b0f] p-3.5 border border-[#202532]">
                    <span className="text-[#dfba6c] font-bold">[14 Mar 12:54:10 UTC]</span> AES-88401-CH: Ping OK • FL380 • 518 kts • 0.08G • 16 Satellites Locked • Geofence Compliant
                  </div>
                  <div className="rounded-xl bg-[#090b0f] p-3.5 border border-[#202532]">
                    <span className="text-[#dfba6c] font-bold">[14 Mar 12:52:04 UTC]</span> AES-77210-ZRH: Temperature steady 19.8°C • 0.02G • JFK Cargo Vault Standby
                  </div>
                  <div className="rounded-xl bg-[#090b0f] p-3.5 border border-[#202532]">
                    <span className="text-[#dfba6c] font-bold">[14 Mar 12:50:18 UTC]</span> AES-88914-ANT: Sarine scan records verified with HRD Antwerp archive • Sealed in Diplomatic Cask
                  </div>
                  <div className="rounded-xl bg-[#090b0f] p-3.5 border border-[#202532]">
                    <span className="text-[#dfba6c] font-bold">[14 Mar 12:48:00 UTC]</span> AES-FINAL-LHR-SIN: Archived lodgement receipt verified at Singapore Le Freeport Sector 4
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-[#242833] bg-[#11141c] p-6 sm:p-7 shadow-2xl">
                <div className="flex items-center justify-between border-b border-[#242833] pb-4">
                  <div className="flex items-center gap-2.5">
                    <Building2 size={18} className="text-[#dfba6c]" />
                    <h3 className="font-serif font-bold text-white text-base">Sovereign Vault Hub Status</h3>
                  </div>
                  <span className="text-xs text-emerald-400 font-mono font-bold bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/30">
                    8 / 8 Active
                  </span>
                </div>

                <div className="mt-4 divide-y divide-[#202532] text-xs">
                  {vaultHubOptions.map(v => (
                    <div key={v.code} className="py-3 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-white">{v.name}</p>
                        <p className="text-[11px] text-gray-400 font-mono">{v.city}, {v.country} ({v.code})</p>
                      </div>
                      <span className="inline-flex items-center gap-1.5 text-[11px] text-emerald-400 font-mono font-medium">
                        <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Online & Secured
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: USER CREDENTIALS & SECURITY */}
        {activeTab === 'users' && (
          <div className="space-y-8">
            {/* Header banner */}
            <div className="rounded-3xl border border-[#242833] bg-[#11141c] p-6 sm:p-8 shadow-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-[#dfba6c] mb-1">
                  <ShieldCheck size={16} />
                  <span>SQLite Cryptographic User Directory</span>
                </div>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-white tracking-tight">
                  User Credentials & Access Control
                </h2>
                <p className="text-xs sm:text-sm text-gray-400 font-mono mt-1">
                  Persistent vault directory backed by SQLite (`data/vault.db`). Salted scrypt key protection.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={fetchUsers}
                  className="rounded-xl border border-[#2a2f3d] bg-[#161a24] px-4 py-2 text-xs font-mono font-bold text-white hover:bg-[#1e2433] transition flex items-center gap-2"
                >
                  <RefreshCw size={13} className={isLoadingUsers ? 'animate-spin' : ''} />
                  <span>Refresh Directory</span>
                </button>
                <span className="rounded-full border border-[#dfba6c]/30 bg-[#dfba6c]/10 px-3.5 py-1.5 text-xs font-mono font-bold text-[#dfba6c]">
                  {dbUsers.length} Enrolled Identities
                </span>
              </div>
            </div>

            {/* Grid: Full-Width Table + Responsive Provisioning Form */}
            <div className="space-y-8">
              {/* Registered Users Table with Full Operational Controls Deck */}
              <div className="rounded-3xl border border-[#242833] bg-[#11141c] shadow-2xl overflow-hidden">
                <div className="border-b border-[#242833] p-5 sm:p-6 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h3 className="font-serif text-lg font-bold text-white">
                      Active Database Identities & Level-V Security Deck
                    </h3>
                    <p className="text-[11px] text-gray-400 font-mono mt-0.5">
                      Real-time administrative privileges: lock client menus, isolate certificates, terminate active sessions & suspend accounts.
                    </p>
                  </div>
                  <span className="text-[11px] text-[#dfba6c] font-mono bg-[#dfba6c]/10 border border-[#dfba6c]/30 px-3 py-1.5 rounded-xl font-bold">
                    Dual-Custody Authority Active
                  </span>
                </div>

                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#0e1117] text-gray-400 uppercase tracking-wider text-[10px] font-mono border-b border-[#242833]">
                      <tr>
                        <th className="p-4">Identity & Email</th>
                        <th className="p-4">Role & Status</th>
                        <th className="p-4">Organization & Clearance</th>
                        <th className="p-4">Security Privileges</th>
                        <th className="p-4 text-right">Operational Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1e2330]">
                      {dbUsers.map(u => {
                        const isSuspended = Boolean(u.is_suspended)
                        const isDashLocked = Boolean(u.is_dashboard_locked)
                        const isCertLocked = Boolean(u.is_certificate_locked)

                        return (
                          <tr
                            key={u.id}
                            className={`hover:bg-[#161a24] transition ${isSuspended ? 'bg-red-950/15' : ''}`}
                          >
                            <td className="p-4">
                              <div className="flex items-center gap-2.5">
                                <div
                                  className={`size-9 rounded-xl ${
                                    isSuspended
                                      ? 'bg-red-800 text-white'
                                      : 'bg-gradient-to-br from-[#dfba6c] to-[#a6802e] text-black'
                                  } font-bold flex items-center justify-center text-xs shrink-0 shadow-sm`}
                                >
                                  {u.avatar_initials}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <p className="font-bold text-white text-sm">{u.name}</p>
                                    {isSuspended && (
                                      <span className="rounded bg-red-500/20 border border-red-500/40 px-1.5 py-0.5 text-[9px] font-mono font-bold text-red-300">
                                        SUSPENDED
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[11px] text-gray-400 font-mono mt-0.5">{u.email}</p>
                                </div>
                              </div>
                            </td>

                            <td className="p-4">
                              <div className="flex flex-col gap-1">
                                <span
                                  className={`inline-block w-fit rounded-md px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider ${
                                    u.role === 'admin'
                                      ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                                      : isSuspended
                                      ? 'bg-red-900/30 text-red-400 border border-red-800'
                                      : 'bg-[#dfba6c]/15 text-[#dfba6c] border border-[#dfba6c]/30'
                                  }`}
                                >
                                  {u.role}
                                </span>
                                {u.client_code && (
                                  <span className="text-[10px] text-gray-400 font-mono font-semibold">
                                    {u.client_code}
                                  </span>
                                )}
                                {(() => {
                                  const uShipment = shipments.find(s => s.clientCode === u.client_code)
                                  if (uShipment) {
                                    return (
                                      <span className="text-[9px] font-mono text-[#dfba6c] bg-[#dfba6c]/10 border border-[#dfba6c]/20 px-1.5 py-0.5 rounded w-fit mt-0.5">
                                        {uShipment.origin.city} ➔ {uShipment.destination.city} ({uShipment.shippingWeight || uShipment.manifest?.grossWeight || '93.9g'})
                                      </span>
                                    )
                                  }
                                  return null
                                })()}
                              </div>
                            </td>

                            <td className="p-4">
                              <p className="text-xs text-white font-medium">{u.organization || 'Private Depository Client'}</p>
                              <p className="font-mono text-[10px] text-gray-400 mt-0.5 max-w-xs truncate">
                                {u.security_clearance}
                              </p>
                            </td>

                            {/* Security Privileges Status Indicators */}
                            <td className="p-4">
                              {u.role === 'client' ? (
                                <div className="flex flex-wrap gap-1.5">
                                  <span
                                    className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-mono font-semibold ${
                                      isDashLocked
                                        ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                                        : 'bg-[#161a24] text-gray-400 border border-[#242833]'
                                    }`}
                                  >
                                    <Lock size={10} className={isDashLocked ? 'text-amber-400' : 'text-gray-500'} />
                                    {isDashLocked ? 'Menu: LOCKED' : 'Menu: Normal'}
                                  </span>
                                  <span
                                    className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-mono font-semibold ${
                                      isCertLocked
                                        ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                                        : 'bg-[#161a24] text-gray-400 border border-[#242833]'
                                    }`}
                                  >
                                    <FileText size={10} className={isCertLocked ? 'text-amber-400' : 'text-gray-500'} />
                                    {isCertLocked ? 'Certs: LOCKED' : 'Certs: Normal'}
                                  </span>
                                  <span
                                    className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-mono font-semibold ${
                                      Boolean(u.notice_active)
                                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 ring-1 ring-amber-500/20'
                                        : 'bg-[#161a24] text-gray-400 border border-[#242833]'
                                    }`}
                                  >
                                    <Bell size={10} className={Boolean(u.notice_active) ? 'text-amber-400 animate-bounce' : 'text-gray-500'} />
                                    {Boolean(u.notice_active) ? 'Notice: ACTIVE' : 'Notice: None'}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">
                                  HQ Marshal Clearance
                                </span>
                              )}
                            </td>

                            {/* Operational Controls Deck */}
                            <td className="p-4 text-right">
                              {u.id === user?.id ? (
                                <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20 inline-block">
                                  ACTIVE SESSION (YOU)
                                </span>
                              ) : u.role === 'client' ? (
                                <div className="flex flex-wrap items-center justify-end gap-1.5">
                                  {/* Edit User & Consignment Details */}
                                  <button
                                    onClick={() => {
                                      setSelectedUserForEdit(u)
                                      setEditUserModalOpen(true)
                                    }}
                                    className="inline-flex items-center gap-1.5 rounded-lg border border-[#dfba6c]/40 bg-[#dfba6c]/15 px-2.5 py-1.5 text-[11px] font-mono font-bold text-[#dfba6c] hover:bg-[#dfba6c]/25 transition shadow-sm"
                                    title="Edit user profile, consignment shipper/receiver, weight, ETA, and radar controls"
                                  >
                                    <Edit3 size={12} />
                                    <span>Edit Details & Radar</span>
                                  </button>

                                  {/* Toggle Dashboard Lock */}
                                  <button
                                    onClick={() => handleToggleDashboardLock(u)}
                                    className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-mono font-bold transition border shadow-sm ${
                                      isDashLocked
                                        ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/25'
                                        : 'bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20'
                                    }`}
                                    title={isDashLocked ? 'Unlock client navigation menus' : 'Lock client navigation menus'}
                                  >
                                    {isDashLocked ? <Unlock size={12} /> : <Lock size={12} />}
                                    <span>{isDashLocked ? 'Unlock Nav' : 'Lock Nav'}</span>
                                  </button>

                                  {/* Toggle Certificate Lock */}
                                  <button
                                    onClick={() => handleToggleCertificateLock(u)}
                                    className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-mono font-bold transition border shadow-sm ${
                                      isCertLocked
                                        ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/25'
                                        : 'bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20'
                                    }`}
                                    title={isCertLocked ? 'Unlock custody certificates' : 'Lock custody certificates'}
                                  >
                                    {isCertLocked ? <Unlock size={12} /> : <Lock size={12} />}
                                    <span>{isCertLocked ? 'Unlock Certs' : 'Lock Certs'}</span>
                                  </button>

                                  {/* Dispatch / Manage Notice */}
                                  <button
                                    onClick={() => handleOpenNoticeModal(u)}
                                    className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-mono font-bold transition border shadow-sm ${
                                      Boolean(u.notice_active)
                                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30 ring-1 ring-amber-500/30'
                                        : 'bg-[#1e2330] text-gray-300 border-[#2a2f3d] hover:bg-[#252b3b] hover:text-white'
                                    }`}
                                    title={Boolean(u.notice_active) ? 'Manage active notice / fees' : 'Dispatch notice / fees to user'}
                                  >
                                    <Bell size={12} className={Boolean(u.notice_active) ? 'text-amber-400' : 'text-gray-400'} />
                                    <span>{Boolean(u.notice_active) ? 'Notice (Active)' : 'Send Notice'}</span>
                                  </button>

                                  {/* Force Remote Logout */}
                                  <button
                                    onClick={() => handleRemoteLogout(u)}
                                    className="inline-flex items-center gap-1 rounded-lg border border-rose-500/30 bg-rose-500/10 px-2.5 py-1.5 text-[11px] font-mono font-bold text-rose-300 hover:bg-rose-500/20 transition shadow-sm"
                                    title="Immediately terminate user's active session"
                                  >
                                    <PowerOff size={12} />
                                    <span>Remote Logout</span>
                                  </button>

                                  {/* Suspend / Lift Suspension */}
                                  <button
                                    onClick={() => handleToggleSuspend(u)}
                                    className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-mono font-bold transition border shadow-sm ${
                                      isSuspended
                                        ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/25'
                                        : 'bg-red-500/15 text-red-300 border-red-500/30 hover:bg-red-500/25'
                                    }`}
                                    title={isSuspended ? 'Lift account suspension' : 'Suspend account'}
                                  >
                                    {isSuspended ? <CheckCircle2 size={12} /> : <Ban size={12} />}
                                    <span>{isSuspended ? 'Unsuspend' : 'Suspend'}</span>
                                  </button>

                                  {/* Delete user */}
                                  <button
                                    onClick={() => handleDeleteUser(u.id, u.name)}
                                    className="text-gray-400 hover:text-red-300 rounded-lg p-1.5 hover:bg-red-500/10 transition"
                                    title="Revoke & Delete User Permanently"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => handleDeleteUser(u.id, u.name)}
                                  className="text-red-400 hover:text-red-300 rounded-lg p-1.5 hover:bg-red-500/10 transition"
                                  title="Revoke & Delete User"
                                >
                                  <Trash2 size={15} />
                                </button>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Create User Form */}
              <div className="rounded-3xl border border-[#242833] bg-[#11141c] p-6 sm:p-8 shadow-2xl space-y-6 max-w-4xl">
                <div className="border-b border-[#242833] pb-4">
                  <h3 className="font-serif text-lg font-bold text-white flex items-center gap-2">
                    <Key size={18} className="text-[#dfba6c]" />
                    <span>Enroll New Database Identity & Credentials</span>
                  </h3>
                  <p className="text-[11px] text-gray-400 font-mono mt-1">
                    Directly commit salted scrypt-hashed credentials into SQLite/Turso database with custom clearance levels.
                  </p>
                </div>

                {userActionFeedback && (
                  <div
                    className={`rounded-xl p-3.5 text-xs font-mono font-semibold ${
                      userActionFeedback.startsWith('✓')
                        ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                        : 'bg-red-500/15 text-red-300 border border-red-500/30'
                    }`}
                  >
                    {userActionFeedback}
                  </div>
                )}

                <form onSubmit={handleCreateUserSubmit} className="space-y-4 text-xs">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="font-mono font-bold text-gray-300 block mb-1">Full Legal / Entity Name</label>
                      <input
                        required
                        type="text"
                        placeholder="e.g. Duchess Eleanor Rothschild"
                        value={newUserName}
                        onChange={e => setNewUserName(e.target.value)}
                        className="h-10 w-full rounded-xl border border-[#242833] bg-[#161a24] px-3.5 text-xs text-white placeholder:text-gray-500 focus:border-[#dfba6c] outline-none transition"
                      />
                    </div>

                    <div>
                      <label className="font-mono font-bold text-gray-300 block mb-1">Identifier Email</label>
                      <input
                        required
                        type="email"
                        placeholder="e.g. eleanor@rothschild-vault.ch"
                        value={newUserEmail}
                        onChange={e => setNewUserEmail(e.target.value)}
                        className="h-10 w-full rounded-xl border border-[#242833] bg-[#161a24] px-3.5 text-xs text-white placeholder:text-gray-500 focus:border-[#dfba6c] outline-none transition font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <div>
                      <label className="font-mono font-bold text-gray-300 block mb-1">Cryptographic Passkey</label>
                      <input
                        required
                        type="password"
                        placeholder="Enter secure passkey"
                        value={newUserPassword}
                        onChange={e => setNewUserPassword(e.target.value)}
                        className="h-10 w-full rounded-xl border border-[#242833] bg-[#161a24] px-3.5 text-xs text-white placeholder:text-gray-500 focus:border-[#dfba6c] outline-none transition font-mono"
                      />
                    </div>

                    <div>
                      <label className="font-mono font-bold text-gray-300 block mb-1">Role Type</label>
                      <select
                        value={newUserRole}
                        onChange={e => setNewUserRole(e.target.value as 'client' | 'admin')}
                        className="h-10 w-full rounded-xl border border-[#242833] bg-[#161a24] px-3 text-xs text-white font-mono focus:border-[#dfba6c] outline-none transition"
                      >
                        <option value="client">Private Client</option>
                        <option value="admin">HQ Admin Marshal</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-mono font-bold text-gray-300 block mb-1">Client Code</label>
                      <input
                        type="text"
                        placeholder="CLIENT-ROTHSCHILD"
                        value={newUserClientCode}
                        onChange={e => setNewUserClientCode(e.target.value)}
                        className="h-10 w-full rounded-xl border border-[#242833] bg-[#161a24] px-3 text-xs text-white placeholder:text-gray-500 focus:border-[#dfba6c] outline-none transition font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="font-mono font-bold text-gray-300 block mb-1">Organization / Trust</label>
                      <input
                        type="text"
                        placeholder="Rothschild Dynasty Trust SA"
                        value={newUserOrg}
                        onChange={e => setNewUserOrg(e.target.value)}
                        className="h-10 w-full rounded-xl border border-[#242833] bg-[#161a24] px-3.5 text-xs text-white placeholder:text-gray-500 focus:border-[#dfba6c] outline-none transition"
                      />
                    </div>

                    <div>
                      <label className="font-mono font-bold text-gray-300 block mb-1">Security Clearance Protocol</label>
                      <input
                        type="text"
                        placeholder="ALLOCATED VAULT DEPOSITOR TIER-IV"
                        value={newUserClearance}
                        onChange={e => setNewUserClearance(e.target.value)}
                        className="h-10 w-full rounded-xl border border-[#242833] bg-[#161a24] px-3.5 text-xs text-white placeholder:text-gray-500 focus:border-[#dfba6c] outline-none transition font-mono"
                      />
                    </div>
                  </div>

                  {newUserRole === 'client' && (
                    <div className="rounded-2xl border border-[#262c3b] bg-[#141822] p-4 text-xs space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 font-mono font-bold text-[#dfba6c]">
                          <Plane size={14} />
                          <span>Initial Dedicated Specie Consignment & Route (Customizable)</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setExpandConsignmentConfig(!expandConsignmentConfig)}
                          className="text-[11px] font-mono text-gray-400 hover:text-white underline"
                        >
                          {expandConsignmentConfig ? 'Hide Advanced Config ▲' : 'Customize Consignment Details ▼'}
                        </button>
                      </div>

                      {expandConsignmentConfig ? (
                        <div className="space-y-3 pt-2 border-t border-[#242833]">
                          <div className="grid gap-3 sm:grid-cols-2">
                            <div>
                              <label className="text-[10px] font-mono text-gray-400 block mb-1">Shipper Name</label>
                              <input
                                type="text"
                                value={newShipperName}
                                onChange={e => setNewShipperName(e.target.value)}
                                placeholder={newUserName || 'Linda S Hudson'}
                                className="h-9 w-full rounded-lg border border-[#2a2f3d] bg-[#161a24] px-3 text-xs text-white"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-mono text-gray-400 block mb-1">Origin (State / City)</label>
                              <input
                                type="text"
                                value={newOrigin}
                                onChange={e => setNewOrigin(e.target.value)}
                                placeholder="Indiana"
                                className="h-9 w-full rounded-lg border border-[#2a2f3d] bg-[#161a24] px-3 text-xs text-white"
                              />
                            </div>
                            <div className="sm:col-span-2">
                              <label className="text-[10px] font-mono text-gray-400 block mb-1">Shipper Address</label>
                              <input
                                type="text"
                                value={newShipperAddress}
                                onChange={e => setNewShipperAddress(e.target.value)}
                                placeholder="State: Hanover. Pk. Illinois 1365. Fremont Dr.  Zip code :60133."
                                className="h-9 w-full rounded-lg border border-[#2a2f3d] bg-[#161a24] px-3 text-xs text-white"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-mono text-gray-400 block mb-1">Shipper Phone</label>
                              <input
                                type="text"
                                value={newShipperPhone}
                                onChange={e => setNewShipperPhone(e.target.value)}
                                placeholder="+1 (470) 305-9614"
                                className="h-9 w-full rounded-lg border border-[#2a2f3d] bg-[#161a24] px-3 text-xs text-white font-mono"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-mono text-gray-400 block mb-1">Receiver Name</label>
                              <input
                                type="text"
                                value={newReceiverName}
                                onChange={e => setNewReceiverName(e.target.value)}
                                placeholder="Chris Bucksath"
                                className="h-9 w-full rounded-lg border border-[#2a2f3d] bg-[#161a24] px-3 text-xs text-white"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-mono text-gray-400 block mb-1">Receiver Contact / Phone</label>
                              <input
                                type="text"
                                value={newReceiverContact}
                                onChange={e => setNewReceiverContact(e.target.value)}
                                placeholder="+1 (859) 907-3706"
                                className="h-9 w-full rounded-lg border border-[#2a2f3d] bg-[#161a24] px-3 text-xs text-white font-mono"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-mono text-gray-400 block mb-1">Destination (State / City)</label>
                              <input
                                type="text"
                                value={newDestination}
                                onChange={e => setNewDestination(e.target.value)}
                                placeholder="Kentucky"
                                className="h-9 w-full rounded-lg border border-[#2a2f3d] bg-[#161a24] px-3 text-xs text-white"
                              />
                            </div>
                            <div className="sm:col-span-2">
                              <label className="text-[10px] font-mono text-gray-400 block mb-1">Receiver Address</label>
                              <input
                                type="text"
                                value={newReceiverAddress}
                                onChange={e => setNewReceiverAddress(e.target.value)}
                                placeholder="321 Pimlico Ct Crittenden Ky 41030"
                                className="h-9 w-full rounded-lg border border-[#2a2f3d] bg-[#161a24] px-3 text-xs text-white"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-mono text-gray-400 block mb-1">Shipping Weight</label>
                              <input
                                type="text"
                                value={newShippingWeight}
                                onChange={e => setNewShippingWeight(e.target.value)}
                                placeholder="93.9 g"
                                className="h-9 w-full rounded-lg border border-[#2a2f3d] bg-[#161a24] px-3 text-xs text-white font-mono font-bold"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-mono text-gray-400 block mb-1">Estimated Delivery Date (ETA)</label>
                              <input
                                type="text"
                                value={newEta}
                                onChange={e => setNewEta(e.target.value)}
                                placeholder="17/09/26"
                                className="h-9 w-full rounded-lg border border-[#2a2f3d] bg-[#161a24] px-3 text-xs text-white font-mono"
                              />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <p className="text-[11px] text-gray-400 font-mono">
                          Default route (<span className="text-white">Indiana ➔ Kentucky</span>, Shipper: <span className="text-white">{newUserName || 'Client'}</span>, Receiver: <span className="text-white">Chris Bucksath</span>, Weight: <span className="text-white">93.9 g</span>, ETA: <span className="text-white">17/09/26</span>) will be provisioned. You can modify these anytime via &quot;Edit Details &amp; Radar&quot;.
                        </p>
                      )}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full rounded-xl bg-gradient-to-r from-[#dfba6c] to-[#c29b43] py-3.5 text-xs font-bold text-black hover:opacity-95 transition shadow-lg shadow-[#c29b43]/20 flex items-center justify-center gap-2 mt-3"
                  >
                    <ShieldCheck size={16} />
                    <span>Commit Credentials to SQLite Database</span>
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: DIRECTIVES & OPERATIONAL NOTICES */}
        {activeTab === 'notices' && (
          <div className="space-y-8">
            {/* Header banner */}
            <div className="rounded-3xl border border-[#242833] bg-[#11141c] p-6 sm:p-8 shadow-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-[#dfba6c] mb-1">
                  <Bell size={16} className="text-amber-400" />
                  <span>Sovereign Client Interception Directives</span>
                </div>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-white tracking-tight">
                  Operational Notices & Directives Command
                </h2>
                <p className="text-xs sm:text-sm text-gray-400 font-mono mt-1">
                  Authoritative dispatch channel to manage and push real-time alerts, settlement fees, customs holds, and handover directives to any client.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-xs font-mono">
                  <span className="text-amber-300 font-bold">{activeNoticesCount}</span>
                  <span className="text-gray-400 ml-1.5">Active Directives</span>
                </div>
                <div className="rounded-2xl border border-[#2a2f3d] bg-[#161a24] px-4 py-2 text-xs font-mono">
                  <span className="text-white font-bold">{clientUsers.length}</span>
                  <span className="text-gray-400 ml-1.5">Enrolled Clients</span>
                </div>
              </div>
            </div>

            {/* Workbench: Two-Column Editor + Real-Time Client Preview */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left Column: Client Selector, Presets & Directive Editor */}
              <div className="lg:col-span-7 space-y-6">
                <div className="rounded-3xl border border-[#242833] bg-[#11141c] p-6 sm:p-7 shadow-2xl space-y-6">
                  <div className="border-b border-[#242833] pb-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <Edit3 size={18} className="text-[#dfba6c]" />
                      <h3 className="font-serif font-bold text-white text-base">Directive Composition Workbench</h3>
                    </div>
                    {deckSelectedUser && (
                      <span
                        className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-full border ${
                          Boolean(deckSelectedUser.notice_active)
                            ? 'bg-amber-500/15 text-amber-300 border-amber-500/30 ring-1 ring-amber-500/20'
                            : 'bg-gray-500/10 text-gray-400 border-gray-500/20'
                        }`}
                      >
                        {Boolean(deckSelectedUser.notice_active) ? '● BROADCASTING LIVE' : '○ INACTIVE / DRAFT'}
                      </span>
                    )}
                  </div>

                  {/* Target Client Selector */}
                  <div>
                    <label className="font-mono font-bold text-xs text-gray-300 block mb-2">
                      Target Client Account
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {clientUsers.map(u => {
                        const isSelected = deckSelectedUser?.id === u.id
                        const hasActiveNotice = Boolean(u.notice_active)

                        return (
                          <button
                            key={u.id}
                            type="button"
                            onClick={() => setDeckSelectedUserId(u.id)}
                            className={`text-left p-3.5 rounded-2xl border transition relative ${
                              isSelected
                                ? 'border-[#dfba6c] bg-[#1a1f2c] ring-1 ring-[#dfba6c]/40 shadow-lg shadow-[#dfba6c]/5'
                                : 'border-[#242833] bg-[#141824] hover:border-[#2f3547]'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-bold text-sm text-white truncate">{u.name}</span>
                              {hasActiveNotice && (
                                <span
                                  className="size-2 rounded-full bg-amber-400 animate-ping shrink-0"
                                  title="Notice Active"
                                />
                              )}
                            </div>
                            <div className="flex items-center justify-between text-[11px] font-mono text-gray-400 mt-1">
                              <span>{u.client_code || 'CLIENT'}</span>
                              <span className={hasActiveNotice ? 'text-amber-400 font-bold' : 'text-gray-500'}>
                                {hasActiveNotice ? 'Notice: Active' : 'No Notice'}
                              </span>
                            </div>
                            <p className="text-[10px] text-gray-400 truncate mt-1">{u.email}</p>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Quick Preset Templates */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="font-mono font-bold text-xs text-gray-300">
                        Operational Presets & Templates
                      </label>
                      <span className="text-[10px] font-mono text-gray-400">1-Click Apply</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {NOTICE_PRESETS.map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setDeckNoticeTitle(preset.title)
                            setDeckNoticeMessage(preset.message)
                          }}
                          className="text-left rounded-xl border border-[#242833] bg-[#141824] p-3 text-xs text-gray-300 hover:border-[#dfba6c]/50 hover:bg-[#181d2c] transition group"
                        >
                          <div className="flex items-center gap-1.5 font-bold text-white group-hover:text-[#dfba6c] transition">
                            <span>{preset.icon}</span>
                            <span className="truncate">{preset.label}</span>
                          </div>
                          <span className="text-[9px] font-mono text-gray-400 block mt-1 uppercase tracking-wider">
                            {preset.badge}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Form: Directive Headline / Title */}
                  <div>
                    <label className="font-mono font-bold text-xs text-gray-300 block mb-1.5">
                      Directive Headline / Title
                    </label>
                    <input
                      type="text"
                      value={deckNoticeTitle}
                      onChange={e => setDeckNoticeTitle(e.target.value)}
                      placeholder="e.g. SHIPMENT PROCESSING NOTICE"
                      className="h-11 w-full rounded-xl border border-[#242833] bg-[#161a24] px-4 text-xs text-white placeholder:text-gray-500 focus:border-[#dfba6c] outline-none transition font-mono font-bold"
                    />
                  </div>

                  {/* Form: Directive Body / Fee & Processing Text */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="font-mono font-bold text-xs text-gray-300">
                        Directive Body / Instructions & Fee Details
                      </label>
                      <span className="text-[10px] font-mono text-gray-400">
                        {deckNoticeMessage.length} characters
                      </span>
                    </div>
                    <textarea
                      rows={5}
                      value={deckNoticeMessage}
                      onChange={e => setDeckNoticeMessage(e.target.value)}
                      placeholder="Enter directive instructions, fee amounts, and doorstep handover conditions..."
                      className="w-full rounded-2xl border border-[#242833] bg-[#161a24] p-4 text-xs text-white placeholder:text-gray-500 focus:border-[#dfba6c] outline-none transition font-sans leading-relaxed resize-y"
                    />
                    <p className="text-[11px] text-gray-400 font-mono mt-1.5">
                      When active, this directive intercepts client access to vault holdings, custody certificates, and flight booking, popping up smoothly upon radar inspection.
                    </p>
                  </div>

                  {/* Action Deck */}
                  <div className="border-t border-[#242833] pt-5 flex flex-wrap items-center justify-between gap-3">
                    {deckSelectedUser && Boolean(deckSelectedUser.notice_active) ? (
                      <button
                        type="button"
                        disabled={isSubmittingDeckNotice}
                        onClick={() => handleSaveDeckNotice(false)}
                        className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-xs font-mono font-bold text-red-300 hover:bg-red-500/20 transition disabled:opacity-50"
                      >
                        {isSubmittingDeckNotice ? 'Deactivating...' : 'Withdraw / Deactivate Directive'}
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={isSubmittingDeckNotice}
                        onClick={() => handleSaveDeckNotice(false)}
                        className="rounded-xl border border-[#2a2f3d] bg-[#161a24] px-4 py-2.5 text-xs font-mono text-gray-300 hover:bg-[#1f2433] transition disabled:opacity-50"
                      >
                        Save as Inactive Draft
                      </button>
                    )}

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={isSubmittingDeckNotice}
                        onClick={() => handleSaveDeckNotice(true)}
                        className="rounded-xl bg-gradient-to-r from-[#dfba6c] to-[#c29b43] px-6 py-2.5 text-xs font-mono font-bold text-black hover:opacity-95 transition shadow-lg shadow-[#c29b43]/20 flex items-center gap-2 disabled:opacity-50"
                      >
                        <Bell size={14} />
                        <span>
                          {isSubmittingDeckNotice
                            ? 'Broadcasting...'
                            : deckSelectedUser && Boolean(deckSelectedUser.notice_active)
                            ? 'Save & Update Live Directive'
                            : 'Activate & Broadcast Directive'}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Real-Time Client Simulation & Live Preview */}
              <div className="lg:col-span-5 space-y-6">
                <div className="rounded-3xl border border-[#242833] bg-[#11141c] p-6 sm:p-7 shadow-2xl space-y-5">
                  <div className="border-b border-[#242833] pb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Eye size={18} className="text-[#dfba6c]" />
                      <h3 className="font-serif font-bold text-white text-base">Client Screen Live Preview</h3>
                    </div>
                    <div className="flex items-center gap-1 bg-[#141824] p-1 rounded-xl border border-[#242833]">
                      <button
                        type="button"
                        onClick={() => setDeckPreviewMode('banner')}
                        className={`px-3 py-1 text-[11px] font-mono rounded-lg transition ${
                          deckPreviewMode === 'banner'
                            ? 'bg-[#dfba6c] text-black font-bold shadow'
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        Radar Banner
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeckPreviewMode('modal')}
                        className={`px-3 py-1 text-[11px] font-mono rounded-lg transition ${
                          deckPreviewMode === 'modal'
                            ? 'bg-[#dfba6c] text-black font-bold shadow'
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        Urgent Modal
                      </button>
                    </div>
                  </div>

                  {deckPreviewMode === 'banner' ? (
                    <div className="space-y-4">
                      <p className="text-[11px] font-mono text-gray-400">
                        Exact warning banner displayed on client's Live Sovereign Radar Cockpit:
                      </p>

                      {/* Mock Radar Banner */}
                      <div className="rounded-3xl border-2 border-amber-500/40 bg-amber-950/25 p-5 shadow-2xl flex flex-col gap-3">
                        <div className="flex items-start gap-3">
                          <div className="size-9 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
                            <AlertTriangle size={18} className="animate-pulse" />
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="rounded bg-amber-500/20 border border-amber-500/30 px-2 py-0.5 text-[8px] font-mono font-bold text-amber-300 uppercase tracking-wider">
                                CARGO TRANSIT RESTRICTION
                              </span>
                              <span className="font-mono text-xs font-bold text-white">
                                {deckNoticeTitle || 'SHIPMENT PROCESSING NOTICE'}
                              </span>
                            </div>
                            <p className="text-xs text-gray-300 font-medium line-clamp-3 leading-relaxed">
                              {deckNoticeMessage || 'Enter directive text to preview here...'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-end pt-1">
                          <div className="inline-flex items-center gap-1 rounded-xl bg-gradient-to-r from-[#dfba6c] to-[#c29b43] px-3 py-1.5 text-[10px] font-bold text-black font-mono shadow">
                            <span>Inspect Full Directive</span>
                            <ArrowUpRight size={12} />
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-[11px] font-mono text-gray-400">
                        Exact high-security modal intercepting client navigation:
                      </p>

                      {/* Mock Modal Preview */}
                      <div className="rounded-3xl border-2 border-amber-500/40 bg-[#0d0f15] shadow-2xl overflow-hidden text-white font-sans ring-1 ring-amber-500/20">
                        <div className="h-1 w-full bg-gradient-to-r from-amber-600 via-[#dfba6c] to-amber-500 animate-pulse" />
                        <div className="p-4 border-b border-[#242833] bg-[#12151e]/80 flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="size-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                              <AlertTriangle size={16} />
                            </div>
                            <div>
                              <span className="rounded bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.5 text-[8px] font-mono font-bold text-amber-300">
                                URGENT OPERATIONAL NOTICE
                              </span>
                              <h4 className="font-serif text-xs font-bold text-white mt-0.5">
                                {deckNoticeTitle || 'SHIPMENT PROCESSING NOTICE'}
                              </h4>
                            </div>
                          </div>
                          <span className="text-[9px] font-mono text-gray-400">
                            REF: AV-NOTIF-{deckSelectedUser?.client_code || 'GENEVA'}
                          </span>
                        </div>

                        <div className="p-4 space-y-3 text-xs">
                          <div className="flex items-center justify-between rounded-lg border border-[#202533] bg-[#141824] px-3 py-2 text-[10px] font-mono">
                            <span className="text-gray-400">
                              Client: <strong className="text-white">{deckSelectedUser?.name || 'Client'}</strong>
                            </span>
                            <span className="text-[#dfba6c] font-bold">
                              {deckSelectedUser?.client_code || 'CLIENT'}
                            </span>
                          </div>

                          <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3.5 space-y-1.5 relative overflow-hidden">
                            <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-amber-400 uppercase">
                              <FileText size={12} />
                              <span>Directive Text</span>
                            </div>
                            <p className="text-xs text-gray-200 leading-relaxed whitespace-pre-line">
                              {deckNoticeMessage || 'Enter directive text to preview here...'}
                            </p>
                          </div>

                          <div className="rounded-xl border border-red-500/30 bg-red-950/20 p-2.5 text-[10px] text-gray-300 font-mono flex items-center gap-2">
                            <ShieldAlert size={14} className="text-red-400 shrink-0" />
                            <span>Doorstep delivery & avionics downlinks hold until settlement.</span>
                          </div>
                        </div>

                        <div className="p-3 border-t border-[#242833] bg-[#0f121a] flex items-center justify-between">
                          <span className="text-[9px] font-mono text-gray-500">AurumVault Geneva HQ</span>
                          <div className="rounded-lg bg-gradient-to-r from-[#dfba6c] to-[#c29b43] px-3 py-1.5 text-[10px] font-bold text-black font-mono">
                            Acknowledge Notice
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="rounded-2xl border border-[#242833] bg-[#0e1117] p-4 text-[11px] font-mono text-gray-400 space-y-2">
                    <div className="flex items-center gap-2 text-white font-bold">
                      <ShieldCheck size={14} className="text-emerald-400" />
                      <span>Zero-Latency Synchronized Downlink</span>
                    </div>
                    <p className="text-[10px] leading-relaxed">
                      Saving or broadcasting updates the SQLite database record immediately. The client's active session poller captures notice changes in real-time within 2 seconds without requiring manual reload.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* All Clients Master Directives Ledger Table */}
            <div className="rounded-3xl border border-[#242833] bg-[#11141c] shadow-2xl overflow-hidden">
              <div className="border-b border-[#242833] p-5 sm:p-6 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="font-serif text-lg font-bold text-white">
                    Client Directives & Notice Authorization Ledger
                  </h3>
                  <p className="text-[11px] text-gray-400 font-mono mt-0.5">
                    Real-time status of all client accounts with quick editor switching.
                  </p>
                </div>
                <span className="text-xs font-mono text-gray-300 bg-[#161a24] border border-[#242833] px-3 py-1.5 rounded-xl">
                  {clientUsers.length} Registered Client Accounts
                </span>
              </div>

              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#0e1117] text-gray-400 uppercase tracking-wider text-[10px] font-mono border-b border-[#242833]">
                    <tr>
                      <th className="p-4">Client Identity</th>
                      <th className="p-4">Notice Status</th>
                      <th className="p-4">Directive Headline</th>
                      <th className="p-4">Message Preview</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1e2330]">
                    {clientUsers.map(u => {
                      const isActive = Boolean(u.notice_active)
                      const isSelected = deckSelectedUser?.id === u.id

                      return (
                        <tr
                          key={u.id}
                          className={`hover:bg-[#161a24] transition ${
                            isSelected ? 'bg-[#dfba6c]/5' : ''
                          }`}
                        >
                          <td className="p-4">
                            <div className="flex items-center gap-2.5">
                              <div className="size-8 rounded-xl bg-gradient-to-br from-[#dfba6c] to-[#a6802e] text-black font-bold flex items-center justify-center text-xs shrink-0">
                                {u.avatar_initials}
                              </div>
                              <div>
                                <p className="font-bold text-white text-sm">{u.name}</p>
                                <p className="text-[11px] text-gray-400 font-mono">{u.email}</p>
                              </div>
                            </div>
                          </td>

                          <td className="p-4">
                            <span
                              className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-mono font-bold ${
                                isActive
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 ring-1 ring-amber-500/20'
                                  : 'bg-[#161a24] text-gray-400 border border-[#242833]'
                              }`}
                            >
                              <Bell size={10} className={isActive ? 'text-amber-400 animate-bounce' : 'text-gray-500'} />
                              {isActive ? 'ACTIVE (BROADCASTING)' : 'INACTIVE / NONE'}
                            </span>
                          </td>

                          <td className="p-4 font-mono font-bold text-xs text-white max-w-xs truncate">
                            {u.notice_title || <span className="text-gray-500 font-normal italic">No Title Stored</span>}
                          </td>

                          <td className="p-4 text-gray-300 max-w-md truncate font-sans text-xs">
                            {u.notice_message || <span className="text-gray-500 italic">No notice directive configured</span>}
                          </td>

                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setDeckSelectedUserId(u.id)
                                  window.scrollTo({ top: 0, behavior: 'smooth' })
                                }}
                                className="inline-flex items-center gap-1 rounded-lg border border-[#2a2f3d] bg-[#161a24] px-2.5 py-1.5 text-[11px] font-mono text-gray-300 hover:border-[#dfba6c] hover:text-white transition"
                              >
                                <Edit3 size={12} />
                                <span>Edit Directive</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleQuickToggleNotice(u)}
                                className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-mono font-bold transition border ${
                                  isActive
                                    ? 'bg-red-500/10 text-red-300 border-red-500/30 hover:bg-red-500/20'
                                    : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20'
                                }`}
                              >
                                {isActive ? 'Deactivate' : 'Activate'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
        </main>
      </div>

      {/* Admin Notice Dispatch Modal */}
      {selectedUserForNotice && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-xl rounded-3xl border border-[#2a2f3d] bg-[#11141c] p-6 sm:p-7 shadow-2xl text-white font-sans ring-1 ring-amber-500/20 space-y-5 max-h-[90vh] overflow-y-auto custom-scrollbar">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-[#242833] pb-4">
              <div className="flex items-center gap-3">
                <div className="size-11 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0 shadow-inner">
                  <Bell size={22} className="animate-pulse" />
                </div>
                <div>
                  <h3 className="font-serif text-lg font-bold text-white">
                    Client Directive & Notice Dispatcher
                  </h3>
                  <p className="text-[11px] text-gray-400 font-mono mt-0.5">
                    Live operational hold, fee instructions & dashboard interception
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedUserForNotice(null)}
                className="rounded-xl border border-[#242833] bg-[#161a24] p-2 text-gray-400 hover:text-white hover:bg-[#1e2330] transition"
              >
                <X size={16} />
              </button>
            </div>

            {/* Target Client Switcher Dropdown */}
            <div className="rounded-2xl border border-[#242833] bg-[#161a24] p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-mono text-[11px] font-bold text-gray-300 flex items-center gap-1.5">
                  <Users size={13} className="text-[#dfba6c]" />
                  <span>Selected Client Account</span>
                </label>
                <span
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                    Boolean(selectedUserForNotice.notice_active)
                      ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                      : 'bg-gray-500/10 text-gray-400 border-gray-500/20'
                  }`}
                >
                  {Boolean(selectedUserForNotice.notice_active) ? '● NOTICE ACTIVE' : '○ NO ACTIVE NOTICE'}
                </span>
              </div>
              <select
                value={selectedUserForNotice.id}
                onChange={e => {
                  const found = dbUsers.find(u => u.id === e.target.value)
                  if (found) {
                    handleSelectUserForNoticeModal(found)
                  }
                }}
                className="w-full rounded-xl border border-[#2a2f3d] bg-[#0f121a] px-3.5 py-2 text-xs font-mono font-bold text-white focus:border-[#dfba6c] outline-none cursor-pointer"
              >
                {clientUsers.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.name} — {u.client_code || u.email} {Boolean(u.notice_active) ? '★ (Active Notice)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Quick Preset Buttons */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="font-mono text-[11px] font-bold text-gray-300">
                  Quick Presets
                </label>
                <div className="flex items-center gap-1 bg-[#161a24] p-0.5 rounded-lg border border-[#242833]">
                  <button
                    type="button"
                    onClick={() => setModalPreviewMode('edit')}
                    className={`px-2.5 py-0.5 text-[10px] font-mono rounded ${
                      modalPreviewMode === 'edit'
                        ? 'bg-[#dfba6c] text-black font-bold'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalPreviewMode('preview')}
                    className={`px-2.5 py-0.5 text-[10px] font-mono rounded ${
                      modalPreviewMode === 'preview'
                        ? 'bg-[#dfba6c] text-black font-bold'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Preview
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {NOTICE_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setNoticeTitleInput(preset.title)
                      setNoticeMessageInput(preset.message)
                    }}
                    className="rounded-lg border border-[#242833] bg-[#161a24] px-2.5 py-1 text-[11px] font-mono text-gray-300 hover:border-[#dfba6c] hover:text-white transition flex items-center gap-1"
                  >
                    <span>{preset.icon}</span>
                    <span>{preset.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Modal Body / Form or Live Preview */}
            {modalPreviewMode === 'edit' ? (
              <div className="space-y-4 text-xs">
                <div>
                  <label className="font-mono font-bold text-gray-300 block mb-1">
                    Notice Headline / Directive Title
                  </label>
                  <input
                    type="text"
                    value={noticeTitleInput}
                    onChange={e => setNoticeTitleInput(e.target.value)}
                    placeholder="e.g. SHIPMENT PROCESSING NOTICE"
                    className="h-10 w-full rounded-xl border border-[#242833] bg-[#161a24] px-3.5 text-xs text-white placeholder:text-gray-500 focus:border-[#dfba6c] outline-none transition font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="font-mono font-bold text-gray-300 block mb-1">
                    Directive Body / Fee & Processing Text
                  </label>
                  <textarea
                    rows={4}
                    value={noticeMessageInput}
                    onChange={e => setNoticeMessageInput(e.target.value)}
                    placeholder="Enter notice text that will persistently appear on client screen..."
                    className="w-full rounded-xl border border-[#242833] bg-[#161a24] p-3 text-xs text-white placeholder:text-gray-500 focus:border-[#dfba6c] outline-none transition font-sans leading-relaxed"
                  />
                  <p className="text-[10px] text-gray-400 font-mono mt-1">
                    This directive will persistently intercept the client dashboard upon radar access and lock restricted tabs until acknowledged or lifted.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-[11px] font-mono text-gray-400">
                  Client Screen Modal Preview:
                </p>
                <div className="rounded-2xl border border-amber-500/30 bg-[#0d0f15] p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-[#242833] pb-2">
                    <div className="flex items-center gap-2">
                      <AlertTriangle size={15} className="text-amber-400" />
                      <span className="font-mono font-bold text-xs text-white">
                        {noticeTitleInput || 'SHIPMENT PROCESSING NOTICE'}
                      </span>
                    </div>
                    <span className="text-[9px] font-mono text-gray-400">
                      REF: AV-NOTIF-{selectedUserForNotice.client_code || 'GENEVA'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-200 leading-relaxed whitespace-pre-line bg-[#141824] p-3 rounded-xl border border-[#202533]">
                    {noticeMessageInput || 'Enter directive text...'}
                  </p>
                </div>
              </div>
            )}

            {/* Footer Actions */}
            <div className="border-t border-[#242833] pt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              {Boolean(selectedUserForNotice.notice_active) ? (
                <button
                  type="button"
                  disabled={isSubmittingNotice}
                  onClick={() => handleSaveNotice(false)}
                  className="w-full sm:w-auto rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-xs font-mono font-bold text-red-300 hover:bg-red-500/20 transition disabled:opacity-50"
                >
                  Withdraw / Deactivate Notice
                </button>
              ) : (
                <button
                  type="button"
                  disabled={isSubmittingNotice}
                  onClick={() => handleSaveNotice(false)}
                  className="w-full sm:w-auto rounded-xl border border-[#2a2f3d] bg-[#161a24] px-4 py-2 text-xs font-mono text-gray-400 hover:bg-[#1f2433] transition disabled:opacity-50"
                >
                  Save as Inactive Draft
                </button>
              )}

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setSelectedUserForNotice(null)}
                  className="w-full sm:w-auto rounded-xl border border-[#2a2f3d] bg-[#161a24] px-4 py-2 text-xs font-mono text-gray-300 hover:bg-[#1f2433] transition"
                >
                  Close
                </button>
                <button
                  type="button"
                  disabled={isSubmittingNotice}
                  onClick={() => handleSaveNotice(true)}
                  className="w-full sm:w-auto rounded-xl bg-gradient-to-r from-[#dfba6c] to-[#c29b43] px-5 py-2 text-xs font-mono font-bold text-black hover:opacity-95 transition shadow-lg shadow-[#c29b43]/20 flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <Bell size={13} />
                  <span>
                    {isSubmittingNotice
                      ? 'Broadcasting...'
                      : Boolean(selectedUserForNotice.notice_active)
                      ? 'Save & Update Live Notice'
                      : 'Activate & Broadcast Notice'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit User & Consignment Modal */}
      {editUserModalOpen && selectedUserForEdit && (
        <EditUserConsignmentModal
          isOpen={editUserModalOpen}
          onClose={() => {
            setEditUserModalOpen(false)
            setSelectedUserForEdit(null)
          }}
          user={selectedUserForEdit}
          shipment={shipments.find(s => s.clientCode === selectedUserForEdit.client_code)}
          onSaved={() => {
            fetchUsers()
            if (refreshShipmentsFromServer) {
              refreshShipmentsFromServer()
            }
          }}
        />
      )}
    </div>
  )
}
