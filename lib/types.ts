export type CheckpointStatus = 'completed' | 'current' | 'pending'

export interface Checkpoint {
  id: string
  timestamp: string
  title: string
  location: string
  facility: string
  status: CheckpointStatus
  officer: string
  officerId: string
  sealId?: string
  hash?: string
  notes?: string
}

export interface SensorTelemetry {
  electronicSeal: {
    id: string
    status: 'SECURE' | 'TAMPER_ALERT'
    battery: string
    lastPing: string
  }
  gForce: {
    current: number
    maxRecorded: number
    threshold: number
    unit: string
  }
  lightExposure: {
    current: number
    status: 'SEALED_VAULT' | 'EXPOSED'
    unit: string
  }
  temperature: {
    current: number
    min: number
    max: number
    unit: string
  }
  gps: {
    lat: number
    lng: number
    altitude: string
    speed: string
    satellites: number
    signalStrength: string
    geofenceStatus: 'CORRIDOR_COMPLIANT' | 'DEVIATION_ALERT' | 'VAULT_SECURED'
  }
  escort: {
    code: string
    unit: string
    protocol: string
  }
}

export interface AssetManifest {
  itemType: string
  description: string
  grossWeight: string
  netFineWeight: string
  fineness: string
  sealNumber: string
  assayLab: string
  assayCertNumber: string
  declaredValue: string
  underwriter: string
  policyNumber: string
  securityTier: string
}

export interface IntermediateStop {
  facility: string
  city: string
  country?: string
  code?: string
  coords?: [number, number]
  stagedAtProgress?: number
  reason?: string
  status: 'active_stage' | 'cleared'
  timestamp?: string
}

export interface Shipment {
  id: string
  trackingNumber: string
  status: string
  statusType: 'in-flight' | 'customs' | 'delivered' | 'staging' | 'destination-holding'
  category: string
  origin: {
    city: string
    country: string
    facility: string
    code: string
    coords: [number, number]
  }
  destination: {
    city: string
    country: string
    facility: string
    code: string
    coords: [number, number]
  }
  currentLocation: {
    name: string
    coords: [number, number]
    statusText: string
  }
  eta: string
  dispatchedAt: string
  progress: number
  isPaused?: boolean
  speedMultiplier?: number
  transportMode: string
  carrierFlightNumber?: string
  custodyOfficer: string
  clientCode?: string
  shipperName?: string
  shipperAddress?: string
  shipperPhone?: string
  receiverName?: string
  receiverContact?: string
  receiverAddress?: string
  shippingWeight?: string
  checkpoints: Checkpoint[]
  telemetry: SensorTelemetry
  manifest: AssetManifest
  intermediateStop?: IntermediateStop | null
}

export interface MarketSpotPrice {
  symbol: string
  name: string
  price: number
  currency: string
  changePercent: number
  unit: string
}

export interface QuoteInquiry {
  id: string
  clientName: string
  email: string
  assetType: string
  declaredValue: number
  originCity: string
  originCode: string
  destinationCity: string
  destinationCode: string
  transitMode: string
  notes?: string
  createdAt: string
  status: 'pending' | 'approved' | 'dispatched'
}

export type UserRole = 'admin' | 'client'

export interface UserProfile {
  id: string
  name: string
  email: string
  role: UserRole
  organization: string
  clientCode?: string
  avatarInitials: string
  securityClearance?: string
  isSuspended?: boolean
  isDashboardLocked?: boolean
  isCertificateLocked?: boolean
  noticeActive?: boolean
  noticeTitle?: string | null
  noticeMessage?: string | null
}

export interface VaultHolding {
  id: string
  clientCode: string
  assetTitle: string
  assetCategory: string
  vaultFacility: string
  vaultCity: string
  weightOzt: number
  grossWeightKg: number
  fineness: string
  hallmark: string
  barSerialNumbers: string[]
  assayCertNumber: string
  declaredValueUSD: number
  storedSince: string
  status: 'Vaulted' | 'Allocated For Transit'
}

export interface StandardLogisticsStage {
  id: string
  name: string
  shortLabel: string
  statusText: string
  statusType: Shipment['statusType']
  defaultProgress?: number
  isStaging?: boolean
  isDestinationHolding?: boolean
  description: string
}

export const STANDARD_LOGISTICS_STAGES: StandardLogisticsStage[] = [
  {
    id: 'stage_vault_release',
    name: 'Origin Depository Staging & Assay Audit',
    shortLabel: '1. Vault Release',
    statusText: 'Vault Staging & Assay Verified',
    statusType: 'staging',
    defaultProgress: 15,
    description: 'Staged in origin bonded vault under dual custody assay verification',
  },
  {
    id: 'stage_armored_convoy',
    name: 'Armored Surface Escort — Airside Tactical Transit',
    shortLabel: '2. Armored Convoy',
    statusText: 'In Transit — Armored Ground Convoy',
    statusType: 'in-flight',
    defaultProgress: 35,
    description: 'Level-B6 airside escort & tarmac secure conveyance',
  },
  {
    id: 'stage_air_corridor',
    name: 'Sovereign Air-Specie Corridor — High Altitude Flight',
    shortLabel: '3. Airborne Corridor',
    statusText: 'In Transit — Secure Air Corridor',
    statusType: 'in-flight',
    defaultProgress: 60,
    description: 'Chartered direct flight transit with active transponder downlink',
  },
  {
    id: 'stage_interim_staging',
    name: 'Interim Bonded Depository Staging (Safe Harbor)',
    shortLabel: '★ Interim Vault Staging',
    statusText: 'Secured Holding in Transit',
    statusType: 'staging',
    isStaging: true,
    description: 'Unscheduled diversion or secure transit hold in certified intermediary depository',
  },
  {
    id: 'stage_transit_audit',
    name: 'Transit Hub Security Audit & Vault Transfer',
    shortLabel: '★ Transit Hub Hold',
    statusText: 'Transit Hub Security Audit Active',
    statusType: 'staging',
    isStaging: true,
    description: 'Custodial inspection & vault transfer at intermediate logistics hub',
  },
  {
    id: 'stage_customs_clearance',
    name: 'Port-of-Entry Bonded Customs & ATA Carnet Inspection',
    shortLabel: '4. Customs Hold',
    statusText: 'Bonded Customs Clearance in Progress',
    statusType: 'customs',
    defaultProgress: 85,
    description: 'Diplomatic port of entry customs inspection and electronic seal audit',
  },
  {
    id: 'stage_destination_arrival_holding',
    name: 'Airside Touchdown & Destination Holding — Pending Consignee Acceptance',
    shortLabel: '★ Destination Airside Hold',
    statusText: 'Arrived at Destination — Pending Consignee Acceptance',
    statusType: 'destination-holding',
    defaultProgress: 100,
    isDestinationHolding: true,
    description: 'Chartered flight landed at destination airside. Gold secured in airport vault awaiting receiver handover.',
  },
  {
    id: 'stage_final_lodgement',
    name: 'Final Depository Handover & Biometric Sign-Off',
    shortLabel: '5. Final Handover',
    statusText: 'Delivered — Verified Handover Complete',
    statusType: 'delivered',
    defaultProgress: 100,
    description: 'Physical handover complete and dual biometric custody certificate closed',
  },
]

export interface DepositoryHub {
  code: string
  name: string
  city: string
  country: string
  coords: [number, number]
  securityTier: string
}

export const STANDARD_DEPOSITORY_HUBS: DepositoryHub[] = [
  {
    code: 'ZRH-FP',
    name: 'Zurich Freeport Vault Depository',
    city: 'Zurich',
    country: 'Switzerland',
    coords: [47.3769, 8.5417],
    securityTier: 'Tier-IV Alpine Subterranean Vault',
  },
  {
    code: 'GVA-FP',
    name: 'Geneva Freeport Bonded Depository',
    city: 'Geneva',
    country: 'Switzerland',
    coords: [46.2044, 6.1432],
    securityTier: 'Category-4 High Security Vault',
  },
  {
    code: 'DXB-DMCC',
    name: 'Dubai Multi Commodities Centre (DMCC)',
    city: 'Dubai',
    country: 'United Arab Emirates',
    coords: [25.2048, 55.2708],
    securityTier: 'DMCC Vault Complex Level-V',
  },
  {
    code: 'SIN-LEFP',
    name: 'Singapore Le Freeport Max-Security Vault',
    city: 'Singapore',
    country: 'Singapore',
    coords: [1.3644, 103.9915],
    securityTier: 'Class-A Bonded Freeport Depository',
  },
  {
    code: 'LHR-VAULT',
    name: 'London City Custodial Specie Depository',
    city: 'London',
    country: 'United Kingdom',
    coords: [51.5074, -0.1278],
    securityTier: 'LBMA Approved Deep Vault Facility',
  },
  {
    code: 'FRA-VAULT',
    name: 'Frankfurt Specie Transit Depository',
    city: 'Frankfurt',
    country: 'Germany',
    coords: [50.1109, 8.6821],
    securityTier: 'Airside High Security Transit Vault',
  },
  {
    code: 'JFK-NY',
    name: 'New York Malca-Amit Bonded Depository',
    city: 'New York',
    country: 'United States',
    coords: [40.6413, -73.7781],
    securityTier: 'Federal Bonded High-Specie Terminal',
  },
]



