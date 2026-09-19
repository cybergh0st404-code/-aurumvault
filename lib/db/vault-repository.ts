import { getDb, ensureDbInitialized } from './database'
import { VaultHolding } from '../types'
import { initialVaultHoldings as defaultStaticHoldings } from '../shipments-data'
import { parseWeightToOzt, oztToKg } from '../weight-utils'

function rowToVaultHolding(row: any): VaultHolding {
  let barSerialNumbers: string[] = []
  try {
    if (typeof row.bar_serial_numbers_json === 'string') {
      barSerialNumbers = JSON.parse(row.bar_serial_numbers_json)
    } else if (Array.isArray(row.bar_serial_numbers_json)) {
      barSerialNumbers = row.bar_serial_numbers_json
    }
  } catch {
    barSerialNumbers = []
  }

  return {
    id: String(row.id),
    clientCode: String(row.client_code || ''),
    assetTitle: String(row.asset_title || 'Allocated Investment-Grade Specie Package'),
    assetCategory: String(row.asset_category || 'Precious Metals & Bullion'),
    vaultFacility: String(row.vault_facility || 'Geneva Freeport Deep Depository Tier-IV'),
    vaultCity: String(row.vault_city || 'Geneva, Switzerland'),
    weightOzt: Number(row.weight_ozt || 0),
    grossWeightKg: Number(row.gross_weight_kg || 0),
    fineness: String(row.fineness || '999.9 Fine Gold'),
    hallmark: String(row.hallmark || 'Swiss Assayer Certification'),
    barSerialNumbers,
    assayCertNumber: String(row.assay_cert_number || 'ASSAY-VAULT'),
    declaredValueUSD: Number(row.declared_value_usd || 0),
    storedSince: String(row.stored_since || '14 Sep 2026'),
    status: (row.status === 'Allocated For Transit' ? 'Allocated For Transit' : 'Vaulted') as 'Vaulted' | 'Allocated For Transit',
  }
}

export async function ensureVaultHoldingsTable(): Promise<void> {
  const db = getDb()
  await db.execute(`
    CREATE TABLE IF NOT EXISTS vault_holdings (
      id TEXT PRIMARY KEY,
      client_code TEXT NOT NULL,
      asset_title TEXT NOT NULL,
      asset_category TEXT NOT NULL DEFAULT 'Precious Metals & Bullion',
      vault_facility TEXT NOT NULL DEFAULT 'Geneva Freeport Deep Depository Tier-IV',
      vault_city TEXT NOT NULL DEFAULT 'Geneva, Switzerland',
      weight_ozt REAL NOT NULL DEFAULT 0,
      gross_weight_kg REAL NOT NULL DEFAULT 0,
      fineness TEXT NOT NULL DEFAULT '999.9 Fine Gold',
      hallmark TEXT NOT NULL DEFAULT 'Swiss Assayer Certification',
      bar_serial_numbers_json TEXT NOT NULL DEFAULT '[]',
      assay_cert_number TEXT NOT NULL,
      declared_value_usd REAL NOT NULL DEFAULT 0,
      stored_since TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Vaulted',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `)

  await db.execute(`CREATE INDEX IF NOT EXISTS idx_vault_holdings_client_code ON vault_holdings(client_code);`)

  // Check if table is empty; if so, seed with initial default holdings
  const countRes = await db.execute('SELECT COUNT(*) as count FROM vault_holdings')
  const count = Number(countRes.rows[0]?.count ?? 0)

  if (count === 0 && defaultStaticHoldings && defaultStaticHoldings.length > 0) {
    for (const holding of defaultStaticHoldings) {
      await insertOrUpdateVaultHolding(holding)
    }
  }
}

export async function insertOrUpdateVaultHolding(h: VaultHolding): Promise<void> {
  const db = getDb()
  await db.execute({
    sql: `
      INSERT OR REPLACE INTO vault_holdings (
        id, client_code, asset_title, asset_category, vault_facility, vault_city,
        weight_ozt, gross_weight_kg, fineness, hallmark, bar_serial_numbers_json,
        assay_cert_number, declared_value_usd, stored_since, status, updated_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, CURRENT_TIMESTAMP
      )
    `,
    args: [
      h.id,
      h.clientCode,
      h.assetTitle,
      h.assetCategory || 'Precious Metals & Bullion',
      h.vaultFacility || 'Geneva Freeport Deep Depository Tier-IV',
      h.vaultCity || 'Geneva, Switzerland',
      Number(h.weightOzt) || 0,
      Number(h.grossWeightKg) || 0,
      h.fineness || '999.9 Fine Gold',
      h.hallmark || 'Swiss Assayer Certification',
      JSON.stringify(h.barSerialNumbers || []),
      h.assayCertNumber || `ASSAY-${h.clientCode}`,
      Number(h.declaredValueUSD) || 0,
      h.storedSince || '14 Sep 2026',
      h.status || 'Vaulted',
    ],
  })
}

export async function listAllVaultHoldings(): Promise<VaultHolding[]> {
  await ensureDbInitialized()
  const db = getDb()
  const res = await db.execute('SELECT * FROM vault_holdings ORDER BY created_at DESC')
  return res.rows.map(rowToVaultHolding)
}

export async function getVaultHoldingsByClientCode(clientCode: string): Promise<VaultHolding[]> {
  await ensureDbInitialized()
  const db = getDb()
  const res = await db.execute({
    sql: 'SELECT * FROM vault_holdings WHERE client_code = ? ORDER BY created_at DESC',
    args: [clientCode],
  })
  return res.rows.map(rowToVaultHolding)
}

export async function getVaultHoldingById(id: string): Promise<VaultHolding | null> {
  await ensureDbInitialized()
  const db = getDb()
  const res = await db.execute({
    sql: 'SELECT * FROM vault_holdings WHERE id = ?',
    args: [id],
  })
  if (res.rows.length === 0) return null
  return rowToVaultHolding(res.rows[0])
}

export async function deleteVaultHolding(id: string): Promise<boolean> {
  await ensureDbInitialized()
  const db = getDb()
  const res = await db.execute({
    sql: 'DELETE FROM vault_holdings WHERE id = ?',
    args: [id],
  })
  return res.rowsAffected > 0
}

/**
 * Synchronize client's vaulted lots with the admin's configured lot count and gold weight.
 * Ensures the client has exactly the desired number of audited parcels in the database.
 */
export async function syncClientVaultHoldings(params: {
  clientCode: string
  clientName?: string
  lotCount?: number
  goldWeight?: string | number
  declaredValueUSD?: number
  vaultFacility?: string
}): Promise<VaultHolding[]> {
  await ensureDbInitialized()
  const clientCode = params.clientCode
  if (!clientCode) return []

  const requestedLots = Math.max(1, Number(params.lotCount) || 1)
  const totalWeightOzt = params.goldWeight !== undefined ? parseWeightToOzt(params.goldWeight) : 3.019
  const totalWeightKg = oztToKg(totalWeightOzt)
  const totalValueUSD = params.declaredValueUSD !== undefined ? Number(params.declaredValueUSD) : 16355

  const vaultFacility = params.vaultFacility || 'Geneva Freeport Deep Depository Tier-IV'
  const vaultCity = vaultFacility.includes('Zurich')
    ? 'Zurich, Switzerland'
    : vaultFacility.includes('Midwest') || vaultFacility.includes('Indiana')
    ? 'Midwest Regional Vault, USA'
    : vaultFacility.includes('London')
    ? 'London, United Kingdom'
    : 'Geneva, Switzerland'

  const existing = await getVaultHoldingsByClientCode(clientCode)

  const weightPerLotOzt = requestedLots > 0 ? totalWeightOzt / requestedLots : totalWeightOzt
  const weightPerLotKg = requestedLots > 0 ? totalWeightKg / requestedLots : totalWeightKg
  const baseValuePerLot = requestedLots > 0 ? Math.floor(totalValueUSD / requestedLots) : totalValueUSD
  const remainderValue = requestedLots > 0 ? totalValueUSD - (baseValuePerLot * requestedLots) : 0

  const updatedHoldings: VaultHolding[] = []

  for (let i = 0; i < requestedLots; i++) {
    const existingHolding = existing[i]
    const lotIndex = i + 1
    const holdingId = existingHolding?.id || `VH-${clientCode.replace(/[^A-Z0-9]/gi, '')}-${String(lotIndex).padStart(2, '0')}`

    const gramsFormatted = (weightPerLotKg * 1000).toFixed(1)
    const title = requestedLots === 1
      ? `Allocated ${gramsFormatted}g Investment-Grade Specie Package`
      : `Allocated Lot #${lotIndex} (${gramsFormatted}g Sovereign Specie Parcel)`

    const serialPrefix = `AV-${clientCode.replace(/[^A-Z0-9]/gi, '').slice(-5) || 'US'}-${lotIndex}`
    const barSerialNumbers = existingHolding?.barSerialNumbers?.length
      ? existingHolding.barSerialNumbers
      : [`${serialPrefix}-01`, `${serialPrefix}-02`]

    const lotDeclaredVal = i === requestedLots - 1 ? baseValuePerLot + remainderValue : baseValuePerLot

    const holding: VaultHolding = {
      id: holdingId,
      clientCode,
      assetTitle: title,
      assetCategory: 'Precious Metals & Bullion',
      vaultFacility,
      vaultCity,
      weightOzt: Number(weightPerLotOzt.toFixed(3)),
      grossWeightKg: Number(weightPerLotKg.toFixed(4)),
      fineness: '999.9 Fine Specie Au',
      hallmark: 'AurumVault Verified Assay Seal',
      barSerialNumbers,
      assayCertNumber: existingHolding?.assayCertNumber || `ASSAY-${clientCode}-${lotIndex}`,
      declaredValueUSD: lotDeclaredVal,
      storedSince: existingHolding?.storedSince || '14 Sep 2026',
      status: lotIndex === 1 ? 'Allocated For Transit' : (existingHolding?.status || 'Vaulted'),
    }

    await insertOrUpdateVaultHolding(holding)
    updatedHoldings.push(holding)
  }

  // Remove any excess lots if the admin reduced the lot count
  if (existing.length > requestedLots) {
    const toDelete = existing.slice(requestedLots)
    for (const excess of toDelete) {
      await deleteVaultHolding(excess.id)
    }
  }

  return updatedHoldings
}
