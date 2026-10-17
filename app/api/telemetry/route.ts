import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getUserBySessionToken } from '@/lib/db/user-repository'
import { getAllTelemetry, upsertShipmentTelemetry } from '@/lib/db/telemetry-repository'

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  Pragma: 'no-cache',
  Expires: '0',
}

async function getSessionUser() {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get('aurumvault_session')?.value
  if (!sessionToken) return null
  return await getUserBySessionToken(sessionToken)
}

export async function GET(request: Request) {
  try {
    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Valid sovereign session required to query avionics telemetry.' },
        { status: 401, headers: NO_CACHE_HEADERS }
      )
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const telemetryMap = await getAllTelemetry()

    // Client clearance: Strictly confined to telemetry of consignments matching their clientCode
    if (user.role === 'client') {
      if (!user.clientCode) {
        return NextResponse.json({ success: true, telemetry: id ? null : {} }, { headers: NO_CACHE_HEADERS })
      }

      const { getShipmentsByClientCode } = await import('@/lib/db/shipment-repository')
      const userShipments = await getShipmentsByClientCode(user.clientCode)
      const allowedShipmentIds = new Set(userShipments.map(s => s.id))

      if (id) {
        if (!allowedShipmentIds.has(id)) {
          return NextResponse.json(
            { success: false, error: 'Telemetry vector not found or access restricted under client clearance.' },
            { status: 404, headers: NO_CACHE_HEADERS }
          )
        }
        return NextResponse.json({ success: true, telemetry: telemetryMap[id] || null }, { headers: NO_CACHE_HEADERS })
      }

      // Filter telemetry dictionary to only authorized shipments
      const filteredMap: Record<string, any> = {}
      for (const sid of allowedShipmentIds) {
        if (telemetryMap[sid]) {
          filteredMap[sid] = telemetryMap[sid]
        }
      }
      return NextResponse.json({ success: true, telemetry: filteredMap }, { headers: NO_CACHE_HEADERS })
    }

    // Admin clearance: Access full telemetry stream
    if (user.role === 'admin') {
      if (id) {
        return NextResponse.json(
          { success: true, telemetry: telemetryMap[id] || null },
          { headers: NO_CACHE_HEADERS }
        )
      }
      return NextResponse.json(
        { success: true, telemetry: telemetryMap },
        { headers: NO_CACHE_HEADERS }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Forbidden. Clearance level insufficient.' },
      { status: 403, headers: NO_CACHE_HEADERS }
    )
  } catch (error) {
    console.error('Failed to get telemetry:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve telemetry' },
      { status: 500, headers: NO_CACHE_HEADERS }
    )
  }
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser()
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden. Operations command clearance required to update avionics telemetry.' },
        { status: 403, headers: NO_CACHE_HEADERS }
      )
    }

    const body = await request.json()
    let { shipmentId, clientCode, progress, isPaused, speedMultiplier, status } = body

    if (!shipmentId && clientCode) {
      try {
        const { getShipmentsByClientCode } = await import('@/lib/db/shipment-repository')
        const userShipments = await getShipmentsByClientCode(clientCode)
        if (userShipments.length > 0) {
          shipmentId = userShipments[0].id
        }
      } catch (lookupErr) {
        console.warn('Failed to resolve shipment by clientCode in telemetry:', lookupErr)
      }
    }

    if (!shipmentId) {
      return NextResponse.json(
        { success: false, error: 'shipmentId or clientCode is required' },
        { status: 400, headers: NO_CACHE_HEADERS }
      )
    }

    const updated = await upsertShipmentTelemetry(shipmentId, {
      progress: progress !== undefined ? Number(progress) : undefined,
      isPaused: isPaused !== undefined ? Boolean(isPaused) : undefined,
      speedMultiplier: speedMultiplier !== undefined ? Number(speedMultiplier) : undefined,
      status: status || undefined,
    })

    return NextResponse.json(
      { success: true, telemetry: updated },
      { headers: NO_CACHE_HEADERS }
    )
  } catch (error) {
    console.error('Failed to update telemetry:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update telemetry' },
      { status: 500, headers: NO_CACHE_HEADERS }
    )
  }
}
