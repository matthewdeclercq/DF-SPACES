import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import mongoose from 'mongoose'
import FeedbackQuestion from '@/models/FeedbackQuestion'

// Connect to MongoDB
const connectDB = async () => {
  if (mongoose.connections[0].readyState) return
  await mongoose.connect(process.env.MONGODB_URI!)
}

export async function GET() {
  try {
    const session = await getServerSession()
    
    // Check if user is admin (using mock data check)
    if (!session?.user?.email || !['sarah@company.com'].includes(session.user.email)) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      )
    }
    
    await connectDB()
    
    const questions = await FeedbackQuestion.find()
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
    
    return NextResponse.json(questions)
  } catch (error) {
    console.error('Error fetching feedback questions:', error)
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
    const { category, questions } = body
    
    if (!category || !questions || !Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: category and questions array' },
        { status: 400 }
      )
    }
    
    if (!['company', 'project', 'coworkers', 'self'].includes(category)) {
      return NextResponse.json(
        { error: 'Invalid category. Must be one of: company, project, coworkers, self' },
        { status: 400 }
      )
    }
    
    const questionSet = new FeedbackQuestion({
      category,
      questions,
      createdBy: session.user.id,
    })
    
    await questionSet.save()
    
    const populatedQuestionSet = await FeedbackQuestion.findById(questionSet._id)
      .populate('createdBy', 'name email')
    
    return NextResponse.json(populatedQuestionSet, { status: 201 })
  } catch (error) {
    console.error('Error creating feedback question set:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
