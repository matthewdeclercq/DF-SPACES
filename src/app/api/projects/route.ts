import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import mongoose from 'mongoose'
import Project from '@/models/Project'
import User from '@/models/User'

// Connect to MongoDB
const connectDB = async () => {
  if (mongoose.connections[0].readyState) return
  await mongoose.connect(process.env.MONGODB_URI!)
}

export async function GET() {
  try {
    await connectDB()
    
    const projects = await Project.find()
      .populate('members', 'name email')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
    
    return NextResponse.json(projects)
  } catch (error) {
    console.error('Error fetching projects:', error)
    // Fallback to mock projects
    const g = globalThis as any
    const mock = Array.isArray(g.__mockProjects) ? g.__mockProjects : []
    return NextResponse.json(mock)
  }
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
    
    await connectDB()
    
    const body = await request.json()
    const { name, description, members } = body
    
    if (!name || !description) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }
    
    // Validate members exist
    if (members && Array.isArray(members) && members.length > 0) {
      const validMembers = await User.find({ _id: { $in: members } }).select('_id')
      if (validMembers.length !== members.length) {
        return NextResponse.json({ error: 'One or more members not found' }, { status: 400 })
      }
    }

    // Find or create the user
    const user = await User.findOneAndUpdate(
      { email: auth.email },
      { $setOnInsert: { name: auth.name || auth.email, email: auth.email, isAdmin: true } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).select('_id')

    const project = new Project({
      name,
      description,
      members: members || [],
      createdBy: user._id,
    })
    
    await project.save()
    
    const populatedProject = await Project.findById(project._id)
      .populate('members', 'name email')
      .populate('createdBy', 'name email')
    
    return NextResponse.json(populatedProject, { status: 201 })
  } catch (error) {
    console.error('Error creating project:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 