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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await connectDB()
    
    const project = await Project.findById(id)
      .populate('members', 'name email')
      .populate('createdBy', 'name email')
    
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }
    
    return NextResponse.json(project)
  } catch (error) {
    console.error('Error fetching project:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
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
    const { name, description, members } = body

    if (!name || !description) {
      return NextResponse.json(
        { error: 'Missing required fields: name, description' },
        { status: 400 }
      )
    }

    try {
      await connectDB()
      
      // Validate members exist
      if (members && Array.isArray(members)) {
        const validMembers = await User.find({ _id: { $in: members } }).select('_id')
        if (validMembers.length !== members.length) {
          return NextResponse.json({ error: 'One or more members not found' }, { status: 400 })
        }
      }

      const updatedProject = await Project.findByIdAndUpdate(
        id,
        {
          name: name.trim(),
          description: description.trim(),
          members: members || []
        },
        { new: true }
      )
        .populate('members', 'name email')
        .populate('createdBy', 'name email')

      if (!updatedProject) {
        return NextResponse.json(
          { error: 'Project not found' },
          { status: 404 }
        )
      }

      return NextResponse.json(updatedProject)
    } catch {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error updating project:', error)
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

    try {
      await connectDB()
      const deletedProject = await Project.findByIdAndDelete(id)
      
      if (!deletedProject) {
        return NextResponse.json(
          { error: 'Project not found' },
          { status: 404 }
        )
      }

      return NextResponse.json({ success: true })
    } catch {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error deleting project:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 