import { NextResponse } from 'next/server'
import { verifyPublicShipment } from '@/lib/db/shipment-repository'
import { checkRateLimit, getClientIp } from '@/lib/security/rate-limiter'

export async function GET(request: Request) {
  const clientIp = getClientIp(request)
  const rateLimit = await checkRateLimit(`verify:${clientIp}`)
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { success: false, error: 'Too many verification attempts. Please retry in a few minutes.' },
      { status: 429 }
    )
  }

  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q') || searchParams.get('id') || searchParams.get('ref')
  if (!query) {
    return NextResponse.json(
      { success: false, error: 'Reference or tracking number is required.' },
      { status: 400 }
    )
  }

  const verification = await verifyPublicShipment(query)
  if (!verification) {
    return NextResponse.json(
      { success: false, error: 'No active or archived consignment found matching that reference identifier.' },
      { status: 404 }
    )
  }

  return NextResponse.json({ success: true, verification })
}
