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
    geofenceStatus: 'CORRIDOR_COMPLIANT' | 'DEVIATION_ALERT'
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

export interface Shipment {
  id: string
  trackingNumber: string
  status: string
  statusType: 'in-flight' | 'customs' | 'delivered' | 'staging'
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
  checkpoints: Checkpoint[]
  telemetry: SensorTelemetry
  manifest: AssetManifest
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


