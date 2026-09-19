import { getDb, ensureDbInitialized } from './database'

export interface TelemetryRecord {
  shipment_id: string
  progress: number
  is_paused: number
  speed_multiplier: number
  status: string | null
  updated_at: number
}

export async function getAllTelemetry(): Promise<Record<string, TelemetryRecord>> {
  await ensureDbInitialized()
  const db = getDb()
  const res = await db.execute('SELECT * FROM shipment_telemetry')
  const map: Record<string, TelemetryRecord> = {}
  for (const row of res.rows) {
    const rec = row as unknown as TelemetryRecord
    map[rec.shipment_id] = rec
  }
  return map
}

export async function getShipmentTelemetry(shipmentId: string): Promise<TelemetryRecord | null> {
  await ensureDbInitialized()
  const db = getDb()
  const res = await db.execute({
    sql: 'SELECT * FROM shipment_telemetry WHERE shipment_id = ?',
    args: [shipmentId],
  })
  if (res.rows.length === 0) return null
  return res.rows[0] as unknown as TelemetryRecord
}

export async function upsertShipmentTelemetry(
  shipmentId: string,
  data: {
    progress?: number
    isPaused?: boolean
    speedMultiplier?: number
    status?: string
  }
): Promise<TelemetryRecord> {
  await ensureDbInitialized()
  const db = getDb()

  const existing = await getShipmentTelemetry(shipmentId)

  const progress = data.progress !== undefined ? data.progress : (existing ? existing.progress : 55.0)
  const is_paused = data.isPaused !== undefined ? (data.isPaused ? 1 : 0) : (existing ? existing.is_paused : 0)
  const speed_multiplier = data.speedMultiplier !== undefined ? data.speedMultiplier : (existing ? existing.speed_multiplier : 1.0)
  const status = data.status !== undefined ? data.status : (existing ? existing.status : 'In Transit — Chartered Air-Specie Corridor')
  const updated_at = Date.now()

  await db.execute({
    sql: `INSERT INTO shipment_telemetry (shipment_id, progress, is_paused, speed_multiplier, status, updated_at)
          VALUES (?, ?, ?, ?, ?, ?)
          ON CONFLICT(shipment_id) DO UPDATE SET
            progress = excluded.progress,
            is_paused = excluded.is_paused,
            speed_multiplier = excluded.speed_multiplier,
            status = excluded.status,
            updated_at = excluded.updated_at`,
    args: [shipmentId, progress, is_paused, speed_multiplier, status, updated_at],
  })

  // Synchronize shipments table so that both tables stay strictly in lockstep
  try {
    let inferredStatusType: string | undefined = undefined
    if (status) {
      const sLower = status.toLowerCase()
      if (sLower.includes('deliver')) inferredStatusType = 'delivered'
      else if (sLower.includes('custom')) inferredStatusType = 'customs'
      else if (sLower.includes('staging')) inferredStatusType = 'staging'
      else if (sLower.includes('transit') || sLower.includes('convoy') || sLower.includes('flight') || sLower.includes('air')) inferredStatusType = 'in-flight'
    }

    await db.execute({
      sql: `UPDATE shipments SET 
              progress = ?, 
              is_paused = ?, 
              speed_multiplier = ?, 
              status = COALESCE(?, status), 
              status_type = COALESCE(?, status_type),
              updated_at = CURRENT_TIMESTAMP 
            WHERE id = ?`,
      args: [progress, is_paused, speed_multiplier, status ?? null, inferredStatusType ?? null, shipmentId],
    })
  } catch (err) {
    console.warn('Could not update shipments table from telemetry:', err)
  }

  return {
    shipment_id: shipmentId,
    progress,
    is_paused,
    speed_multiplier,
    status,
    updated_at,
  }
}
