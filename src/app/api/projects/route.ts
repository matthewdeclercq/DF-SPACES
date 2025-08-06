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
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    await connectDB()
    
    const body = await request.json()
    const { name, description, timeline, members } = body
    
    if (!name || !description || !timeline) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }
    
    const project = new Project({
      name,
      description,
      timeline,
      members: members || [],
      createdBy: session.user.id,
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