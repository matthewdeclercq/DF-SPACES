import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import mongoose from 'mongoose'
import User from '@/models/User'

// Connect to MongoDB
const connectDB = async () => {
  if (mongoose.connections[0].readyState) return
  await mongoose.connect(process.env.MONGODB_URI!)
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await connectDB()
    
    const user = await User.findById(id).select('bio interests avatar')
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    
    return NextResponse.json({
      bio: user.bio || '',
      interests: user.interests || [],
      avatar: user.avatar || '',
    })
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession()
    
    if (!session?.user?.id || session.user.id !== id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    await connectDB()
    
    const body = await request.json()
    const { bio, interests, avatar } = body
    
    const updatedUser = await User.findByIdAndUpdate(
      id,
      {
        bio: bio || '',
        interests: interests || [],
        avatar: avatar || '',
      },
      { new: true }
    ).select('bio interests avatar')
    
    if (!updatedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    
    return NextResponse.json({
      bio: updatedUser.bio,
      interests: updatedUser.interests,
      avatar: updatedUser.avatar,
    })
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 