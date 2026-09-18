import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import {
  getUserBySessionToken,
  listAllUsers,
  createUser,
  deleteUser,
  updateUserRestrictions,
  terminateUserSessions,
} from '@/lib/db/user-repository'

async function getAdminUser() {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get('aurumvault_session')?.value
  if (!sessionToken) return null

  const user = await getUserBySessionToken(sessionToken)
  if (!user || user.role !== 'admin') return null

  return user
}

export async function GET() {
  const admin = await getAdminUser()
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized. Admin credentials required.' }, { status: 403 })
  }

  const users = await listAllUsers()
  return NextResponse.json({ users })
}

export async function POST(request: Request) {
  const admin = await getAdminUser()
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized. Admin credentials required.' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { email, password, name, role, clientCode, organization, securityClearance } = body

    if (!email || !password || !name || !role) {
      return NextResponse.json({ error: 'Name, email, password, and role are required.' }, { status: 400 })
    }

    const created = await createUser({
      email,
      password,
      name,
      role,
      clientCode,
      organization: organization || 'Swiss Private Depository Client',
      securityClearance,
      consignment: body.consignment || (role === 'client' ? {
        shipperName: body.shipperName || name,
        origin: body.origin || 'Indiana',
        shipperAddress: body.shipperAddress || 'State: Hanover. Pk. Illinois 1365. Fremont Dr. Zip code :60133.',
        shipperPhone: body.shipperPhone || '+1 (470) 305-9614',
        receiverName: body.receiverName || 'Chris Bucksath',
        receiverContact: body.receiverContact || '+1 (859) 907-3706',
        receiverAddress: body.receiverAddress || '321 Pimlico Ct Crittenden Ky 41030',
        shippingWeight: body.shippingWeight || '93.9 g',
        eta: body.eta || '17/09/26',
        destination: body.destination || 'Kentucky',
      } : undefined),
    })

    return NextResponse.json({ success: true, user: created })
  } catch (error: any) {
    console.error('Create user error:', error)
    if (error.message && error.message.includes('UNIQUE constraint failed')) {
      return NextResponse.json({ error: 'A user with this email address already exists.' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Failed to create user.' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  const admin = await getAdminUser()
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized. Admin credentials required.' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const targetId = body.id || body.userId
    const action = body.action
    const targetValue = body.value !== undefined 
      ? Boolean(body.value) 
      : Boolean(body.isDashboardLocked ?? body.isCertificateLocked ?? body.isSuspended)

    if (!targetId || !action) {
      return NextResponse.json({ error: 'User ID and action are required.' }, { status: 400 })
    }

    if (action === 'update_profile' || action === 'update_user' || action === 'edit_details') {
      const { updateUserProfile } = await import('@/lib/db/user-repository')
      const updated = await updateUserProfile(targetId, {
        name: body.name,
        email: body.email,
        password: body.password,
        organization: body.organization,
        securityClearance: body.securityClearance,
        clientCode: body.clientCode,
      })

      // If consignment update payload is present, update user's shipment
      if (body.consignment || body.shipperName || body.shipmentId || body.receiverName) {
        const { updateShipmentDetails, getShipmentsByClientCode, createDedicatedShipmentForClient } = await import('@/lib/db/shipment-repository')
        const clientCode = body.clientCode || updated?.client_code
        if (clientCode) {
          const userShipments = await getShipmentsByClientCode(clientCode)
          const targetShipmentId = body.shipmentId || userShipments[0]?.id

          const cData = body.consignment || body
          if (targetShipmentId) {
            await updateShipmentDetails(targetShipmentId, {
              shipperName: cData.shipperName,
              originCity: cData.originCity || cData.origin,
              shipperAddress: cData.shipperAddress,
              shipperPhone: cData.shipperPhone,
              receiverName: cData.receiverName,
              receiverContact: cData.receiverContact,
              receiverAddress: cData.receiverAddress,
              destinationCity: cData.destinationCity || cData.destination,
              shippingWeight: cData.shippingWeight,
              eta: cData.eta,
              status: cData.status,
              statusType: cData.statusType,
              progress: cData.progress,
              isPaused: cData.isPaused,
              speedMultiplier: cData.speedMultiplier,
              carrierFlightNumber: cData.carrierFlightNumber,
              custodyOfficer: cData.custodyOfficer,
              declaredValue: cData.declaredValue,
              cargoDescription: cData.cargoDescription,
            })
          } else {
            await createDedicatedShipmentForClient({
              clientCode,
              name: updated?.name || body.name || 'Specie Client',
              shipperName: cData.shipperName,
              origin: cData.originCity || cData.origin,
              shipperAddress: cData.shipperAddress,
              shipperPhone: cData.shipperPhone,
              receiverName: cData.receiverName,
              receiverContact: cData.receiverContact,
              receiverAddress: cData.receiverAddress,
              shippingWeight: cData.shippingWeight,
              eta: cData.eta,
              destination: cData.destinationCity || cData.destination,
            })
          }
        }
      }

      return NextResponse.json({ success: true, user: updated })
    }

    if (targetId === admin.id) {
      return NextResponse.json({ error: 'Cannot modify security restrictions on the active Chief Marshal account.' }, { status: 400 })
    }

    if (action === 'logout_user') {
      const terminatedCount = await terminateUserSessions(targetId)
      return NextResponse.json({
        success: true,
        message: `Terminated ${terminatedCount} active session(s) for user.`,
      })
    }

    if (action === 'toggle_dashboard_lock') {
      const updated = await updateUserRestrictions(targetId, { isDashboardLocked: targetValue })
      return NextResponse.json({ success: true, user: updated })
    }

    if (action === 'toggle_certificate_lock') {
      const updated = await updateUserRestrictions(targetId, { isCertificateLocked: targetValue })
      return NextResponse.json({ success: true, user: updated })
    }

    if (action === 'toggle_suspend') {
      const updated = await updateUserRestrictions(targetId, { isSuspended: targetValue })
      return NextResponse.json({ success: true, user: updated })
    }

    if (action === 'set_notice' || action === 'toggle_notice' || action === 'update_notice') {
      const noticeActive = body.noticeActive !== undefined
        ? Boolean(body.noticeActive)
        : (body.value !== undefined ? Boolean(body.value) : undefined)
      const noticeTitle = body.noticeTitle !== undefined ? body.noticeTitle : undefined
      const noticeMessage = body.noticeMessage !== undefined ? body.noticeMessage : undefined

      const updated = await updateUserRestrictions(targetId, {
        noticeActive,
        noticeTitle,
        noticeMessage,
      })
      return NextResponse.json({ success: true, user: updated })
    }

    return NextResponse.json({ error: `Unrecognized action: ${action}` }, { status: 400 })
  } catch (error) {
    console.error('User restriction error:', error)
    return NextResponse.json({ error: 'Failed to update user security status.' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const admin = await getAdminUser()
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized. Admin credentials required.' }, { status: 403 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'User ID is required.' }, { status: 400 })
    }

    if (id === admin.id) {
      return NextResponse.json({ error: 'Cannot delete the active Chief Marshal account.' }, { status: 400 })
    }

    const success = await deleteUser(id)
    return NextResponse.json({ success })
  } catch (error) {
    console.error('Delete user error:', error)
    return NextResponse.json({ error: 'Failed to delete user.' }, { status: 500 })
  }
}
