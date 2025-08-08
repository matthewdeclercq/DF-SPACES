import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import mongoose from 'mongoose'
import User from '@/models/User'

// Connect to MongoDB
const connectDB = async () => {
  if (mongoose.connections[0].readyState) return
  await mongoose.connect(process.env.MONGODB_URI!)
}

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
    const { role, isAdmin: newIsAdmin } = body

    // Prevent admin from removing their own admin privileges
    const isCurrentUser = auth.id === id
    if (isCurrentUser && role === 'user') {
      return NextResponse.json(
        { error: 'You cannot remove admin privileges from yourself' },
        { status: 400 }
      )
    }

    if (!['user', 'admin'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be "user" or "admin"' },
        { status: 400 }
      )
    }

    try {
      await connectDB()
      const updatedUser = await User.findByIdAndUpdate(
        id,
        {
          role,
          isAdmin: newIsAdmin || role === 'admin'
        },
        { new: true }
      ).select('name email role isAdmin createdAt')

      if (!updatedUser) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        )
      }

      return NextResponse.json(updatedUser)
    } catch {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
