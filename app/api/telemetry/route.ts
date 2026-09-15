import { NextResponse } from 'next/server'
import { getAllTelemetry, upsertShipmentTelemetry } from '@/lib/db/telemetry-repository'

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  Pragma: 'no-cache',
  Expires: '0',
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    const telemetryMap = await getAllTelemetry()

    if (id) {
      const single = telemetryMap[id] || null
      return NextResponse.json(
        { success: true, telemetry: single },
        { headers: NO_CACHE_HEADERS }
      )
    }

    return NextResponse.json(
      { success: true, telemetry: telemetryMap },
      { headers: NO_CACHE_HEADERS }
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
    const body = await request.json()
    const { shipmentId, progress, isPaused, speedMultiplier, status } = body

    if (!shipmentId) {
      return NextResponse.json(
        { success: false, error: 'shipmentId is required' },
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
