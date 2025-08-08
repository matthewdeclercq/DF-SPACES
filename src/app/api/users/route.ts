import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import mongoose from 'mongoose'
import User from '@/models/User'

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
    } catch {}
  }
  return null
}

export async function GET(request: NextRequest) {
  try {
    // In mock mode, allow listing without auth so the login selector can populate
    if ((process.env.APP_MODE || '').toLowerCase() === 'mock') {
      const g = globalThis as any
      const mock = g.__mockUsers
      if (Array.isArray(mock)) {
        return NextResponse.json(mock.map((u: any) => ({ _id: u.id || u._id, name: u.name, email: u.email })))
      }
    }
    const auth = await getAuth(request)
    if (!auth?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    try {
      await connectDB()
      const users = await User.find().select('name email')
      return NextResponse.json(users)
    } catch {
      // Fallback mock users from mock-auth if available
      const g = globalThis as any
      const mock = g.__mockUsers
      if (Array.isArray(mock)) {
        return NextResponse.json(mock.map((u: any) => ({ _id: u.id, name: u.name, email: u.email })))
      }
      return NextResponse.json([])
    }
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


