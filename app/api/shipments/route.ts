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

    if (id) {
      const shipment = await getShipmentById(id)
      return NextResponse.json({ success: true, shipment }, { headers: NO_CACHE_HEADERS })
    }

    const user = await getSessionUser()

    // If client user is logged in, filter strictly to their clientCode consignments
    if (user && user.role === 'client' && user.clientCode) {
      const shipments = await getShipmentsByClientCode(user.clientCode)
      return NextResponse.json({ success: true, shipments }, { headers: NO_CACHE_HEADERS })
    }

    // If specific clientCode requested by admin or authorized query
    if (clientCodeParam) {
      const shipments = await getShipmentsByClientCode(clientCodeParam)
      return NextResponse.json({ success: true, shipments }, { headers: NO_CACHE_HEADERS })
    }

    // Otherwise return all sovereign fleet shipments
    const shipments = await listAllShipments()
    return NextResponse.json({ success: true, shipments }, { headers: NO_CACHE_HEADERS })
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
    })

    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'Shipment not found' },
        { status: 404, headers: NO_CACHE_HEADERS }
      )
    }

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
    return NextResponse.json({ success }, { headers: NO_CACHE_HEADERS })
  } catch (error) {
    console.error('Failed to delete consignment:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete consignment' },
      { status: 500, headers: NO_CACHE_HEADERS }
    )
  }
}
