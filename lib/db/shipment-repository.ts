import { getDb, ensureDbInitialized } from './database'
import { Shipment, Checkpoint, SensorTelemetry, AssetManifest } from '../types'
import { shipmentsData as defaultStaticShipments } from '../shipments-data'
import { formatDeclaredValue } from '../weight-utils'

export function resolveCoordinates(locationName: string): [number, number] {
  const norm = (locationName || '').toLowerCase()
  if (norm.includes('indiana') || norm.includes('hanover') || norm.includes('chicago') || norm.includes('illinois') || norm.includes('ord')) {
    return [41.9961, -88.1473]
  }
  if (norm.includes('kentucky') || norm.includes('crittenden') || norm.includes('cincinnati') || norm.includes('cvg')) {
    return [38.7845, -84.6063]
  }
  if (norm.includes('new york') || norm.includes('jfk') || norm.includes('nyc')) {
    return [40.7128, -74.0060]
  }
  if (norm.includes('geneva') || norm.includes('gva') || norm.includes('freeport')) {
    return [46.2044, 6.1432]
  }
  if (norm.includes('zurich') || norm.includes('zrh')) {
    return [47.3769, 8.5417]
  }
  if (norm.includes('london') || norm.includes('lhr') || norm.includes('lbma')) {
    return [51.5074, -0.1278]
  }
  if (norm.includes('dubai') || norm.includes('dxb') || norm.includes('dmcc')) {
    return [25.2048, 55.2708]
  }
  if (norm.includes('singapore') || norm.includes('sin') || norm.includes('changi')) {
    return [1.3521, 103.8198]
  }
  if (norm.includes('hong kong') || norm.includes('hkg')) {
    return [22.3193, 114.1694]
  }
  if (norm.includes('tokyo') || norm.includes('nrt') || norm.includes('hnd')) {
    return [35.6762, 139.6503]
  }
  if (norm.includes('florida') || norm.includes('miami')) {
    return [25.7617, -80.1918]
  }
  if (norm.includes('california') || norm.includes('los angeles') || norm.includes('lax')) {
    return [34.0522, -118.2437]
  }
  if (norm.includes('texas') || norm.includes('dallas')) {
    return [32.7767, -96.7970]
  }

  // Default coordinate if unmapped
  return [40.0 + (locationName.length % 5), -85.0 - (locationName.length % 5)]
}

export async function ensureShipmentsTable(): Promise<void> {
  const db = getDb()
  await db.execute(`
    CREATE TABLE IF NOT EXISTS shipments (
      id TEXT PRIMARY KEY,
      client_code TEXT,
      tracking_number TEXT NOT NULL,
      status TEXT NOT NULL,
      status_type TEXT NOT NULL,
      category TEXT NOT NULL,
      shipper_name TEXT,
      shipper_address TEXT,
      shipper_phone TEXT,
      origin_city TEXT NOT NULL,
      origin_country TEXT NOT NULL,
      origin_facility TEXT NOT NULL,
      origin_code TEXT NOT NULL,
      origin_lat REAL NOT NULL,
      origin_lng REAL NOT NULL,
      receiver_name TEXT,
      receiver_contact TEXT,
      receiver_address TEXT,
      destination_city TEXT NOT NULL,
      destination_country TEXT NOT NULL,
      destination_facility TEXT NOT NULL,
      destination_code TEXT NOT NULL,
      destination_lat REAL NOT NULL,
      destination_lng REAL NOT NULL,
      current_location_name TEXT,
      current_location_status_text TEXT,
      eta TEXT NOT NULL,
      dispatched_at TEXT NOT NULL,
      progress REAL NOT NULL DEFAULT 55.0,
      is_paused INTEGER NOT NULL DEFAULT 0,
      speed_multiplier REAL NOT NULL DEFAULT 1.0,
      transport_mode TEXT NOT NULL,
      carrier_flight_number TEXT,
      custody_officer TEXT NOT NULL,
      shipping_weight TEXT,
      manifest_json TEXT NOT NULL,
      checkpoints_json TEXT NOT NULL,
      telemetry_json TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `)

  await db.execute(`CREATE INDEX IF NOT EXISTS idx_shipments_client_code ON shipments(client_code);`)

  // Check if shipments table has records; if not, seed with initial shipments
  const countRes = await db.execute('SELECT COUNT(*) as count FROM shipments')
  const count = Number(countRes.rows[0]?.count ?? 0)

  if (count === 0) {
    for (const s of defaultStaticShipments) {
      await insertShipmentIntoDb(s)
    }
  }
}

function parseJsonSafe<T>(val: any, fallback: T): T {
  if (!val) return fallback
  if (typeof val === 'object') return val as T
  try {
    return JSON.parse(val) as T
  } catch {
    return fallback
  }
}

function rowToShipment(row: any): Shipment {
  const manifest = parseJsonSafe<AssetManifest>(row.manifest_json, {} as AssetManifest)
  const checkpoints = parseJsonSafe<Checkpoint[]>(row.checkpoints_json, [])
  const telemetry = parseJsonSafe<SensorTelemetry>(row.telemetry_json, {} as SensorTelemetry)

  return {
    id: String(row.id),
    trackingNumber: String(row.tracking_number),
    status: String(row.status),
    statusType: row.status_type as Shipment['statusType'],
    category: String(row.category),
    origin: {
      city: String(row.origin_city),
      country: String(row.origin_country),
      facility: String(row.origin_facility),
      code: String(row.origin_code),
      coords: [Number(row.origin_lat), Number(row.origin_lng)],
    },
    destination: {
      city: String(row.destination_city),
      country: String(row.destination_country),
      facility: String(row.destination_facility),
      code: String(row.destination_code),
      coords: [Number(row.destination_lat), Number(row.destination_lng)],
    },
    currentLocation: {
      name: String(row.current_location_name || `${row.origin_city} to ${row.destination_city} Air Corridor`),
      coords: [
        (Number(row.origin_lat) + Number(row.destination_lat)) / 2,
        (Number(row.origin_lng) + Number(row.destination_lng)) / 2,
      ],
      statusText: String(row.current_location_status_text || 'Cruising FL280 • Chartered Air-Specie Convoy Flight'),
    },
    eta: String(row.eta),
    dispatchedAt: String(row.dispatched_at),
    progress: Number(row.progress),
    isPaused: Boolean(row.is_paused),
    speedMultiplier: Number(row.speed_multiplier) || 1,
    transportMode: String(row.transport_mode),
    carrierFlightNumber: row.carrier_flight_number ? String(row.carrier_flight_number) : 'AV-SPECIE-AIR',
    custodyOfficer: String(row.custody_officer),
    clientCode: row.client_code ? String(row.client_code) : undefined,
    shipperName: row.shipper_name ? String(row.shipper_name) : undefined,
    shipperAddress: row.shipper_address ? String(row.shipper_address) : undefined,
    shipperPhone: row.shipper_phone ? String(row.shipper_phone) : undefined,
    receiverName: row.receiver_name ? String(row.receiver_name) : undefined,
    receiverContact: row.receiver_contact ? String(row.receiver_contact) : undefined,
    receiverAddress: row.receiver_address ? String(row.receiver_address) : undefined,
    shippingWeight: row.shipping_weight ? String(row.shipping_weight) : undefined,
    checkpoints,
    telemetry,
    manifest,
  }
}

async function insertShipmentIntoDb(s: Shipment): Promise<void> {
  const db = getDb()

  // Extract shipper info if not explicitly present
  const shipperName = s.shipperName || (s.clientCode === 'CLIENT-HUDSON' ? 'Linda S Hudson' : undefined)
  const shipperAddress = s.shipperAddress || (s.clientCode === 'CLIENT-HUDSON' ? '1365 Fremont Dr, Hanover Park, IL 60133' : undefined)
  const shipperPhone = s.shipperPhone || (s.clientCode === 'CLIENT-HUDSON' ? '+1 (470) 305-9614' : undefined)

  const receiverName = s.receiverName || (s.clientCode === 'CLIENT-HUDSON' ? 'Chris Bucksath' : undefined)
  const receiverContact = s.receiverContact || (s.clientCode === 'CLIENT-HUDSON' ? '+1 (859) 907-3706' : undefined)
  const receiverAddress = s.receiverAddress || (s.clientCode === 'CLIENT-HUDSON' ? '321 Pimlico Ct Crittenden Ky 41030' : undefined)
  const shippingWeight = s.shippingWeight || s.manifest?.grossWeight || '93.9 g'

  await db.execute({
    sql: `
      INSERT OR REPLACE INTO shipments (
        id, client_code, tracking_number, status, status_type, category,
        shipper_name, shipper_address, shipper_phone,
        origin_city, origin_country, origin_facility, origin_code, origin_lat, origin_lng,
        receiver_name, receiver_contact, receiver_address,
        destination_city, destination_country, destination_facility, destination_code, destination_lat, destination_lng,
        current_location_name, current_location_status_text, eta, dispatched_at, progress, is_paused, speed_multiplier,
        transport_mode, carrier_flight_number, custody_officer, shipping_weight,
        manifest_json, checkpoints_json, telemetry_json, updated_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, CURRENT_TIMESTAMP
      )
    `,
    args: [
      s.id,
      s.clientCode || null,
      s.trackingNumber,
      s.status,
      s.statusType,
      s.category,
      shipperName || null,
      shipperAddress || null,
      shipperPhone || null,
      s.origin.city,
      s.origin.country,
      s.origin.facility,
      s.origin.code,
      s.origin.coords[0],
      s.origin.coords[1],
      receiverName || null,
      receiverContact || null,
      receiverAddress || null,
      s.destination.city,
      s.destination.country,
      s.destination.facility,
      s.destination.code,
      s.destination.coords[0],
      s.destination.coords[1],
      s.currentLocation?.name || null,
      s.currentLocation?.statusText || null,
      s.eta,
      s.dispatchedAt,
      s.progress ?? 55,
      s.isPaused ? 1 : 0,
      s.speedMultiplier ?? 1,
      s.transportMode,
      s.carrierFlightNumber || null,
      s.custodyOfficer,
      shippingWeight,
      JSON.stringify(s.manifest),
      JSON.stringify(s.checkpoints),
      JSON.stringify(s.telemetry),
    ],
  })
}

export async function listAllShipments(): Promise<Shipment[]> {
  await ensureDbInitialized()
  const db = getDb()
  const res = await db.execute('SELECT * FROM shipments ORDER BY created_at DESC')
  return res.rows.map(rowToShipment)
}

export async function getShipmentById(id: string): Promise<Shipment | null> {
  await ensureDbInitialized()
  const db = getDb()
  const res = await db.execute({
    sql: 'SELECT * FROM shipments WHERE id = ?',
    args: [id],
  })
  if (res.rows.length === 0) return null
  return rowToShipment(res.rows[0])
}

export async function getShipmentsByClientCode(clientCode: string): Promise<Shipment[]> {
  await ensureDbInitialized()
  const db = getDb()
  const res = await db.execute({
    sql: 'SELECT * FROM shipments WHERE client_code = ? ORDER BY created_at DESC',
    args: [clientCode],
  })
  return res.rows.map(rowToShipment)
}

export async function getShipmentByIdOrClientCode(idOrClientCode: string): Promise<Shipment | null> {
  await ensureDbInitialized()
  const db = getDb()
  const res = await db.execute({
    sql: 'SELECT * FROM shipments WHERE id = ? OR client_code = ? ORDER BY created_at DESC LIMIT 1',
    args: [idOrClientCode, idOrClientCode],
  })
  if (res.rows.length === 0) return null
  return rowToShipment(res.rows[0])
}

export async function createDedicatedShipmentForClient(client: {
  clientCode: string
  name: string
  shipperName?: string
  origin?: string
  shipperAddress?: string
  shipperPhone?: string
  receiverName?: string
  receiverContact?: string
  receiverAddress?: string
  shippingWeight?: string
  eta?: string
  destination?: string
  declaredValue?: string
}): Promise<Shipment> {
  await ensureDbInitialized()
  const randomSuffix = Math.floor(100000 + Math.random() * 900000)
  const id = `GOLD-2026-${randomSuffix}`

  const shipperName = client.shipperName || client.name || 'Private Specie Shipper'
  const originCity = client.origin || 'Indiana'
  const originAddress = client.shipperAddress || 'State: Hanover. Pk. Illinois 1365. Fremont Dr. Zip code :60133.'
  const shipperPhone = client.shipperPhone || '+1 (470) 305-9614'

  const receiverName = client.receiverName || 'Chris Bucksath'
  const receiverContact = client.receiverContact || '+1 (859) 907-3706'
  const receiverAddress = client.receiverAddress || '321 Pimlico Ct Crittenden Ky 41030'
  const destinationCity = client.destination || 'Kentucky'

  const shippingWeight = client.shippingWeight || '93.9 g'
  const eta = client.eta || '17/09/26'

  const originCoords = resolveCoordinates(originCity)
  const destCoords = resolveCoordinates(destinationCity)

  const trackingNumber = `AV-US-${Math.floor(10000 + Math.random() * 90000)}`

  const originFacility = `${originAddress} (Shipper: ${shipperName}, ${shipperPhone})`
  const destFacility = `${receiverAddress} (Receiver: ${receiverName}, ${receiverContact})`

  const newShipment: Shipment = {
    id,
    trackingNumber,
    status: 'In Transit — Chartered Air-Specie Corridor',
    statusType: 'in-flight',
    category: 'Precious Metals & Bullion',
    origin: {
      city: originCity,
      country: 'United States',
      facility: originFacility,
      code: originCity.slice(0, 3).toUpperCase() + '-AIR',
      coords: originCoords,
    },
    destination: {
      city: destinationCity,
      country: 'United States',
      facility: destFacility,
      code: destinationCity.slice(0, 3).toUpperCase() + '-SEC',
      coords: destCoords,
    },
    currentLocation: {
      name: `${originCity} to ${destinationCity} Chartered Flight Corridor`,
      coords: [(originCoords[0] + destCoords[0]) / 2, (originCoords[1] + destCoords[1]) / 2],
      statusText: 'Cruising FL280 • Chartered Air-Specie Convoy Flight',
    },
    eta: eta.includes('/') ? `${eta}, 14:00 EDT` : eta,
    dispatchedAt: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ', 08:30 CDT',
    progress: 55,
    transportMode: `Chartered Air-Specie Flight (${trackingNumber})`,
    carrierFlightNumber: `${trackingNumber} / SPECIE-AIR`,
    custodyOfficer: 'Chief Flight Marshal D. Miller (ID: #US-AIR-410)',
    clientCode: client.clientCode,
    shipperName,
    shipperAddress: originAddress,
    shipperPhone,
    receiverName,
    receiverContact,
    receiverAddress,
    shippingWeight,
    checkpoints: [
      {
        id: `cp-${Date.now()}-1`,
        timestamp: '14 Sep 2026, 08:30 CDT',
        title: 'Shipper Handover & Custody Seal Verification',
        location: `${originCity} Corridor`,
        facility: originAddress,
        status: 'completed',
        officer: 'Agent T. Vance (ID: #AV-CHI-992)',
        officerId: 'AV-CHI-992',
        sealId: `SEAL-${client.clientCode}-A`,
        hash: 'SHA256:' + Math.random().toString(16).substring(2) + Math.random().toString(16).substring(2),
        notes: `Precious bullion item received from shipper ${shipperName} (${shipperPhone}). Calibrated weight confirmed at ${shippingWeight}. Dual tamper-evident container locked.`,
      },
      {
        id: `cp-${Date.now()}-2`,
        timestamp: '14 Sep 2026, 11:45 CDT',
        title: 'Airside Loading & Aircraft Specie Clearance',
        location: `${originCity} Regional Airside Apron`,
        facility: 'VIP Air Cargo Apron Stand #4',
        status: 'completed',
        officer: 'Flight Security Lead K. Bennett',
        officerId: 'AV-AIR-301',
        sealId: `SEAL-${client.clientCode}-B`,
        hash: 'SHA256:' + Math.random().toString(16).substring(2) + Math.random().toString(16).substring(2),
        notes: 'Tamper seal intact. IoT electronic tracking beacon confirmed online. Specie cask locked in pressurized aircraft hold.',
      },
      {
        id: `cp-${Date.now()}-3`,
        timestamp: '15 Sep 2026, 02:15 EDT',
        title: 'Airborne In-Flight Corridor Transit (FL280)',
        location: 'Midwest Regional Airspace',
        facility: `Flight ${trackingNumber} (Cruising FL280)`,
        status: 'current',
        officer: 'Captain R. Vance & Marshal D. Miller',
        officerId: 'US-AIR-410',
        sealId: `AES-${client.clientCode}-ACTIVE`,
        hash: 'SHA256:' + Math.random().toString(16).substring(2) + Math.random().toString(16).substring(2),
        notes: 'Aircraft cruising at FL280 with active radar downlink. All environmental sensors nominal. Direct approach vector into sector.',
      },
      {
        id: `cp-${Date.now()}-4`,
        timestamp: eta.includes('/') ? `${eta}, 14:00 EDT (Estimated Delivery)` : `${eta} (Estimated Delivery)`,
        title: `${destinationCity} Airside Reception & Final Handover Acceptance`,
        location: `${destinationCity} Airside ➔ Destination Doorstep`,
        facility: receiverAddress,
        status: 'pending',
        officer: `Designated Receiver: ${receiverName} (${receiverContact})`,
        officerId: 'PENDING-VERIFICATION',
        notes: `Dual photographic identification & biometric PIN signature required from receiver ${receiverName} upon physical delivery handover.`,
      },
    ],
    telemetry: {
      electronicSeal: {
        id: `AES-${client.clientCode}-ACTIVE`,
        status: 'SECURE',
        battery: '99.4%',
        lastPing: '2 mins ago',
      },
      gForce: {
        current: 1.01,
        maxRecorded: 1.15,
        threshold: 3.5,
        unit: 'G',
      },
      lightExposure: {
        current: 0,
        status: 'SEALED_VAULT',
        unit: 'lux',
      },
      temperature: {
        current: 21.2,
        min: 19.5,
        max: 22.8,
        unit: '°C',
      },
      gps: {
        lat: (originCoords[0] + destCoords[0]) / 2,
        lng: (originCoords[1] + destCoords[1]) / 2,
        altitude: '28,000 ft',
        speed: '440 knots',
        satellites: 14,
        signalStrength: '99%',
        geofenceStatus: 'CORRIDOR_COMPLIANT',
      },
      escort: {
        code: `ESC-AIR-${Math.floor(100 + Math.random() * 900)}`,
        unit: 'AurumVault Armed Air-Specie Courier Detail',
        protocol: 'Lloyd’s of London Air-Specie Protection Protocol Tier-II',
      },
    },
    manifest: {
      itemType: 'Precious Air-Specie Consignment',
      description: `Chartered Gold Specie Flight Package (Shipper: ${shipperName}, Receiver: ${receiverName})`,
      grossWeight: shippingWeight,
      netFineWeight: `${shippingWeight} Fine Specie`,
      fineness: '999.9 / 1000 Au',
      sealNumber: `SEAL-${client.clientCode}-A`,
      assayLab: 'Swiss Precious Metals & Assayer Certification',
      assayCertNumber: `ASSAY-${client.clientCode}`,
      declaredValue: formatDeclaredValue(client.declaredValue || '$16,355.00 USD'),
      underwriter: 'Lloyd’s of London Specie Syndicate #33',
      policyNumber: `LL-SPEC-${Math.floor(10000 + Math.random() * 90000)}-US`,
      securityTier: 'TIER-II DUAL CUSTODY CHARTERED AIR-SPECIE TRANSIT',
    },
  }

  await insertShipmentIntoDb(newShipment)
  return newShipment
}

export async function updateShipmentDetails(
  id: string,
  updates: {
    shipperName?: string
    originCity?: string
    shipperAddress?: string
    shipperPhone?: string
    receiverName?: string
    receiverContact?: string
    receiverAddress?: string
    destinationCity?: string
    shippingWeight?: string
    eta?: string
    status?: string
    statusType?: Shipment['statusType']
    progress?: number
    isPaused?: boolean
    speedMultiplier?: number
    carrierFlightNumber?: string
    custodyOfficer?: string
    declaredValue?: string
    cargoDescription?: string
  }
): Promise<Shipment | null> {
  await ensureDbInitialized()
  let existing = await getShipmentById(id)
  if (!existing) {
    existing = await getShipmentByIdOrClientCode(id)
  }
  if (!existing) return null

  const shipperName = updates.shipperName !== undefined ? updates.shipperName : (existing.shipperName || 'Linda S Hudson')
  const originCity = updates.originCity !== undefined ? updates.originCity : existing.origin.city
  const shipperAddress = updates.shipperAddress !== undefined ? updates.shipperAddress : (existing.shipperAddress || '1365 Fremont Dr, Hanover Park, IL 60133')
  const shipperPhone = updates.shipperPhone !== undefined ? updates.shipperPhone : (existing.shipperPhone || '+1 (470) 305-9614')

  const receiverName = updates.receiverName !== undefined ? updates.receiverName : (existing.receiverName || 'Chris Bucksath')
  const receiverContact = updates.receiverContact !== undefined ? updates.receiverContact : (existing.receiverContact || '+1 (859) 907-3706')
  const receiverAddress = updates.receiverAddress !== undefined ? updates.receiverAddress : (existing.receiverAddress || '321 Pimlico Ct Crittenden Ky 41030')
  const destinationCity = updates.destinationCity !== undefined ? updates.destinationCity : existing.destination.city

  const shippingWeight = updates.shippingWeight !== undefined ? updates.shippingWeight : (existing.shippingWeight || existing.manifest.grossWeight)
  const eta = updates.eta !== undefined ? updates.eta : existing.eta

  const status = updates.status !== undefined ? updates.status : existing.status
  let statusType = updates.statusType
  if (!statusType && updates.status) {
    const sLower = updates.status.toLowerCase()
    if (sLower.includes('deliver')) statusType = 'delivered'
    else if (sLower.includes('custom')) statusType = 'customs'
    else if (sLower.includes('staging')) statusType = 'staging'
    else if (sLower.includes('transit') || sLower.includes('convoy') || sLower.includes('flight') || sLower.includes('air')) statusType = 'in-flight'
  }
  statusType = statusType || existing.statusType
  const progress = updates.progress !== undefined ? Number(updates.progress) : existing.progress
  const isPaused = updates.isPaused !== undefined ? Boolean(updates.isPaused) : (existing.isPaused ?? false)
  const speedMultiplier = updates.speedMultiplier !== undefined ? Number(updates.speedMultiplier) : (existing.speedMultiplier ?? 1)

  const carrierFlightNumber = updates.carrierFlightNumber !== undefined ? updates.carrierFlightNumber : (existing.carrierFlightNumber || 'AV-US-93901 / SPECIE-AIR')
  const custodyOfficer = updates.custodyOfficer !== undefined ? updates.custodyOfficer : existing.custodyOfficer

  // Recalculate coordinates if origin or destination changed
  const originCoords = resolveCoordinates(originCity)
  const destCoords = resolveCoordinates(destinationCity)

  const originFacility = `${shipperAddress} (Shipper: ${shipperName}, ${shipperPhone})`
  const destFacility = `${receiverAddress} (Receiver: ${receiverName}, ${receiverContact})`

  // Update manifest
  const manifest: AssetManifest = {
    ...existing.manifest,
    description: updates.cargoDescription || `Chartered Gold Specie Flight Package (Shipper: ${shipperName}, Receiver: ${receiverName})`,
    grossWeight: shippingWeight,
    netFineWeight: `${shippingWeight} Fine Specie`,
    declaredValue: updates.declaredValue ? formatDeclaredValue(updates.declaredValue) : existing.manifest.declaredValue,
  }

  // Update checkpoints to reflect new names & locations
  const checkpoints: Checkpoint[] = existing.checkpoints.map((cp, idx) => {
    if (idx === 0) {
      return {
        ...cp,
        facility: shipperAddress,
        notes: `Precious bullion item received from shipper ${shipperName} (${shipperPhone}). Calibrated weight confirmed at ${shippingWeight}. Dual tamper-evident container locked.`,
      }
    }
    if (idx === existing.checkpoints.length - 1) {
      return {
        ...cp,
        facility: receiverAddress,
        officer: `Designated Receiver: ${receiverName} (${receiverContact})`,
        notes: `Dual photographic identification & biometric PIN signature required from receiver ${receiverName} upon physical delivery handover.`,
        timestamp: eta.includes('/') ? `${eta}, 14:00 EDT (Estimated Delivery)` : `${eta} (Estimated Delivery)`,
      }
    }
    return cp
  })

  const telemetry: SensorTelemetry = {
    ...existing.telemetry,
    gps: {
      ...existing.telemetry.gps,
      lat: (originCoords[0] + destCoords[0]) / 2,
      lng: (originCoords[1] + destCoords[1]) / 2,
    },
  }

  const updatedShipment: Shipment = {
    ...existing,
    status,
    statusType,
    progress,
    isPaused,
    speedMultiplier,
    carrierFlightNumber,
    custodyOfficer,
    eta,
    shipperName,
    shipperAddress,
    shipperPhone,
    receiverName,
    receiverContact,
    receiverAddress,
    shippingWeight,
    origin: {
      ...existing.origin,
      city: originCity,
      facility: originFacility,
      code: originCity.slice(0, 3).toUpperCase() + '-AIR',
      coords: originCoords,
    },
    destination: {
      ...existing.destination,
      city: destinationCity,
      facility: destFacility,
      code: destinationCity.slice(0, 3).toUpperCase() + '-SEC',
      coords: destCoords,
    },
    currentLocation: {
      name: `${originCity} to ${destinationCity} Chartered Flight Corridor`,
      coords: [(originCoords[0] + destCoords[0]) / 2, (originCoords[1] + destCoords[1]) / 2],
      statusText: isPaused ? 'RADAR STANDBY • CONTROL HOLD (PAUSED)' : 'Cruising FL280 • Chartered Air-Specie Convoy Flight',
    },
    manifest,
    checkpoints,
    telemetry,
  }

  await insertShipmentIntoDb(updatedShipment)

  // Also sync with shipment_telemetry table for fast telemetry polling
  const db = getDb()
  await db.execute({
    sql: `
      INSERT INTO shipment_telemetry (shipment_id, progress, is_paused, speed_multiplier, status, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(shipment_id) DO UPDATE SET
        progress = excluded.progress,
        is_paused = excluded.is_paused,
        speed_multiplier = excluded.speed_multiplier,
        status = excluded.status,
        updated_at = excluded.updated_at
    `,
    args: [id, progress, isPaused ? 1 : 0, speedMultiplier, status, Date.now()],
  })

  return updatedShipment
}

export async function deleteShipmentFromDb(id: string): Promise<boolean> {
  await ensureDbInitialized()
  const db = getDb()
  const res = await db.execute({
    sql: 'DELETE FROM shipments WHERE id = ?',
    args: [id],
  })
  return res.rowsAffected > 0
}
