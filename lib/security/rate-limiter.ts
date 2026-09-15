/**
 * In-memory sliding-window security rate limiter for authentication endpoints.
 * Protects against automated brute-force attacks and credential stuffing.
 */

interface RateLimitRecord {
  attempts: number[]
  lockedUntil: number | null
}

const rateLimitStore = new Map<string, RateLimitRecord>()

const WINDOW_MS = 15 * 60 * 1000 // 15 minutes
const MAX_ATTEMPTS = 5 // Max 5 failed attempts per window
const LOCKOUT_MS = 15 * 60 * 1000 // 15-minute lockout

export function checkRateLimit(identifier: string): { allowed: boolean; retryAfterSeconds?: number } {
  const now = Date.now()
  const record = rateLimitStore.get(identifier)

  if (!record) {
    return { allowed: true }
  }

  // Check if actively locked out
  if (record.lockedUntil && record.lockedUntil > now) {
    const retryAfterSeconds = Math.ceil((record.lockedUntil - now) / 1000)
    return { allowed: false, retryAfterSeconds }
  }

  // Clean up stale attempts outside the window
  record.attempts = record.attempts.filter(timestamp => now - timestamp < WINDOW_MS)

  if (record.attempts.length >= MAX_ATTEMPTS) {
    record.lockedUntil = now + LOCKOUT_MS
    const retryAfterSeconds = Math.ceil(LOCKOUT_MS / 1000)
    return { allowed: false, retryAfterSeconds }
  }

  return { allowed: true }
}

export function recordFailedAttempt(identifier: string): { remainingAttempts: number; isLocked: boolean } {
  const now = Date.now()
  let record = rateLimitStore.get(identifier)

  if (!record) {
    record = { attempts: [], lockedUntil: null }
    rateLimitStore.set(identifier, record)
  }

  record.attempts = record.attempts.filter(timestamp => now - timestamp < WINDOW_MS)
  record.attempts.push(now)

  if (record.attempts.length >= MAX_ATTEMPTS) {
    record.lockedUntil = now + LOCKOUT_MS
    return { remainingAttempts: 0, isLocked: true }
  }

  return {
    remainingAttempts: MAX_ATTEMPTS - record.attempts.length,
    isLocked: false,
  }
}

export function resetAttempts(identifier: string): void {
  rateLimitStore.delete(identifier)
}
