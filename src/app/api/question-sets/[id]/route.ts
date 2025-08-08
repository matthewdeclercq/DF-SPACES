import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import mongoose from 'mongoose'
import FeedbackQuestion from '@/models/FeedbackQuestion'
import QuestionSetVersion from '@/models/QuestionSetVersion'
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
      isAdmin: Boolean((session as any).user?.isAdmin) || ['sarah@company.com'].includes(session.user.email),
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
          isAdmin: user.role === 'admin' || ['sarah@company.com'].includes(user.email),
        }
      }
    } catch {
      // ignore header parse errors
    }
  }
  return null
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuth(request)
    if (!auth?.email || !auth.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 403 })
    }
    const { id } = await params
    const body = await request.json()
    const { name, questions, restore } = body

    // Handle restore operation
    if (restore === true) {
      try {
        await connectDB()
        const questionSet = await FeedbackQuestion.findById(id)
        if (!questionSet) {
          return NextResponse.json({ error: 'Question set not found' }, { status: 404 })
        }

        questionSet.isArchived = false
        await questionSet.save()

        const updated = await FeedbackQuestion.findById(id)
          .populate('createdBy', 'name email')
        return NextResponse.json(updated)
      } catch {
        // Fallback: in-memory storage for dev without DB
        const key = '__mockQuestionSets'
        const g = globalThis as any
        if (!Array.isArray(g[key])) g[key] = []
        const index = g[key].findIndex((qs: any) => qs._id === id)
        if (index === -1) {
          return NextResponse.json({ error: 'Question set not found' }, { status: 404 })
        }
        g[key][index] = { ...g[key][index], isArchived: false }
        return NextResponse.json(g[key][index])
      }
    }

    // Handle regular edit operation
    if (typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }
    if (!Array.isArray(questions) || questions.length === 0 || !questions.every((q: any) => typeof q === 'string' && q.trim())) {
      return NextResponse.json({ error: 'Questions must be a non-empty array of strings' }, { status: 400 })
    }

    try {
      await connectDB()
      const questionSet = await FeedbackQuestion.findById(id)
      if (!questionSet) {
        return NextResponse.json({ error: 'Question set not found' }, { status: 404 })
      }

      // Ensure updatedBy exists in Users
      const updater = await User.findOneAndUpdate(
        { email: auth.email },
        { $setOnInsert: { name: auth.name || auth.email, email: auth.email, isAdmin: true } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      ).select('_id')

      // Compute next version
      const lastVersion = await QuestionSetVersion.findOne({ questionSetId: questionSet._id }).sort({ version: -1 })
      const nextVersion = (lastVersion?.version || 0) + 1

      // Save version snapshot BEFORE updating the document
      await QuestionSetVersion.create({
        questionSetId: questionSet._id,
        version: nextVersion,
        name: name.trim(),
        questions: questions.map((q: string) => q.trim()),
        updatedBy: updater._id,
        updatedAt: new Date(),
      })

      // Apply update
      questionSet.name = name.trim()
      questionSet.questions = questions.map((q: string) => q.trim())
      await questionSet.save()

      const updated = await FeedbackQuestion.findById(id)
        .populate('createdBy', 'name email')
      return NextResponse.json(updated)
    } catch {
      // Fallback: in-memory storage for dev without DB
      const key = '__mockQuestionSets'
      const vKey = '__mockQuestionSetVersions'
      const g = globalThis as any
      if (!Array.isArray(g[key])) g[key] = []
      if (!Array.isArray(g[vKey])) g[vKey] = []

      const index = g[key].findIndex((qs: any) => qs._id === id)
      if (index === -1) {
        return NextResponse.json({ error: 'Question set not found' }, { status: 404 })
      }
      const existing = g[key][index]
      const lastVersion = g[vKey].filter((v: any) => v.questionSetId === id).sort((a: any, b: any) => b.version - a.version)[0]
      const nextVersion = (lastVersion?.version || 0) + 1
      g[vKey].push({
        questionSetId: id,
        version: nextVersion,
        name: name.trim(),
        questions: questions.map((q: string) => q.trim()),
        updatedBy: { name: auth.name || auth.email, email: auth.email },
        updatedAt: new Date().toISOString(),
      })

      g[key][index] = {
        ...existing,
        name: name.trim(),
        questions: questions.map((q: string) => q.trim()),
      }
      return NextResponse.json(g[key][index])
    }
  } catch (error) {
    console.error('Error updating question set:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuth(request)
    if (!auth?.email || !auth.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 403 })
    }
    const { id } = await params

    try {
      await connectDB()
      const questionSet = await FeedbackQuestion.findById(id)
      if (!questionSet) {
        return NextResponse.json({ error: 'Question set not found' }, { status: 404 })
      }

      questionSet.isArchived = true
      await questionSet.save()

      return NextResponse.json({ success: true })
    } catch {
      // Fallback: in-memory storage for dev without DB
      const key = '__mockQuestionSets'
      const g = globalThis as any
      if (!Array.isArray(g[key])) g[key] = []
      const index = g[key].findIndex((qs: any) => qs._id === id)
      if (index === -1) {
        return NextResponse.json({ error: 'Question set not found' }, { status: 404 })
      }
      g[key][index] = { ...g[key][index], isArchived: true }
      return NextResponse.json({ success: true })
    }
  } catch (error) {
    console.error('Error archiving question set:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


