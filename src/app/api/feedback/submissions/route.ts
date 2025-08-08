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
    
    if (!auth?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    await connectDB()
    
    const { searchParams } = new URL(request.url)
    const view = searchParams.get('view') // 'provider', 'recipient', or 'admin'
    const isAdmin = Boolean((auth as any)?.isAdmin) || ['sarah@company.com', 'm_declercq@digitalfoundry.com'].includes(auth.email || '')
    
    let submissions
    if (view === 'provider') {
      // User sees feedback they provided
      submissions = await FeedbackSubmission.find({ provider: auth.id })
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
        'request.recipient': auth.id,
        approved: true,
        provider: { $ne: auth.id },
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
    // Fallback: in-memory with basic view filtering
    try {
      const auth = await getAuth(request)
      const g = globalThis as any
      let subs = Array.isArray(g.__mockFeedbackSubmissions) ? g.__mockFeedbackSubmissions : []
      const { searchParams } = new URL(request.url)
      const view = searchParams.get('view')
      const userId = auth?.id
      if (view === 'provider' && userId) {
        subs = subs.filter((s: any) => (s.provider?._id || s.provider?.id || s.provider) === userId)
      } else if (view === 'recipient' && userId) {
        subs = subs
          .filter((s: any) => s.approved)
          .filter((s: any) => {
            const rec = s.request?.recipient
            const recId = rec?._id || rec?.id
            const providerId = s.provider?._id || s.provider?.id || s.provider
            return recId === userId && providerId !== userId
          })
          .map((s: any) => (s.anonymous ? { ...s, provider: undefined } : s))
      }
      return NextResponse.json(subs)
    } catch {
      return NextResponse.json([])
    }
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
    
    // Authorization: if recipients list exists, user must be in recipients; else if targets exists, must be in targets; else allow
    const isInRecipients = Array.isArray((feedbackRequest as any).recipients) && (feedbackRequest as any).recipients.some((u: any) => String(u) === String(session.user.id))
    const isInTargets = Array.isArray((feedbackRequest as any).targets) && feedbackRequest.targets.some((u: any) => String(u) === String(session.user.id))
    if (!isInRecipients && (Array.isArray((feedbackRequest as any).recipients) && (feedbackRequest as any).recipients.length > 0)) {
      return NextResponse.json(
        { error: 'You are not authorized to submit feedback for this request' },
        { status: 403 }
      )
    }
    if (!isInRecipients && !isInTargets && Array.isArray((feedbackRequest as any).targets) && feedbackRequest.targets.length > 0) {
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
    // Fallback: in-memory storage for dev without DB
    try {
      const g = globalThis as any
      if (!Array.isArray(g.__mockFeedbackSubmissions)) g.__mockFeedbackSubmissions = []
      const body = await request.json()
      const { requestId, responses, anonymousRequested } = body
      // derive provider from mock header when present
      let mockUser: any = null
      const mockHeader = request.headers.get('x-mock-user')
      if (mockHeader) {
        try { mockUser = JSON.parse(mockHeader) } catch {}
      }
      // basic request linkage for recipient display
      const reqs = (globalThis as any).__mockFeedbackRequests as any[] | undefined
      const foundReq = Array.isArray(reqs) ? reqs.find((r) => r._id === requestId) : undefined
      const newItem = {
        _id: Math.random().toString(36).slice(2),
        request: foundReq ? { _id: foundReq._id, category: foundReq.category, recipient: foundReq.recipient || foundReq.recipients?.[0] } : { _id: requestId },
        provider: mockUser ? { _id: mockUser.id, name: mockUser.name, email: mockUser.email } : 'mock-user',
        responses,
        anonymousRequested: !!anonymousRequested,
        anonymous: !!anonymousRequested,
        approved: false,
        timestamp: new Date().toISOString(),
      }
      g.__mockFeedbackSubmissions.unshift(newItem)
      return NextResponse.json(newItem, { status: 201 })
    } catch {
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  }
}
