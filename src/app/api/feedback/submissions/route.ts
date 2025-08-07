import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import mongoose from 'mongoose'
import FeedbackSubmission from '@/models/FeedbackSubmission'
import FeedbackRequest from '@/models/FeedbackRequest'

// Connect to MongoDB
const connectDB = async () => {
  if (mongoose.connections[0].readyState) return
  await mongoose.connect(process.env.MONGODB_URI!)
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    await connectDB()
    
    const { searchParams } = new URL(request.url)
    const view = searchParams.get('view') // 'provider', 'recipient', or 'admin'
    const isAdmin = ['sarah@company.com'].includes(session.user.email || '')
    
    let submissions
    if (view === 'provider') {
      // User sees feedback they provided
      submissions = await FeedbackSubmission.find({ provider: session.user.id })
        .populate('request', 'category')
        .populate({
          path: 'request',
          populate: {
            path: 'recipient',
            select: 'name email'
          }
        })
        .sort({ timestamp: -1 })
    } else if (view === 'recipient') {
      // User sees feedback they received (only approved)
      submissions = await FeedbackSubmission.find({
        'request.recipient': session.user.id,
        approved: true
      })
        .populate('request', 'category')
        .populate({
          path: 'request',
          populate: {
            path: 'recipient',
            select: 'name email'
          }
        })
        .sort({ timestamp: -1 })
      
      // Anonymize if anonymous flag is true
      submissions = submissions.map(sub => {
        if (sub.anonymous) {
          const { provider, ...rest } = sub.toObject()
          return rest
        }
        return sub
      })
    } else if (isAdmin) {
      // Admin sees all submissions
      submissions = await FeedbackSubmission.find()
        .populate('provider', 'name email')
        .populate('request', 'category')
        .populate({
          path: 'request',
          populate: [
            { path: 'recipient', select: 'name email' },
            { path: 'questionSet', select: 'category questions' }
          ]
        })
        .sort({ timestamp: -1 })
    } else {
      return NextResponse.json(
        { error: 'Invalid view parameter' },
        { status: 400 }
      )
    }
    
    return NextResponse.json(submissions)
  } catch (error) {
    console.error('Error fetching feedback submissions:', error)
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
    const { requestId, responses, anonymousRequested } = body
    
    if (!requestId || !responses || !Array.isArray(responses)) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }
    
    // Check if user is a target for this request
    const feedbackRequest = await FeedbackRequest.findById(requestId)
    if (!feedbackRequest) {
      return NextResponse.json(
        { error: 'Feedback request not found' },
        { status: 404 }
      )
    }
    
    if (!feedbackRequest.targets.includes(session.user.id)) {
      return NextResponse.json(
        { error: 'You are not authorized to submit feedback for this request' },
        { status: 403 }
      )
    }
    
    // Check if submission already exists
    const existingSubmission = await FeedbackSubmission.findOne({
      request: requestId,
      provider: session.user.id
    })
    
    if (existingSubmission) {
      return NextResponse.json(
        { error: 'You have already submitted feedback for this request' },
        { status: 400 }
      )
    }
    
    const submission = new FeedbackSubmission({
      request: requestId,
      provider: session.user.id,
      responses,
      anonymousRequested: anonymousRequested || false,
      anonymous: anonymousRequested || false,
    })
    
    await submission.save()
    
    const populatedSubmission = await FeedbackSubmission.findById(submission._id)
      .populate('provider', 'name email')
      .populate('request', 'category')
    
    return NextResponse.json(populatedSubmission, { status: 201 })
  } catch (error) {
    console.error('Error creating feedback submission:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
