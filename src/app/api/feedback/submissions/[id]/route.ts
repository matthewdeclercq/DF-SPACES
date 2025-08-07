import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import mongoose from 'mongoose'
import FeedbackSubmission from '@/models/FeedbackSubmission'

// Connect to MongoDB
const connectDB = async () => {
  if (mongoose.connections[0].readyState) return
  await mongoose.connect(process.env.MONGODB_URI!)
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession()
    
    // Check if user is admin
    if (!session?.user?.email || !['sarah@company.com'].includes(session.user.email)) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      )
    }
    
    const { id } = await params
    await connectDB()
    
    const body = await request.json()
    const { approved, anonymous } = body
    
    if (typeof approved !== 'boolean') {
      return NextResponse.json(
        { error: 'Approved status is required' },
        { status: 400 }
      )
    }
    
    const submission = await FeedbackSubmission.findById(id)
    if (!submission) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      )
    }
    
    submission.approved = approved
    if (typeof anonymous === 'boolean') {
      submission.anonymous = anonymous
    }
    
    await submission.save()
    
    const updatedSubmission = await FeedbackSubmission.findById(id)
      .populate('provider', 'name email')
      .populate('request', 'category')
    
    return NextResponse.json(updatedSubmission)
  } catch (error) {
    console.error('Error updating feedback submission:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
