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
