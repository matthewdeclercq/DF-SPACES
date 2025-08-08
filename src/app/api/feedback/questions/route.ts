import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import mongoose from 'mongoose'
import FeedbackQuestion from '@/models/FeedbackQuestion'
import User from '@/models/User'
import { connectMongo } from '@/lib/mongoose'
import { getAuthFromRequest, isAdminEmail } from '@/lib/auth'

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
    const auth = await getAuthFromRequest(request)
    const isAdmin = Boolean(auth?.isAdmin) || isAdminEmail(auth?.email)
    if (!auth?.email || !isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      )
    }
    
    try {
      await connectMongo()
      const { searchParams } = new URL(request.url)
      const includeArchived = searchParams.get('includeArchived') === 'true'
      const filter = includeArchived ? {} : { isArchived: { $ne: true } }
      const questions = await FeedbackQuestion.find(filter)
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
    const auth = await getAuthFromRequest(request)
    const isAdmin = Boolean(auth?.isAdmin) || isAdminEmail(auth?.email)
    if (!auth?.email || !isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      )
    }
    
    const body = await request.json()
    const { name, category, questions } = body
    
    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json(
        { error: 'Missing required field: name' },
        { status: 400 }
      )
    }
    
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
      await connectMongo()
      // Ensure we have a valid User document to reference as createdBy
      const creator = await User.findOneAndUpdate(
        { email: auth.email },
        { $setOnInsert: { name: auth.name || auth.email, email: auth.email } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      ).select('_id')

      const questionSet = new FeedbackQuestion({
        name: name.trim(),
        category,
        questions: questions.map((q: string) => q.trim()),
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
        name: name.trim(),
        category,
        questions: questions.map((q: string) => q.trim()),
        createdBy: { name: auth.name || auth.email, email: auth.email },
        isArchived: false,
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
