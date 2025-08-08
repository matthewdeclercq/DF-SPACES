import { NextResponse } from 'next/server'
import { mockUsers } from '@/lib/mock-auth'

export async function GET() {
  const envMode = (process.env.APP_MODE || '').toLowerCase()
  const mode = envMode === 'mock' ? 'mock' : envMode === 'real' ? 'real' : 'mock'

  // Seed in-memory mock data when in mock mode
  if (mode === 'mock') {
    const g = globalThis as any
    // Users
    if (!Array.isArray(g.__mockUsers) || g.__mockUsers.length === 0) {
      g.__mockUsers = mockUsers.map(u => ({ id: u.id, name: u.name, email: u.email }))
    }
    // Question sets
    if (!Array.isArray(g.__mockQuestionSets) || g.__mockQuestionSets.length === 0) {
      g.__mockQuestionSets = [
        {
          _id: 'qs_company_1',
          name: 'Q1 Company Pulse',
          category: 'company',
          questions: [
            'How satisfied are you with company direction?',
            'What could leadership improve?',
          ],
          createdBy: { name: 'Sarah Admin', email: 'sarah@company.com' },
          isArchived: false,
          createdAt: new Date().toISOString(),
        },
        {
          _id: 'qs_project_1',
          name: 'Project Health Check',
          category: 'project',
          questions: [
            'What is going well in the project?',
            'Where are the biggest risks?',
          ],
          createdBy: { name: 'Sarah Admin', email: 'sarah@company.com' },
          isArchived: false,
          createdAt: new Date().toISOString(),
        },
      ]
    }
    if (!Array.isArray(g.__mockQuestionSetVersions)) {
      g.__mockQuestionSetVersions = []
    }
    // Projects
    if (!Array.isArray(g.__mockProjects) || g.__mockProjects.length === 0) {
      const john = mockUsers.find(u => u.email === 'john@company.com')
      const sarah = mockUsers.find(u => u.email === 'sarah@company.com')
      g.__mockProjects = [
        {
          _id: 'proj1',
          name: 'Website Redesign',
          description: 'Complete redesign of company site',
          timeline: 'Q1 2025',
          members: john ? [{ _id: john.id, name: john.name, email: john.email }] : [],
          createdBy: sarah ? { _id: sarah.id, name: sarah.name, email: sarah.email } : undefined,
          createdAt: new Date().toISOString(),
        },
        {
          _id: 'proj2',
          name: 'Mobile App',
          description: 'New cross-platform app',
          timeline: 'Q2 2025',
          members: [],
          createdBy: sarah ? { _id: sarah.id, name: sarah.name, email: sarah.email } : undefined,
          createdAt: new Date().toISOString(),
        },
      ]
    }
    // Feedback requests
    if (!Array.isArray(g.__mockFeedbackRequests) || g.__mockFeedbackRequests.length === 0) {
      const john = mockUsers.find(u => u.email === 'john@company.com')
      const sarah = mockUsers.find(u => u.email === 'sarah@company.com')
      const companyQs = (g.__mockQuestionSets as any[]).find((q: any) => q.category === 'company')
      g.__mockFeedbackRequests = [
        {
          _id: 'fr1',
          category: 'company',
          questionSet: { _id: companyQs?._id, category: companyQs?.category, questions: companyQs?.questions },
          targets: [],
          recipient: undefined,
          recipients: john ? [{ _id: john.id, name: john.name, email: john.email }] : [],
          deadline: new Date(Date.now() + 7 * 86400000).toISOString(),
          createdBy: sarah ? { _id: sarah.id, name: sarah.name, email: sarah.email } : undefined,
          createdAt: new Date().toISOString(),
        },
      ]
    }
    // Feedback submissions
    if (!Array.isArray(g.__mockFeedbackSubmissions) || g.__mockFeedbackSubmissions.length === 0) {
      const john = mockUsers.find(u => u.email === 'john@company.com')
      const req = (g.__mockFeedbackRequests as any[])[0]
      g.__mockFeedbackSubmissions = [
        {
          _id: 'fs1',
          request: { _id: req?._id, category: req?.category, recipient: req?.recipient || req?.recipients?.[0] },
          provider: john ? { _id: john.id, name: john.name, email: john.email } : undefined,
          responses: (req?.questionSet?.questions || []).map((q: string, i: number) => ({ question: q, answer: `Sample answer ${i + 1}` })),
          anonymousRequested: false,
          anonymous: false,
          approved: false,
          timestamp: new Date().toISOString(),
        },
      ]
    }
  }
  return NextResponse.json({
    appMode: mode,
    allowedDomain: process.env.ALLOWED_EMAIL_DOMAIN || null,
  })
}


