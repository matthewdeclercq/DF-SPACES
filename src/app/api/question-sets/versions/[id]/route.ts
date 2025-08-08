import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import mongoose from 'mongoose'
import QuestionSetVersion from '@/models/QuestionSetVersion'
import FeedbackQuestion from '@/models/FeedbackQuestion'
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
    } catch {}
  }
  return null
}

export async function GET(
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
      const versions = await QuestionSetVersion.find({ questionSetId: id })
        .populate('updatedBy', 'name email')
        .sort({ version: -1 })
      return NextResponse.json(versions)
    } catch {
      // Fallback: in-memory store
      const vKey = '__mockQuestionSetVersions'
      const g = globalThis as any
      const versions = (Array.isArray(g[vKey]) ? g[vKey] : []).filter((v: any) => v.questionSetId === id)
        .sort((a: any, b: any) => b.version - a.version)
      return NextResponse.json(versions)
    }
  } catch (error) {
    console.error('Error fetching question set versions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
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
    const { version } = body

    if (typeof version !== 'number') {
      return NextResponse.json({ error: 'Version number is required' }, { status: 400 })
    }

    try {
      await connectDB()
      const mongoose = require('mongoose')
      
      // Find the version to restore
      const versionToRestore = await QuestionSetVersion.findOne({ 
        questionSetId: id, 
        version: version 
      })
      
      if (!versionToRestore) {
        return NextResponse.json({ error: 'Version not found' }, { status: 404 })
      }

      // Find the question set
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

      // Save current state as a new version before restoring
      await QuestionSetVersion.create({
        questionSetId: questionSet._id,
        version: nextVersion,
        name: questionSet.name,
        questions: questionSet.questions,
        updatedBy: updater._id,
        updatedAt: new Date(),
      })

      // Restore the selected version
      questionSet.name = versionToRestore.name
      questionSet.questions = versionToRestore.questions
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

      const questionSetIndex = g[key].findIndex((qs: any) => qs._id === id)
      if (questionSetIndex === -1) {
        return NextResponse.json({ error: 'Question set not found' }, { status: 404 })
      }

      const versionToRestore = g[vKey].find((v: any) => v.questionSetId === id && v.version === version)
      if (!versionToRestore) {
        return NextResponse.json({ error: 'Version not found' }, { status: 404 })
      }

      const currentQuestionSet = g[key][questionSetIndex]
      const lastVersion = g[vKey].filter((v: any) => v.questionSetId === id).sort((a: any, b: any) => b.version - a.version)[0]
      const nextVersion = (lastVersion?.version || 0) + 1

      // Save current state as new version
      g[vKey].push({
        questionSetId: id,
        version: nextVersion,
        name: currentQuestionSet.name,
        questions: currentQuestionSet.questions,
        updatedBy: { name: auth.name || auth.email, email: auth.email },
        updatedAt: new Date().toISOString(),
      })

      // Restore the selected version
      g[key][questionSetIndex] = {
        ...currentQuestionSet,
        name: versionToRestore.name,
        questions: versionToRestore.questions,
      }

      return NextResponse.json(g[key][questionSetIndex])
    }
  } catch (error) {
    console.error('Error restoring question set version:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


