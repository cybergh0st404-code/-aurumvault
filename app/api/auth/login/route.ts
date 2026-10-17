import { NextResponse } from 'next/server'
import { findUserByEmail, createSession } from '@/lib/db/user-repository'
import { verifyPassword } from '@/lib/db/password'
import { UserProfile } from '@/lib/types'
import { checkRateLimit, recordFailedAttempt, resetAttempts, getClientIp } from '@/lib/security/rate-limiter'

// Static dummy salt and hash for constant-time mitigation against user enumeration
const DUMMY_SALT = '00000000000000000000000000000000'
const DUMMY_HASH = '00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password } = body

    // Derive rate limiting identifier safely from validated client IP and normalized email
    const clientIp = getClientIp(request)
    const normalizedEmail = (email || '').trim().toLowerCase()
    const rateKey = `${clientIp}:${normalizedEmail || 'empty'}`

    // 1. Sliding window rate limit check (persisted in SQLite / Turso)
    const rateLimit = await checkRateLimit(rateKey)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `High-frequency authentication lockout. Terminal paused for ${rateLimit.retryAfterSeconds}s under Swiss Cyber Protocol.`,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateLimit.retryAfterSeconds),
          },
        }
      )
    }

    if (!email || !password) {
      await recordFailedAttempt(rateKey)
      return NextResponse.json(
        { success: false, error: 'Email and cryptographic passkey are required.' },
        { status: 400 }
      )
    }

    const user = await findUserByEmail(normalizedEmail)

    // 2. Timing attack mitigation: if user not found, perform dummy scrypt computation
    if (!user) {
      verifyPassword(password, DUMMY_HASH, DUMMY_SALT)
      const attempt = await recordFailedAttempt(rateKey)
      const remainingMsg = attempt.isLocked
        ? ' Terminal locked for 15 minutes.'
        : ` (${attempt.remainingAttempts} attempts remaining).`

      return NextResponse.json(
        { success: false, error: `Invalid cryptographic key or identity.${remainingMsg}` },
        { status: 401 }
      )
    }

    // 3. Cryptographic constant-time password verification
    const isMatch = verifyPassword(password, user.password_hash, user.password_salt)
    if (!isMatch) {
      const attempt = await recordFailedAttempt(rateKey)
      const remainingMsg = attempt.isLocked
        ? ' Terminal locked for 15 minutes.'
        : ` (${attempt.remainingAttempts} attempts remaining).`

      return NextResponse.json(
        { success: false, error: `Invalid cryptographic key or identity.${remainingMsg}` },
        { status: 401 }
      )
    }

    // 3.5 Check if user account is administratively suspended
    if (user.is_suspended) {
      return NextResponse.json(
        {
          success: false,
          error: 'Identity Suspended: Access has been administratively revoked by Federal Operations Command (Geneva HQ). Contact Chief Marshal.',
        },
        { status: 403 }
      )
    }

    // Success: clear rate limiter for this identity
    await resetAttempts(rateKey)

    // 4. Create session in SQLite / Turso
    const { token, expiresAt } = await createSession(user.id)

    const profile: UserProfile = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      organization: user.organization,
      clientCode: user.client_code || undefined,
      avatarInitials: user.avatar_initials,
      securityClearance: user.security_clearance,
      isSuspended: Boolean(user.is_suspended),
      isDashboardLocked: Boolean(user.is_dashboard_locked),
      isCertificateLocked: Boolean(user.is_certificate_locked),
    }

    const response = NextResponse.json({
      success: true,
      user: profile,
    })

    // 5. Set secure HTTP-only session cookie
    response.cookies.set({
      name: 'aurumvault_session',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 24 * 60 * 60,
      expires: new Date(expiresAt),
    })

    return response
  } catch (error: any) {
    console.error('Login security error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal security authentication failure.' },
      { status: 500 }
    )
  }
}
