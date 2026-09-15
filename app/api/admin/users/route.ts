import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getUserBySessionToken, listAllUsers, createUser, deleteUser } from '@/lib/db/user-repository'

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
