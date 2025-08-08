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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuth(request)
    const isAdmin = Boolean((auth as any)?.isAdmin) || (auth?.email ? ['sarah@company.com', 'm_declercq@digitalfoundry.com'].includes(auth.email) : false)
    
    if (!auth?.email || !isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const { name, email, role } = body

    // Prevent admin from removing their own admin privileges
    const isCurrentUser = auth.id === id
    if (isCurrentUser && role === 'user') {
      return NextResponse.json(
        { error: 'You cannot remove admin privileges from yourself' },
        { status: 400 }
      )
    }

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

    // Check if it's a predefined user - allow editing but with a warning
    const predefinedUser = mockUsers.find(u => u.id === id)
    if (predefinedUser) {
      // Allow editing predefined users but log it
      console.log(`Admin ${auth.email} is editing predefined user ${predefinedUser.email}`)
    }

    // Find and update the user (check both new and predefined users)
    let userIndex = g.__mockUsers.findIndex((u: any) => u.id === id)
    let isPredefined = false
    
    if (userIndex === -1) {
      // Check if it's a predefined user
      const predefinedIndex = mockUsers.findIndex(u => u.id === id)
      if (predefinedIndex === -1) {
        return NextResponse.json(
          { error: 'Mock user not found' },
          { status: 404 }
        )
      }
      // For predefined users, we'll update them in the global storage
      isPredefined = true
      // Create a copy in the global storage if it doesn't exist
      const existingInGlobal = g.__mockUsers.find((u: any) => u.id === id)
      if (!existingInGlobal) {
        const predefinedUser = mockUsers[predefinedIndex]
        g.__mockUsers.push({
          id: predefinedUser.id,
          name: predefinedUser.name,
          email: predefinedUser.email,
          role: predefinedUser.role === 'admin' ? 'admin' : 'user'
        })
      }
      userIndex = g.__mockUsers.findIndex((u: any) => u.id === id)
    }

    // Check if email already exists (excluding current user)
    const existingNewUser = g.__mockUsers.find((u: any) => u.email === email && u.id !== id)
    const existingPredefinedUser = mockUsers.find(u => u.email === email && u.id !== id)
    
    if (existingNewUser || existingPredefinedUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      )
    }

    // Update the user
    g.__mockUsers[userIndex] = {
      ...g.__mockUsers[userIndex],
      name: name.trim(),
      email: email.trim(),
      role: role as 'user' | 'admin'
    }

    return NextResponse.json(g.__mockUsers[userIndex])
  } catch (error) {
    console.error('Error updating mock user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuth(request)
    const isAdmin = Boolean((auth as any)?.isAdmin) || (auth?.email ? ['sarah@company.com', 'm_declercq@digitalfoundry.com'].includes(auth.email) : false)
    
    if (!auth?.email || !isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      )
    }

    const { id } = await params

    // Prevent admin from deleting themselves
    const isCurrentUser = auth.id === id
    if (isCurrentUser) {
      return NextResponse.json(
        { error: 'You cannot delete yourself' },
        { status: 400 }
      )
    }

    // Get existing mock users
    const g = globalThis as any
    if (!Array.isArray(g.__mockUsers)) {
      g.__mockUsers = []
    }

    // Check if it's a predefined user - allow deletion but with a warning
    const predefinedUser = mockUsers.find(u => u.id === id)
    if (predefinedUser) {
      // Allow deleting predefined users but log it
      console.log(`Admin ${auth.email} is deleting predefined user ${predefinedUser.email}`)
    }

    // Find and remove the user (check both new and predefined users)
    let userIndex = g.__mockUsers.findIndex((u: any) => u.id === id)
    
    if (userIndex === -1) {
      // Check if it's a predefined user that hasn't been copied to global storage yet
      const predefinedUser = mockUsers.find(u => u.id === id)
      if (!predefinedUser) {
        return NextResponse.json(
          { error: 'Mock user not found' },
          { status: 404 }
        )
      }
      // For predefined users, we'll remove them from global storage if they exist there
      // If they don't exist in global storage, we'll create a placeholder and then remove it
      g.__mockUsers.push({
        id: predefinedUser.id,
        name: predefinedUser.name,
        email: predefinedUser.email,
        role: predefinedUser.role === 'admin' ? 'admin' : 'user'
      })
      userIndex = g.__mockUsers.findIndex((u: any) => u.id === id)
    }

    g.__mockUsers.splice(userIndex, 1)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting mock user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
