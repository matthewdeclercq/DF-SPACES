import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { mockUsers } from '@/lib/mock-auth'

// Attempt to get auth from real session; otherwise from mock header
async function getAuth(request: NextRequest) {
  const session = await getServerSession()
  if (session?.user?.email) {
    return {
      email: session.user.email,
      id: session.user.id,
      name: session.user.name || '',
      role: (session as any).user?.role || ((session as any).user?.isAdmin ? 'admin' : 'user'),
    }
  }

  const mockHeader = request.headers.get('x-mock-user')
  if (mockHeader) {
    try {
      const user = JSON.parse(mockHeader)
      if (user?.email) {
        return {
          email: user.email,
          id: user.id,
          name: user.name || '',
          role: user.role || 'user',
        }
      }
    } catch {
      // ignore header parse errors
    }
  }
  return null
}

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuth(request)
    const isAdmin = Boolean((auth as any)?.isAdmin) || (auth?.email ? ['sarah@company.com', 'm_declercq@digitalfoundry.com'].includes(auth.email) : false)
    
    if (!auth?.email || !isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      )
    }
    
    // Get mock users from global storage (combine existing and new ones)
    const g = globalThis as any
    const newMockUsers = g.__mockUsers || []
    
    // Convert existing mock users to the expected format and combine with new ones
    const existingUsers = mockUsers.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role === 'admin' ? 'admin' : 'user'
    }))
    
    // Combine existing and new users, avoiding duplicates by email
    const allUsers = [...existingUsers]
    newMockUsers.forEach((newUser: any) => {
      if (!allUsers.find(u => u.email === newUser.email)) {
        allUsers.push(newUser)
      }
    })
    
    return NextResponse.json(allUsers)
  } catch (error) {
    console.error('Error fetching mock users:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuth(request)
    const isAdmin = Boolean((auth as any)?.isAdmin) || (auth?.email ? ['sarah@company.com', 'm_declercq@digitalfoundry.com'].includes(auth.email) : false)
    
    if (!auth?.email || !isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { name, email, role } = body

    if (!name || !email || !role) {
      return NextResponse.json(
        { error: 'Missing required fields: name, email, role' },
        { status: 400 }
      )
    }

    if (!['user', 'admin'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be "user" or "admin"' },
        { status: 400 }
      )
    }

    // Get existing mock users
    const g = globalThis as any
    if (!Array.isArray(g.__mockUsers)) {
      g.__mockUsers = []
    }

    // Check if email already exists (in both new and existing mock users)
    const existingNewUser = g.__mockUsers.find((u: any) => u.email === email)
    const existingPredefinedUser = mockUsers.find(u => u.email === email)
    
    if (existingNewUser || existingPredefinedUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      )
    }

    // Create new mock user
    const newUser = {
      id: Math.random().toString(36).slice(2),
      name: name.trim(),
      email: email.trim(),
      role: role as 'user' | 'admin'
    }

    g.__mockUsers.push(newUser)
    return NextResponse.json(newUser, { status: 201 })
  } catch (error) {
    console.error('Error creating mock user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
