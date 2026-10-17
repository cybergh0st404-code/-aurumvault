/**
 * Distributed, persistent sliding-window security rate limiter for authentication endpoints.
 * Persists attempts to SQLite / Turso database to protect against brute-force and credential
 * stuffing across multi-container or serverless function restarts.
 */

import { getDb, ensureDbInitialized } from '../db/database'

interface RateLimitRecord {
  attempts: number[]
  lockedUntil: number | null
}

const memoryStore = new Map<string, RateLimitRecord>()

const WINDOW_MS = 15 * 60 * 1000 // 15 minutes
const MAX_ATTEMPTS = 5 // Max 5 failed attempts per window
const LOCKOUT_MS = 15 * 60 * 1000 // 15-minute lockout

/**
 * Extracts a normalized, validated client IP from headers, checking standard proxy headers.
 */
export function getClientIp(request: Request): string {
  const cfIp = request.headers.get('cf-connecting-ip')
  if (cfIp) return cfIp.trim()

  const realIp = request.headers.get('x-real-ip')
  if (realIp) return realIp.trim()

  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    const parts = forwarded.split(',').map(s => s.trim()).filter(Boolean)
    if (parts.length > 0) {
      return parts[0]
    }
  }

  return '127.0.0.1'
}

async function loadRecord(identifier: string): Promise<RateLimitRecord> {
  const now = Date.now()

  // 1. Check memory cache first
  const cached = memoryStore.get(identifier)
  if (cached) {
    return cached
  }

  // 2. Query persistent DB store
  try {
    await ensureDbInitialized()
    const db = getDb()
    const res = await db.execute({
      sql: 'SELECT attempts, locked_until FROM rate_limits WHERE identifier = ? LIMIT 1',
      args: [identifier],
    })

    if (res.rows.length > 0) {
      const row = res.rows[0]
      const rawAttempts = String(row.attempts || '[]')
      const attempts = (JSON.parse(rawAttempts) as number[]).filter(t => now - t < WINDOW_MS)
      const lockedUntil = row.locked_until ? Number(row.locked_until) : null

      const record: RateLimitRecord = { attempts, lockedUntil }
      memoryStore.set(identifier, record)
      return record
    }
  } catch (err) {
    console.warn('[RateLimiter] Database read error, using memory fallback:', err)
  }

  const fresh: RateLimitRecord = { attempts: [], lockedUntil: null }
  memoryStore.set(identifier, fresh)
  return fresh
}

async function persistRecord(identifier: string, record: RateLimitRecord): Promise<void> {
  memoryStore.set(identifier, record)

  try {
    await ensureDbInitialized()
    const db = getDb()
    await db.execute({
      sql: `INSERT INTO rate_limits (identifier, attempts, locked_until, updated_at)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(identifier) DO UPDATE SET
              attempts = excluded.attempts,
              locked_until = excluded.locked_until,
              updated_at = excluded.updated_at`,
      args: [
        identifier,
        JSON.stringify(record.attempts),
        record.lockedUntil,
        Date.now(),
      ],
    })
  } catch (err) {
    console.warn('[RateLimiter] Database write error:', err)
  }
}

export async function checkRateLimit(identifier: string): Promise<{ allowed: boolean; retryAfterSeconds?: number }> {
  const now = Date.now()
  const record = await loadRecord(identifier)

  // Check if actively locked out
  if (record.lockedUntil && record.lockedUntil > now) {
    const retryAfterSeconds = Math.ceil((record.lockedUntil - now) / 1000)
    return { allowed: false, retryAfterSeconds }
  }

  // Clean up stale attempts outside the window
  const activeAttempts = record.attempts.filter(timestamp => now - timestamp < WINDOW_MS)
  record.attempts = activeAttempts

  if (record.attempts.length >= MAX_ATTEMPTS) {
    record.lockedUntil = now + LOCKOUT_MS
    await persistRecord(identifier, record)
    const retryAfterSeconds = Math.ceil(LOCKOUT_MS / 1000)
    return { allowed: false, retryAfterSeconds }
  }

  return { allowed: true }
}

export async function recordFailedAttempt(identifier: string): Promise<{ remainingAttempts: number; isLocked: boolean }> {
  const now = Date.now()
  const record = await loadRecord(identifier)

  record.attempts = record.attempts.filter(timestamp => now - timestamp < WINDOW_MS)
  record.attempts.push(now)

  if (record.attempts.length >= MAX_ATTEMPTS) {
    record.lockedUntil = now + LOCKOUT_MS
    await persistRecord(identifier, record)
    return { remainingAttempts: 0, isLocked: true }
  }

  await persistRecord(identifier, record)

  return {
    remainingAttempts: MAX_ATTEMPTS - record.attempts.length,
    isLocked: false,
  }
}

export async function resetAttempts(identifier: string): Promise<void> {
  memoryStore.delete(identifier)
  try {
    await ensureDbInitialized()
    const db = getDb()
    await db.execute({
      sql: 'DELETE FROM rate_limits WHERE identifier = ?',
      args: [identifier],
    })
  } catch (err) {
    console.warn('[RateLimiter] Failed to reset attempts from DB:', err)
  }
}
