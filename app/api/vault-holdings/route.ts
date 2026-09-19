import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getUserBySessionToken } from '@/lib/db/user-repository'
import {
  listAllVaultHoldings,
  getVaultHoldingsByClientCode,
  getVaultHoldingById,
  syncClientVaultHoldings,
  insertOrUpdateVaultHolding,
  deleteVaultHolding,
} from '@/lib/db/vault-repository'

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
      const holding = await getVaultHoldingById(id)
      return NextResponse.json({ success: true, holding }, { headers: NO_CACHE_HEADERS })
    }

    const user = await getSessionUser()

    // If client user is logged in, filter strictly to their clientCode holdings
    if (user && user.role === 'client' && user.clientCode) {
      const holdings = await getVaultHoldingsByClientCode(user.clientCode)
      return NextResponse.json({ success: true, holdings }, { headers: NO_CACHE_HEADERS })
    }

    // If specific clientCode requested
    if (clientCodeParam) {
      const holdings = await getVaultHoldingsByClientCode(clientCodeParam)
      return NextResponse.json({ success: true, holdings }, { headers: NO_CACHE_HEADERS })
    }

    // Otherwise return all vault holdings (admin / general)
    const holdings = await listAllVaultHoldings()
    return NextResponse.json({ success: true, holdings }, { headers: NO_CACHE_HEADERS })
  } catch (error) {
    console.error('Failed to get vault holdings:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve vault holdings' },
      { status: 500, headers: NO_CACHE_HEADERS }
    )
  }
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser()
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Administrative clearance required' },
        { status: 403, headers: NO_CACHE_HEADERS }
      )
    }

    const body = await request.json()
    const { clientCode, clientName, lotCount, goldWeight, declaredValueUSD, vaultFacility } = body

    if (!clientCode) {
      return NextResponse.json(
        { success: false, error: 'Client Code is required' },
        { status: 400, headers: NO_CACHE_HEADERS }
      )
    }

    const holdings = await syncClientVaultHoldings({
      clientCode,
      clientName,
      lotCount: lotCount ? Number(lotCount) : 1,
      goldWeight: goldWeight || '93.9 g',
      declaredValueUSD: declaredValueUSD ? Number(declaredValueUSD) : 16355,
      vaultFacility,
    })

    return NextResponse.json({ success: true, holdings }, { headers: NO_CACHE_HEADERS })
  } catch (error) {
    console.error('Failed to create vault holdings:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create vault holdings' },
      { status: 500, headers: NO_CACHE_HEADERS }
    )
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getSessionUser()
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Administrative clearance required' },
        { status: 403, headers: NO_CACHE_HEADERS }
      )
    }

    const body = await request.json()
    const { clientCode, lotCount, goldWeight, declaredValueUSD, vaultFacility, holding } = body

    if (holding && holding.id) {
      await insertOrUpdateVaultHolding(holding)
      return NextResponse.json({ success: true, holding }, { headers: NO_CACHE_HEADERS })
    }

    if (!clientCode) {
      return NextResponse.json(
        { success: false, error: 'Client Code is required' },
        { status: 400, headers: NO_CACHE_HEADERS }
      )
    }

    const holdings = await syncClientVaultHoldings({
      clientCode,
      lotCount: lotCount !== undefined ? Number(lotCount) : undefined,
      goldWeight,
      declaredValueUSD: declaredValueUSD !== undefined ? Number(declaredValueUSD) : undefined,
      vaultFacility,
    })

    return NextResponse.json({ success: true, holdings }, { headers: NO_CACHE_HEADERS })
  } catch (error) {
    console.error('Failed to update vault holdings:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update vault holdings' },
      { status: 500, headers: NO_CACHE_HEADERS }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getSessionUser()
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Administrative clearance required' },
        { status: 403, headers: NO_CACHE_HEADERS }
      )
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Holding ID is required' },
        { status: 400, headers: NO_CACHE_HEADERS }
      )
    }

    const deleted = await deleteVaultHolding(id)
    return NextResponse.json({ success: deleted }, { headers: NO_CACHE_HEADERS })
  } catch (error) {
    console.error('Failed to delete vault holding:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete vault holding' },
      { status: 500, headers: NO_CACHE_HEADERS }
    )
  }
}
