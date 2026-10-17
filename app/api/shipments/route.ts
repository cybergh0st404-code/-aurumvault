import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getUserBySessionToken } from '@/lib/db/user-repository'
import {
  listAllShipments,
  getShipmentById,
  getShipmentsByClientCode,
  updateShipmentDetails,
  createDedicatedShipmentForClient,
  deleteShipmentFromDb,
} from '@/lib/db/shipment-repository'
import { recordAuditLog } from '@/lib/db/audit-repository'

function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return request.headers.get('x-real-ip') || '127.0.0.1'
}

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
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const clientCodeParam = searchParams.get('clientCode')

    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Sovereign session authentication required to inspect fleet consignments.' },
        { status: 401, headers: NO_CACHE_HEADERS }
      )
    }

    // Client clearance: Strictly confined to their own clientCode consignments
    if (user.role === 'client') {
      if (!user.clientCode) {
        return NextResponse.json({ success: true, shipments: [] }, { headers: NO_CACHE_HEADERS })
      }

      if (id) {
        const shipment = await getShipmentById(id)
        if (!shipment || shipment.clientCode !== user.clientCode) {
          return NextResponse.json(
            { success: false, error: 'Consignment record not found or access restricted under client clearance.' },
            { status: 404, headers: NO_CACHE_HEADERS }
          )
        }
        return NextResponse.json({ success: true, shipment }, { headers: NO_CACHE_HEADERS })
      }

      // Ignore any query clientCodeParam; enforce authenticated user's own clientCode
      const shipments = await getShipmentsByClientCode(user.clientCode)
      return NextResponse.json({ success: true, shipments }, { headers: NO_CACHE_HEADERS })
    }

    // Admin clearance: Can view individual records, client batches, or full fleet
    if (user.role === 'admin') {
      if (id) {
        const shipment = await getShipmentById(id)
        return NextResponse.json({ success: true, shipment }, { headers: NO_CACHE_HEADERS })
      }

      if (clientCodeParam) {
        const shipments = await getShipmentsByClientCode(clientCodeParam)
        return NextResponse.json({ success: true, shipments }, { headers: NO_CACHE_HEADERS })
      }

      const shipments = await listAllShipments()
      return NextResponse.json({ success: true, shipments }, { headers: NO_CACHE_HEADERS })
    }

    return NextResponse.json(
      { success: false, error: 'Forbidden. Clearance level insufficient.' },
      { status: 403, headers: NO_CACHE_HEADERS }
    )
  } catch (error) {
    console.error('Failed to get shipments:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve consignments' },
      { status: 500, headers: NO_CACHE_HEADERS }
    )
  }
}

export async function POST(request: Request) {
  const user = await getSessionUser()
  if (!user || user.role !== 'admin') {
    return NextResponse.json(
      { success: false, error: 'Unauthorized. Admin credentials required.' },
      { status: 403, headers: NO_CACHE_HEADERS }
    )
  }

  try {
    const body = await request.json()
    const {
      clientCode,
      name,
      shipperName,
      origin,
      shipperAddress,
      shipperPhone,
      receiverName,
      receiverContact,
      receiverAddress,
      shippingWeight,
      eta,
      destination,
    } = body

    if (!clientCode || !name) {
      return NextResponse.json(
        { success: false, error: 'Client Code and Name are required.' },
        { status: 400, headers: NO_CACHE_HEADERS }
      )
    }

    const created = await createDedicatedShipmentForClient({
      clientCode,
      name,
      shipperName,
      origin,
      shipperAddress,
      shipperPhone,
      receiverName,
      receiverContact,
      receiverAddress,
      shippingWeight,
      eta,
      destination,
    })

    await recordAuditLog({
      adminId: user.id,
      adminEmail: user.email,
      action: 'create_consignment',
      targetId: created.id,
      ipAddress: getClientIp(request),
      details: {
        trackingNumber: created.trackingNumber,
        clientCode: created.clientCode,
        origin: created.origin?.city,
        destination: created.destination?.city,
        shippingWeight: created.shippingWeight,
      },
    })

    return NextResponse.json({ success: true, shipment: created }, { headers: NO_CACHE_HEADERS })
  } catch (error) {
    console.error('Failed to create consignment:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create consignment' },
      { status: 500, headers: NO_CACHE_HEADERS }
    )
  }
}

export async function PATCH(request: Request) {
  const user = await getSessionUser()
  if (!user || user.role !== 'admin') {
    return NextResponse.json(
      { success: false, error: 'Unauthorized. Admin credentials required.' },
      { status: 403, headers: NO_CACHE_HEADERS }
    )
  }

  try {
    const body = await request.json()
    const shipmentId = body.id || body.shipmentId

    if (!shipmentId) {
      return NextResponse.json(
        { success: false, error: 'Shipment ID is required' },
        { status: 400, headers: NO_CACHE_HEADERS }
      )
    }

    const updated = await updateShipmentDetails(shipmentId, {
      shipperName: body.shipperName,
      originCity: body.originCity || body.origin,
      shipperAddress: body.shipperAddress,
      shipperPhone: body.shipperPhone,
      receiverName: body.receiverName,
      receiverContact: body.receiverContact,
      receiverAddress: body.receiverAddress,
      destinationCity: body.destinationCity || body.destination,
      shippingWeight: body.shippingWeight,
      eta: body.eta,
      status: body.status,
      statusType: body.statusType,
      progress: body.progress !== undefined ? Number(body.progress) : undefined,
      isPaused: body.isPaused !== undefined ? Boolean(body.isPaused) : undefined,
      speedMultiplier: body.speedMultiplier !== undefined ? Number(body.speedMultiplier) : undefined,
      carrierFlightNumber: body.carrierFlightNumber,
      custodyOfficer: body.custodyOfficer,
      declaredValue: body.declaredValue,
      cargoDescription: body.cargoDescription,
      checkpoints: body.checkpoints,
      intermediateStop: body.intermediateStop,
    })

    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'Shipment not found' },
        { status: 404, headers: NO_CACHE_HEADERS }
      )
    }

    await recordAuditLog({
      adminId: user.id,
      adminEmail: user.email,
      action: 'update_consignment',
      targetId: shipmentId,
      ipAddress: getClientIp(request),
      details: {
        status: body.status,
        progress: body.progress,
        isPaused: body.isPaused,
        destinationCity: body.destinationCity || body.destination,
        eta: body.eta,
      },
    })

    return NextResponse.json({ success: true, shipment: updated }, { headers: NO_CACHE_HEADERS })
  } catch (error) {
    console.error('Failed to update consignment:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update consignment' },
      { status: 500, headers: NO_CACHE_HEADERS }
    )
  }
}

export async function DELETE(request: Request) {
  const user = await getSessionUser()
  if (!user || user.role !== 'admin') {
    return NextResponse.json(
      { success: false, error: 'Unauthorized. Admin credentials required.' },
      { status: 403, headers: NO_CACHE_HEADERS }
    )
  }

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Shipment ID is required' },
        { status: 400, headers: NO_CACHE_HEADERS }
      )
    }

    const success = await deleteShipmentFromDb(id)
    if (success) {
      await recordAuditLog({
        adminId: user.id,
        adminEmail: user.email,
        action: 'delete_consignment',
        targetId: id,
        ipAddress: getClientIp(request),
        details: { deletedShipmentId: id },
      })
    }
    return NextResponse.json({ success }, { headers: NO_CACHE_HEADERS })
  } catch (error) {
    console.error('Failed to delete consignment:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete consignment' },
      { status: 500, headers: NO_CACHE_HEADERS }
    )
  }
}
