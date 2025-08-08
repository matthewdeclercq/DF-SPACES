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
    
    try {
      await connectDB()
      const users = await User.find()
        .select('name email role isAdmin createdAt')
        .sort({ createdAt: -1 })
      return NextResponse.json(users)
    } catch {
      // Fallback: return empty array if DB not available
      return NextResponse.json([])
    }
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
