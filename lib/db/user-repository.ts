import { getDb, ensureDbInitialized } from './database'
import { hashPassword } from './password'
import crypto from 'node:crypto'
import { UserProfile, UserRole } from '../types'

export interface DbUserRecord {
  id: string
  email: string
  password_hash: string
  password_salt: string
  name: string
  role: UserRole
  client_code: string | null
  organization: string
  avatar_initials: string
  security_clearance: string
  is_suspended?: number
  is_dashboard_locked?: number
  is_certificate_locked?: number
  notice_active?: number
  notice_title?: string | null
  notice_message?: string | null
  created_at: string
  updated_at: string
}

export type SafeUserRecord = Omit<DbUserRecord, 'password_hash' | 'password_salt'>

export async function findUserByEmail(email: string): Promise<DbUserRecord | null> {
  await ensureDbInitialized()
  const db = getDb()
  const trimmed = email.trim().toLowerCase()
  const res = await db.execute({
    sql: 'SELECT * FROM users WHERE LOWER(email) = ?',
    args: [trimmed],
  })
  const user = res.rows[0] as unknown as DbUserRecord | undefined
  return user || null
}

export async function findUserById(id: string): Promise<DbUserRecord | null> {
  await ensureDbInitialized()
  const db = getDb()
  const res = await db.execute({
    sql: 'SELECT * FROM users WHERE id = ?',
    args: [id],
  })
  const user = res.rows[0] as unknown as DbUserRecord | undefined
  return user || null
}

export async function listAllUsers(): Promise<SafeUserRecord[]> {
  await ensureDbInitialized()
  const db = getDb()
  const res = await db.execute(`
    SELECT id, email, name, role, client_code, organization, avatar_initials, security_clearance,
           COALESCE(is_suspended, 0) as is_suspended,
           COALESCE(is_dashboard_locked, 0) as is_dashboard_locked,
           COALESCE(is_certificate_locked, 0) as is_certificate_locked,
           COALESCE(notice_active, 0) as notice_active,
           notice_title, notice_message,
           created_at, updated_at
    FROM users
    ORDER BY role ASC, created_at DESC
  `)
  return res.rows as unknown as SafeUserRecord[]
}

export async function createUser(data: {
  email: string
  password: string
  name: string
  role: UserRole
  clientCode?: string
  organization: string
  securityClearance?: string
  consignment?: {
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
  }
}): Promise<SafeUserRecord> {
  await ensureDbInitialized()
  const db = getDb()
  const { hash, salt } = hashPassword(data.password)

  const id = data.role === 'admin'
    ? `USR-ADM-${Math.floor(100 + Math.random() * 900)}`
    : `USR-CLI-${Math.floor(100 + Math.random() * 900)}`

  const initials = data.name
    .split(' ')
    .map(p => p[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'AV'

  const clearance = data.securityClearance || (
    data.role === 'admin'
      ? 'LEVEL-V SWISS AIRSPACE COMMAND'
      : `ALLOCATED DEPOSITOR #${Math.floor(1000 + Math.random() * 9000)}`
  )

  const clientCode = data.role === 'client'
    ? data.clientCode || `CLIENT-${data.name.split(' ').pop()?.toUpperCase() || 'VAULT'}`
    : null

  await db.execute({
    sql: `
      INSERT INTO users (
        id, email, password_hash, password_salt, name, role, client_code, organization, avatar_initials, security_clearance
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    args: [
      id,
      data.email.trim().toLowerCase(),
      hash,
      salt,
      data.name.trim(),
      data.role,
      clientCode,
      data.organization.trim(),
      initials,
      clearance,
    ],
  })

  // When creating a client user, automatically create their dedicated consignment & radar
  if (data.role === 'client' && clientCode) {
    try {
      const { createDedicatedShipmentForClient } = await import('./shipment-repository')
      const { parseDeclaredValue, formatDeclaredValue } = await import('@/lib/weight-utils')
      const rawVal = (data as any).declaredValueUSD !== undefined ? (data as any).declaredValueUSD : data.consignment?.declaredValue
      const declaredUSD = parseDeclaredValue(rawVal)
      const declaredStr = data.consignment?.declaredValue !== undefined
        ? formatDeclaredValue(data.consignment.declaredValue)
        : formatDeclaredValue(declaredUSD)

      await createDedicatedShipmentForClient({
        clientCode,
        name: data.name.trim(),
        shipperName: data.consignment?.shipperName,
        origin: data.consignment?.origin,
        shipperAddress: data.consignment?.shipperAddress,
        shipperPhone: data.consignment?.shipperPhone,
        receiverName: data.consignment?.receiverName,
        receiverContact: data.consignment?.receiverContact,
        receiverAddress: data.consignment?.receiverAddress,
        shippingWeight: data.consignment?.shippingWeight,
        eta: data.consignment?.eta,
        destination: data.consignment?.destination,
        declaredValue: declaredStr,
        status: (data.consignment as any)?.status,
        statusType: (data.consignment as any)?.statusType,
      })
    } catch (err) {
      console.error('Failed to auto-create client shipment in SQLite:', err)
    }

    // Also auto-provision client's dedicated vaulted bullion lot(s) in SQLite
    try {
      const { parseDeclaredValue } = await import('@/lib/weight-utils')
      const rawVal = (data as any).declaredValueUSD !== undefined ? (data as any).declaredValueUSD : data.consignment?.declaredValue
      const declaredUSD = parseDeclaredValue(rawVal)

      const { syncClientVaultHoldings } = await import('./vault-repository')
      await syncClientVaultHoldings({
        clientCode,
        clientName: data.name.trim(),
        lotCount: (data as any).vaultedLots ? Number((data as any).vaultedLots) : 1,
        goldWeight: data.consignment?.shippingWeight || '93.9 g',
        vaultFacility: (data as any).vaultFacility || 'Geneva Freeport Deep Depository Tier-IV',
        declaredValueUSD: declaredUSD,
      })
    } catch (err) {
      console.error('Failed to auto-create client vault holding in SQLite:', err)
    }
  }

  return {
    id,
    email: data.email.trim().toLowerCase(),
    name: data.name.trim(),
    role: data.role,
    client_code: clientCode,
    organization: data.organization.trim(),
    avatar_initials: initials,
    security_clearance: clearance,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
}

export async function deleteUser(id: string): Promise<boolean> {
  await ensureDbInitialized()
  const db = getDb()
  const res = await db.execute({
    sql: 'DELETE FROM users WHERE id = ?',
    args: [id],
  })
  return res.rowsAffected > 0
}

export async function createSession(userId: string): Promise<{ token: string; expiresAt: number }> {
  await ensureDbInitialized()
  const db = getDb()
  const token = crypto.randomBytes(32).toString('hex')
  // 7 days expiration
  const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000

  await db.execute({
    sql: `
      INSERT INTO sessions (token, user_id, expires_at)
      VALUES (?, ?, ?)
    `,
    args: [token, userId, expiresAt],
  })

  return { token, expiresAt }
}

export async function getUserBySessionToken(token: string): Promise<UserProfile | null> {
  await ensureDbInitialized()
  const db = getDb()
  const res = await db.execute({
    sql: `
      SELECT u.id, u.email, u.name, u.role, u.client_code, u.organization, u.avatar_initials, u.security_clearance,
             COALESCE(u.is_suspended, 0) as is_suspended,
             COALESCE(u.is_dashboard_locked, 0) as is_dashboard_locked,
             COALESCE(u.is_certificate_locked, 0) as is_certificate_locked,
             COALESCE(u.notice_active, 0) as notice_active,
             u.notice_title, u.notice_message,
             s.expires_at
      FROM sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.token = ?
    `,
    args: [token],
  })

  const row = res.rows[0] as unknown as (SafeUserRecord & { expires_at: number }) | undefined

  if (!row) {
    return null
  }

  // If expired, remove session
  if (Number(row.expires_at) < Date.now()) {
    await deleteSession(token)
    return null
  }

  // If user is suspended, terminate active session immediately
  if (Boolean(row.is_suspended)) {
    await deleteSession(token)
    return null
  }

  return {
    id: String(row.id),
    name: String(row.name),
    email: String(row.email),
    role: row.role as UserRole,
    organization: String(row.organization),
    clientCode: row.client_code ? String(row.client_code) : undefined,
    avatarInitials: String(row.avatar_initials),
    securityClearance: String(row.security_clearance),
    isSuspended: Boolean(row.is_suspended),
    isDashboardLocked: Boolean(row.is_dashboard_locked),
    isCertificateLocked: Boolean(row.is_certificate_locked),
    noticeActive: Boolean(row.notice_active),
    noticeTitle: row.notice_title ? String(row.notice_title) : null,
    noticeMessage: row.notice_message ? String(row.notice_message) : null,
  }
}

export async function deleteSession(token: string): Promise<void> {
  await ensureDbInitialized()
  const db = getDb()
  await db.execute({
    sql: 'DELETE FROM sessions WHERE token = ?',
    args: [token],
  })
}

export async function terminateUserSessions(userId: string): Promise<number> {
  await ensureDbInitialized()
  const db = getDb()
  const res = await db.execute({
    sql: 'DELETE FROM sessions WHERE user_id = ?',
    args: [userId],
  })
  return res.rowsAffected
}

export async function updateUserRestrictions(
  userId: string,
  updates: {
    isSuspended?: boolean
    isDashboardLocked?: boolean
    isCertificateLocked?: boolean
    noticeActive?: boolean
    noticeTitle?: string | null
    noticeMessage?: string | null
  }
): Promise<SafeUserRecord | null> {
  await ensureDbInitialized()
  const db = getDb()

  const user = await findUserById(userId)
  if (!user) return null

  const is_suspended = updates.isSuspended !== undefined
    ? (updates.isSuspended ? 1 : 0)
    : (user.is_suspended ?? 0)

  const is_dashboard_locked = updates.isDashboardLocked !== undefined
    ? (updates.isDashboardLocked ? 1 : 0)
    : (user.is_dashboard_locked ?? 0)

  const is_certificate_locked = updates.isCertificateLocked !== undefined
    ? (updates.isCertificateLocked ? 1 : 0)
    : (user.is_certificate_locked ?? 0)

  const notice_active = updates.noticeActive !== undefined
    ? (updates.noticeActive ? 1 : 0)
    : (user.notice_active ?? 0)

  const notice_title = updates.noticeTitle !== undefined
    ? updates.noticeTitle
    : (user.notice_title ?? null)

  const notice_message = updates.noticeMessage !== undefined
    ? updates.noticeMessage
    : (user.notice_message ?? null)

  await db.execute({
    sql: `UPDATE users
          SET is_suspended = ?, is_dashboard_locked = ?, is_certificate_locked = ?,
              notice_active = ?, notice_title = ?, notice_message = ?,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ?`,
    args: [is_suspended, is_dashboard_locked, is_certificate_locked, notice_active, notice_title, notice_message, userId],
  })

  // If user was suspended, terminate all their active sessions immediately
  if (is_suspended === 1) {
    await terminateUserSessions(userId)
  }

  const updated = await findUserById(userId)
  if (!updated) return null
  const { password_hash, password_salt, ...safe } = updated
  return safe
}

export async function updateUserProfile(
  userId: string,
  data: {
    name?: string
    email?: string
    password?: string
    role?: UserRole
    clientCode?: string
    organization?: string
    securityClearance?: string
  }
): Promise<SafeUserRecord | null> {
  await ensureDbInitialized()
  const db = getDb()

  const user = await findUserById(userId)
  if (!user) return null

  const name = data.name !== undefined ? data.name.trim() : user.name
  const email = data.email !== undefined ? data.email.trim().toLowerCase() : user.email
  const organization = data.organization !== undefined ? data.organization.trim() : user.organization
  const security_clearance = data.securityClearance !== undefined ? data.securityClearance.trim() : user.security_clearance
  const client_code = data.clientCode !== undefined ? (data.clientCode ? data.clientCode.trim() : null) : user.client_code

  const initials = name
    .split(' ')
    .map(p => p[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || user.avatar_initials || 'AV'

  if (data.password && data.password.trim().length > 0) {
    const { hash, salt } = hashPassword(data.password.trim())
    await db.execute({
      sql: `UPDATE users
            SET name = ?, email = ?, password_hash = ?, password_salt = ?,
                organization = ?, security_clearance = ?, client_code = ?,
                avatar_initials = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?`,
      args: [name, email, hash, salt, organization, security_clearance, client_code, initials, userId],
    })
  } else {
    await db.execute({
      sql: `UPDATE users
            SET name = ?, email = ?,
                organization = ?, security_clearance = ?, client_code = ?,
                avatar_initials = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?`,
      args: [name, email, organization, security_clearance, client_code, initials, userId],
    })
  }

  const updated = await findUserById(userId)
  if (!updated) return null
  const { password_hash, password_salt, ...safe } = updated
  return safe
}

