import { getDb, ensureDbInitialized } from './database'
import crypto from 'node:crypto'

export interface AuditLogEntry {
  id: string
  adminId: string
  adminEmail: string
  action: string
  targetId?: string | null
  ipAddress?: string | null
  details?: string | null
  createdAt?: string
}

export async function recordAuditLog(params: {
  adminId: string
  adminEmail: string
  action: string
  targetId?: string | null
  ipAddress?: string | null
  details?: Record<string, any> | string | null
}): Promise<void> {
  try {
    await ensureDbInitialized()
    const db = getDb()
    const id = `AUD-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`
    const detailsStr = typeof params.details === 'object' && params.details !== null
      ? JSON.stringify(params.details)
      : (params.details || null)

    await db.execute({
      sql: `INSERT INTO audit_logs (id, admin_id, admin_email, action, target_id, ip_address, details, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
      args: [
        id,
        params.adminId,
        params.adminEmail,
        params.action,
        params.targetId || null,
        params.ipAddress || null,
        detailsStr,
      ],
    })
  } catch (err) {
    console.warn('[AuditLogger] Failed to write audit record:', err)
  }
}

export async function listAuditLogs(limit: number = 50): Promise<AuditLogEntry[]> {
  try {
    await ensureDbInitialized()
    const db = getDb()
    const res = await db.execute({
      sql: `SELECT id, admin_id, admin_email, action, target_id, ip_address, details, created_at
            FROM audit_logs
            ORDER BY created_at DESC
            LIMIT ?`,
      args: [limit],
    })

    return res.rows.map(row => ({
      id: String(row.id),
      adminId: String(row.admin_id),
      adminEmail: String(row.admin_email),
      action: String(row.action),
      targetId: row.target_id ? String(row.target_id) : null,
      ipAddress: row.ip_address ? String(row.ip_address) : null,
      details: row.details ? String(row.details) : null,
      createdAt: String(row.created_at),
    }))
  } catch (err) {
    console.warn('[AuditLogger] Failed to list audit logs:', err)
    return []
  }
}
