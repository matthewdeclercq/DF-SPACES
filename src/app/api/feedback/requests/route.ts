import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import mongoose from 'mongoose'
import FeedbackRequest from '@/models/FeedbackRequest'
import User from '@/models/User'

// Connect to MongoDB
const connectDB = async () => {
  if (mongoose.connections[0].readyState) return
  await mongoose.connect(process.env.MONGODB_URI!)
}

export async function GET() {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    await connectDB()
    
    const isAdmin = ['sarah@company.com'].includes(session.user.email || '')
    
    let requests
    if (isAdmin) {
      // Admin sees all requests
      requests = await FeedbackRequest.find()
        .populate('questionSet', 'category questions')
        .populate('targets', 'name email')
        .populate('recipient', 'name email')
        .populate('createdBy', 'name email')
        .sort({ createdAt: -1 })
    } else {
      // Users see requests where they are targets or recipients
      requests = await FeedbackRequest.find({
        $or: [
          { targets: session.user.id },
          { recipient: session.user.id }
        ]
      })
        .populate('questionSet', 'category questions')
        .populate('targets', 'name email')
        .populate('recipient', 'name email')
        .populate('createdBy', 'name email')
        .sort({ createdAt: -1 })
    }
    
    return NextResponse.json(requests)
  } catch (error) {
    console.error('Error fetching feedback requests:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    // Check if user is admin
    if (!session?.user?.email || !['sarah@company.com'].includes(session.user.email)) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      )
    }
    
    await connectDB()
    
    const body = await request.json()
    const { category, questionSetId, targets, recipient, deadline } = body
    
    if (!category || !questionSetId || !targets || !recipient) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }
    
    if (!['company', 'project', 'coworkers', 'self'].includes(category)) {
      return NextResponse.json(
        { error: 'Invalid category' },
        { status: 400 }
      )
    }
    
    // Validate that all users exist
    const allUserIds = [...targets, recipient]
    const users = await User.find({ _id: { $in: allUserIds } })
    if (users.length !== allUserIds.length) {
      return NextResponse.json(
        { error: 'One or more users not found' },
        { status: 400 }
      )
    }
    
    const feedbackRequest = new FeedbackRequest({
      category,
      questionSet: questionSetId,
      targets,
      recipient,
      deadline: deadline ? new Date(deadline) : undefined,
      createdBy: session.user.id,
    })
    
    await feedbackRequest.save()
    
    const populatedRequest = await FeedbackRequest.findById(feedbackRequest._id)
      .populate('questionSet', 'category questions')
      .populate('targets', 'name email')
      .populate('recipient', 'name email')
      .populate('createdBy', 'name email')
    
    return NextResponse.json(populatedRequest, { status: 201 })
  } catch (error) {
    console.error('Error creating feedback request:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
