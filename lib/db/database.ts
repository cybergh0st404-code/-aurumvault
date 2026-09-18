import { createClient, Client } from '@libsql/client'
import fs from 'node:fs'
import path from 'node:path'
import { hashPassword } from './password'

let clientInstance: Client | null = null
let initPromise: Promise<void> | null = null

export function getDb(): Client {
  if (clientInstance) {
    return clientInstance
  }

  const url = process.env.TURSO_DATABASE_URL || 'file:data/vault.db'
  const authToken = process.env.TURSO_AUTH_TOKEN

  // Ensure local data directory exists if using local file
  if (url.startsWith('file:')) {
    const dbDir = path.join(process.cwd(), 'data')
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true })
    }
  }

  clientInstance = createClient({
    url,
    authToken,
  })

  return clientInstance
}

export async function ensureDbInitialized(): Promise<void> {
  if (initPromise) return initPromise

  initPromise = (async () => {
    const db = getDb()

    // 1. Create tables and indexes
    await db.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        password_salt TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('admin', 'client')),
        client_code TEXT,
        organization TEXT NOT NULL,
        avatar_initials TEXT NOT NULL,
        security_clearance TEXT NOT NULL,
        is_suspended INTEGER NOT NULL DEFAULT 0,
        is_dashboard_locked INTEGER NOT NULL DEFAULT 0,
        is_certificate_locked INTEGER NOT NULL DEFAULT 0,
        notice_active INTEGER NOT NULL DEFAULT 0,
        notice_title TEXT,
        notice_message TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `)

    // Safe column migrations for existing SQLite / Turso databases
    try { await db.execute('ALTER TABLE users ADD COLUMN is_suspended INTEGER NOT NULL DEFAULT 0') } catch {}
    try { await db.execute('ALTER TABLE users ADD COLUMN is_dashboard_locked INTEGER NOT NULL DEFAULT 0') } catch {}
    try { await db.execute('ALTER TABLE users ADD COLUMN is_certificate_locked INTEGER NOT NULL DEFAULT 0') } catch {}
    try { await db.execute('ALTER TABLE users ADD COLUMN notice_active INTEGER NOT NULL DEFAULT 0') } catch {}
    try { await db.execute('ALTER TABLE users ADD COLUMN notice_title TEXT') } catch {}
    try { await db.execute('ALTER TABLE users ADD COLUMN notice_message TEXT') } catch {}

    await db.execute(`
      CREATE TABLE IF NOT EXISTS sessions (
        token TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        expires_at INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `)

    await db.execute(`
      CREATE TABLE IF NOT EXISTS shipment_telemetry (
        shipment_id TEXT PRIMARY KEY,
        progress REAL NOT NULL DEFAULT 55.0,
        is_paused INTEGER NOT NULL DEFAULT 0,
        speed_multiplier REAL NOT NULL DEFAULT 1.0,
        status TEXT,
        updated_at INTEGER NOT NULL
      );
    `)

    await db.execute(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);`)
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);`)

    // Seed initial telemetry for consignment GOLD-2026-093901 (AV-US-93901) if not present
    await db.execute({
      sql: `INSERT OR IGNORE INTO shipment_telemetry (
        shipment_id, progress, is_paused, speed_multiplier, status, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?)`,
      args: ['GOLD-2026-093901', 55.0, 0, 1.0, 'In Transit — Chartered Air-Specie Corridor', Date.now()],
    })

    // 2. Check if users table is empty; if so, seed default accounts
    const countRes = await db.execute('SELECT COUNT(*) as count FROM users')
    const count = Number(countRes.rows[0]?.count ?? 0)

    if (count === 0) {
      await seedDefaultUsers(db)
    }

    // Ensure shipments table is created and seeded with sovereign consignments
    const { ensureShipmentsTable } = await import('./shipment-repository')
    await ensureShipmentsTable()
  })()

  return initPromise
}

async function seedDefaultUsers(db: Client) {
  // Read initial sovereign admin credentials strictly from environment variables
  const email = (process.env.ADMIN_EMAIL || 'chief.marshal@aurumvault.ch').trim().toLowerCase()
  const password = process.env.ADMIN_PASSWORD || 'SwissVault2026!'
  const name = process.env.ADMIN_NAME || 'Marshal Henri Weber'
  const organization = process.env.ADMIN_ORGANIZATION || 'AurumVault Federal Operations Command (Geneva HQ)'
  const clearance = process.env.ADMIN_CLEARANCE || 'LEVEL-V SWISS AIRSPACE COMMAND (ARMED SPECIE)'

  const initials = name
    .split(' ')
    .map(p => p[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'AV'

  const adminCreds = hashPassword(password)
  await db.execute({
    sql: `INSERT INTO users (
      id, email, password_hash, password_salt, name, role, client_code, organization, avatar_initials, security_clearance
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      'USR-ADM-001',
      email,
      adminCreds.hash,
      adminCreds.salt,
      name,
      'admin',
      null,
      organization,
      initials,
      clearance,
    ],
  })

  // Linda S Hudson (Private Specie Client - Indiana / Kentucky Consignment)
  const clientCreds = hashPassword('Hudson2026!')
  await db.execute({
    sql: `INSERT OR IGNORE INTO users (
      id, email, password_hash, password_salt, name, role, client_code, organization, avatar_initials, security_clearance
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      'USR-CLI-HUDSON',
      'lindahudson2p@gmail.com',
      clientCreds.hash,
      clientCreds.salt,
      'Linda S Hudson',
      'client',
      'CLIENT-HUDSON',
      'Linda S Hudson Specie Trust (Hanover Park, IL)',
      'LH',
      'ALLOCATED SOVEREIGN DEPOSITOR #IND-60133',
    ],
  })
}
