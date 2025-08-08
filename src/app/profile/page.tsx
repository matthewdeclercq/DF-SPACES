'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import Layout from '@/components/Layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useMockAuth } from '@/hooks/useMockAuth'
import { useSession } from 'next-auth/react'
import PendingFeedbackRequests from '@/components/PendingFeedbackRequests'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

interface FeedbackItem {
  _id: string
  timestamp: string
  responses: Array<{ question: string; answer: string }>
  anonymous: boolean
  provider?: { name: string; email: string }
  request: { category: string; recipient?: { name: string; email: string } }
}

export default function ProfilePage() {
  const mock = useMockAuth()
  const nextAuth = useSession()
  const [appMode, setAppMode] = useState<'mock' | 'real' | null>(null)
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/config')
        const data = res.ok ? await res.json() : { appMode: 'real' }
        if (!cancelled) setAppMode(data.appMode === 'mock' ? 'mock' : 'real')
      } catch {
        if (!cancelled) setAppMode('real')
      }
    })()
    return () => { cancelled = true }
  }, [])
  const session = useMemo(() => (appMode === 'mock' ? mock.data : nextAuth.data as any), [appMode, mock.data, nextAuth.data])
  const status = appMode === 'mock' ? mock.status : nextAuth.status
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [submitted, setSubmitted] = useState<FeedbackItem[]>([])
  const [received, setReceived] = useState<FeedbackItem[]>([])
  const [submittedPage, setSubmittedPage] = useState(1)
  const [receivedPage, setReceivedPage] = useState(1)
  const pageSize = 10

  useEffect(() => {
    if (appMode === 'real' && status === 'unauthenticated') {
      router.push('/')
    }
  }, [appMode, status, router])

  useEffect(() => {
    if (session?.user?.id) {
      void fetchFeedback()
    }
  }, [session])

  const fetchFeedback = async () => {
    try {
      setIsLoading(true)
      const headers = appMode === 'mock' && (session as any)?.user ? { 'X-Mock-User': JSON.stringify((session as any).user) } : undefined
      // Submitted (provider view)
      const submittedRes = await fetch('/api/feedback/submissions?view=provider', { headers })
      const submittedData: FeedbackItem[] = submittedRes.ok ? await submittedRes.json() : []
      // Received (recipient view)
      const receivedRes = await fetch('/api/feedback/submissions?view=recipient', { headers })
      const receivedData: FeedbackItem[] = receivedRes.ok ? await receivedRes.json() : []
      // Sort newest first
      submittedData.sort((a, b) => +new Date(b.timestamp) - +new Date(a.timestamp))
      receivedData.sort((a, b) => +new Date(b.timestamp) - +new Date(a.timestamp))
      setSubmitted(submittedData)
      setReceived(receivedData)
    } catch (error) {
      console.error('Error fetching feedback:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Profile editing removed per requirements

  if (appMode === null || status === 'loading' || isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-lg">Loading...</div>
        </div>
      </Layout>
    )
  }

  if (!session) {
    return null
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">My Profile</h1>
        {/* Pending Feedback Requests */}
        <PendingFeedbackRequests />

        {/* Submitted Feedback */}
        <Card>
          <CardHeader>
            <CardTitle>Submitted Feedback</CardTitle>
            <CardDescription>Feedback you have provided to others</CardDescription>
          </CardHeader>
          <CardContent>
            {submitted.length === 0 ? (
              <div className="text-sm text-muted-foreground">No feedback submitted yet.</div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Recipient</TableHead>
                      <TableHead>Feedback</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {submitted
                      .slice((submittedPage - 1) * pageSize, submittedPage * pageSize)
                      .map(item => (
                        <TableRow key={item._id}>
                          <TableCell>{new Date(item.timestamp).toLocaleString()}</TableCell>
                          <TableCell>{item.request.recipient?.name} ({item.request.recipient?.email})</TableCell>
                          <TableCell>
                            <div className="space-y-2">
                              {item.responses.map((r, idx) => (
                                <div key={idx}>
                                  <div className="text-xs text-muted-foreground">{r.question}</div>
                                  <div className="text-sm">{r.answer}</div>
                                </div>
                              ))}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
                <div className="flex justify-end items-center gap-2 mt-4">
                  <Button variant="outline" size="sm" disabled={submittedPage === 1} onClick={() => setSubmittedPage(p => p - 1)}>Previous</Button>
                  <div className="text-xs text-muted-foreground">Page {submittedPage} of {Math.max(1, Math.ceil(submitted.length / pageSize))}</div>
                  <Button variant="outline" size="sm" disabled={submittedPage >= Math.ceil(submitted.length / pageSize)} onClick={() => setSubmittedPage(p => p + 1)}>Next</Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Received Feedback */}
        <Card>
          <CardHeader>
            <CardTitle>Received Feedback</CardTitle>
            <CardDescription>Feedback others have provided to you</CardDescription>
          </CardHeader>
          <CardContent>
            {received.length === 0 ? (
              <div className="text-sm text-muted-foreground">No feedback received yet.</div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Sender</TableHead>
                      <TableHead>Feedback</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {received
                      .slice((receivedPage - 1) * pageSize, receivedPage * pageSize)
                      .map(item => (
                        <TableRow key={item._id}>
                          <TableCell>{new Date(item.timestamp).toLocaleString()}</TableCell>
                          <TableCell>{item.anonymous ? 'Anonymous' : `${item.provider?.name} (${item.provider?.email})`}</TableCell>
                          <TableCell>
                            <div className="space-y-2">
                              {item.responses.map((r, idx) => (
                                <div key={idx}>
                                  <div className="text-xs text-muted-foreground">{r.question}</div>
                                  <div className="text-sm">{r.answer}</div>
                                </div>
                              ))}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
                <div className="flex justify-end items-center gap-2 mt-4">
                  <Button variant="outline" size="sm" disabled={receivedPage === 1} onClick={() => setReceivedPage(p => p - 1)}>Previous</Button>
                  <div className="text-xs text-muted-foreground">Page {receivedPage} of {Math.max(1, Math.ceil(received.length / pageSize))}</div>
                  <Button variant="outline" size="sm" disabled={receivedPage >= Math.ceil(received.length / pageSize)} onClick={() => setReceivedPage(p => p + 1)}>Next</Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
} 