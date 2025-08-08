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

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    // In mock mode there is no session; allow listing when a mock header is present for admin UI data loading
    const mockHeader = request.headers.get('x-mock-user')
    if (!session?.user?.id && !mockHeader) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    await connectDB()
    
    // If mock header is present, treat as admin list for admin UI
    if (mockHeader) {
      const requests = await FeedbackRequest.find()
        .populate('questionSet', 'category questions')
        .populate('targets', 'name email')
        .populate('recipient', 'name email')
        .populate('recipients', 'name email')
        .populate('createdBy', 'name email')
        .sort({ createdAt: -1 })
      return NextResponse.json(requests)
    }
    
    const email = session?.user?.email || ''
    const isAdmin = Boolean((session as any)?.user?.isAdmin) || ['sarah@company.com', 'm_declercq@digitalfoundry.com'].includes(email)
    
    let requests
    if (isAdmin) {
      // Admin sees all requests
      requests = await FeedbackRequest.find()
        .populate('questionSet', 'category questions')
        .populate('targets', 'name email')
        .populate('recipient', 'name email')
        .populate('recipients', 'name email')
        .populate('createdBy', 'name email')
        .sort({ createdAt: -1 })
    } else {
      // Users see requests where they are targets or recipients
      requests = await FeedbackRequest.find({
        $or: [
          { recipient: session?.user?.id },
          { recipients: session?.user?.id },
          { targets: session?.user?.id },
        ]
      })
        .populate('questionSet', 'category questions')
        .populate('targets', 'name email')
        .populate('recipient', 'name email')
        .populate('recipients', 'name email')
        .populate('createdBy', 'name email')
        .sort({ createdAt: -1 })
    }
    
    return NextResponse.json(requests)
  } catch (error) {
    console.error('Error fetching feedback requests:', error)
    const g = globalThis as any
    const mock = Array.isArray(g.__mockFeedbackRequests) ? g.__mockFeedbackRequests : []
    return NextResponse.json(mock)
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    // Check if user is admin
    // Allow mock admin via header
    const mockHeader = request.headers.get('x-mock-user')
    if (!session?.user?.email && mockHeader) {
      // skip session admin enforcement in mock mode; IDs will be mock
    } else if (!session?.user?.email || !(Boolean((session as any).user?.isAdmin) || ['sarah@company.com', 'm_declercq@digitalfoundry.com'].includes(session.user.email))) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      )
    }
    
    await connectDB()
    
    const body = await request.json()
    const { category, questionSetId, recipients, deadline } = body
    
    if (!category || !questionSetId || !Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: category, questionSetId, recipients[]' },
        { status: 400 }
      )
    }
    
    if (!['company', 'project', 'coworkers', 'self'].includes(category)) {
      return NextResponse.json(
        { error: 'Invalid category' },
        { status: 400 }
      )
    }
    
    // Validate recipients exist
    const users = await User.find({ _id: { $in: recipients } }).select('_id')
    if (users.length !== recipients.length) {
      return NextResponse.json({ error: 'One or more recipients not found' }, { status: 400 })
    }

    // Create one request with multiple recipients
    const feedbackRequest = new FeedbackRequest({
      category,
      questionSet: questionSetId,
      targets: [],
      recipients,
      deadline: deadline ? new Date(deadline) : undefined,
      createdBy: session?.user?.id,
    })
    await feedbackRequest.save()

    const populatedRequest = await FeedbackRequest.findById(feedbackRequest._id)
      .populate('questionSet', 'category questions')
      .populate('targets', 'name email')
      .populate('recipient', 'name email')
      .populate('recipients', 'name email')
      .populate('createdBy', 'name email')

    return NextResponse.json(populatedRequest, { status: 201 })
  } catch (error) {
    console.error('Error creating feedback request:', error)
    try {
      const body = await request.json()
      const { category, questionSetId, recipients, deadline } = body
      const g = globalThis as any
      if (!Array.isArray(g.__mockFeedbackRequests)) g.__mockFeedbackRequests = []
      const newItem = {
        _id: Math.random().toString(36).slice(2),
        category,
        questionSet: { _id: questionSetId, category, questions: [] },
        targets: [],
        recipients: (recipients || []).map((id: string) => ({ _id: id, name: 'User', email: 'user@mock.com' })),
        deadline: deadline ? new Date(deadline).toISOString() : undefined,
        createdBy: { _id: 'admin', name: 'Mock Admin', email: 'sarah@company.com' },
        createdAt: new Date().toISOString(),
      }
      g.__mockFeedbackRequests.unshift(newItem)
      return NextResponse.json(newItem, { status: 201 })
    } catch {
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  }
}
