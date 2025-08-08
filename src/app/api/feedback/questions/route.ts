import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import mongoose from 'mongoose'
import FeedbackQuestion from '@/models/FeedbackQuestion'
import User from '@/models/User'

// Connect to MongoDB
const connectDB = async () => {
  if (mongoose.connections[0].readyState) return
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is not set')
  await mongoose.connect(process.env.MONGODB_URI)
}

// Attempt to get auth from real session; otherwise from mock header
async function getAuth(request: NextRequest) {
  const session = await getServerSession()
  if (session?.user?.email) {
    return {
      email: session.user.email,
      id: session.user.id,
      name: session.user.name || '',
      role: 'unknown',
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
          role: user.role || 'unknown',
        }
      }
    } catch {
      // ignore header parse errors
    }
  }
  return null
}

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuth(request)
    // Check if user is admin (supports mock header)
    if (!auth?.email || !['sarah@company.com'].includes(auth.email)) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      )
    }
    
    try {
      await connectDB()
      const questions = await FeedbackQuestion.find()
        .populate('createdBy', 'name email')
        .sort({ createdAt: -1 })
      return NextResponse.json(questions)
    } catch {
      // Fallback: in-memory store for dev without DB
      const store = (globalThis as any).__mockQuestionSets as any[] | undefined
      return NextResponse.json(store || [])
    }
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
    const auth = await getAuth(request)
    // Check if user is admin (supports mock header)
    if (!auth?.email || !['sarah@company.com'].includes(auth.email)) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      )
    }
    
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
    
    try {
      await connectDB()
      // Ensure we have a valid User document to reference as createdBy
      const creator = await User.findOneAndUpdate(
        { email: auth.email },
        { $setOnInsert: { name: auth.name || auth.email, email: auth.email } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      ).select('_id')

      const questionSet = new FeedbackQuestion({
        category,
        questions,
        createdBy: creator._id,
      })
      await questionSet.save()

      const populatedQuestionSet = await FeedbackQuestion.findById(questionSet._id)
        .populate('createdBy', 'name email')
      return NextResponse.json(populatedQuestionSet, { status: 201 })
    } catch {
      // Fallback: in-memory storage for dev without DB
      const key = '__mockQuestionSets'
      const g = globalThis as any
      if (!Array.isArray(g[key])) g[key] = []
      const newItem = {
        _id: Math.random().toString(36).slice(2),
        category,
        questions,
        createdBy: { name: auth.name || auth.email, email: auth.email },
        createdAt: new Date().toISOString(),
      }
      g[key].unshift(newItem)
      return NextResponse.json(newItem, { status: 201 })
    }
  } catch (error) {
    console.error('Error creating feedback question set:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
