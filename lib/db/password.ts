import crypto from 'node:crypto'

/**
 * Hashes a plain-text password using scrypt with a unique cryptographically secure salt.
 */
export function hashPassword(password: string): { hash: string; salt: string } {
  const salt = crypto.randomBytes(16).toString('hex')
  const derivedKey = crypto.scryptSync(password, salt, 64)
  return {
    hash: derivedKey.toString('hex'),
    salt,
  }
}

/**
 * Verifies a candidate password against stored scrypt hash and salt in constant time.
 */
export function verifyPassword(password: string, storedHash: string, salt: string): boolean {
  try {
    const derivedKey = crypto.scryptSync(password, salt, 64)
    const keyBuffer = Buffer.from(derivedKey.toString('hex'), 'hex')
    const hashBuffer = Buffer.from(storedHash, 'hex')

    if (keyBuffer.length !== hashBuffer.length) {
      return false
    }

    return crypto.timingSafeEqual(keyBuffer, hashBuffer)
  } catch {
    return false
  }
}

/**
 * Validates cryptographic passkey strength for institutional security compliance.
 * Requires at least 10 characters, including uppercase, lowercase, numbers, and symbols.
 */
export function validatePasswordStrength(password: string): { valid: boolean; error?: string } {
  if (!password || typeof password !== 'string') {
    return { valid: false, error: 'Cryptographic passkey is required.' }
  }
  if (password.length < 10) {
    return { valid: false, error: 'Passkey must be at least 10 characters in length.' }
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: 'Passkey must contain at least one uppercase letter (A-Z).' }
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, error: 'Passkey must contain at least one lowercase letter (a-z).' }
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, error: 'Passkey must contain at least one numeric digit (0-9).' }
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    return { valid: false, error: 'Passkey must contain at least one special symbol (!@#$%^&* etc).' }
  }
  return { valid: true }
}

