'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import Layout from '@/components/Layout'
import FeedbackDetails from '@/components/FeedbackDetails'
import { Eye } from 'lucide-react'

interface FeedbackSubmission {
  _id: string
  responses: Array<{
    question: string
    answer: string
  }>
  anonymousRequested: boolean
  anonymous: boolean
  approved: boolean
  timestamp: string
  request: {
    category: string
    recipient: {
      name: string
      email: string
    }
  }
}

export default function ProviderFeedbackPage() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [submissions, setSubmissions] = useState<FeedbackSubmission[]>([])
  const [selectedSubmission, setSelectedSubmission] = useState<FeedbackSubmission | null>(null)
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const storedUser = localStorage.getItem('mockUser')
        if (storedUser) {
          const user = JSON.parse(storedUser)
          setCurrentUser(user)
        }
      } catch (error) {
        console.error('Error reading from localStorage:', error)
      }
    }
  }, [])

  useEffect(() => {
    if (currentUser) {
      fetchSubmissions()
    }
  }, [currentUser])

  const fetchSubmissions = async () => {
    try {
      const response = await fetch('/api/feedback/submissions?view=provider')
      if (response.ok) {
        const data = await response.json()
        setSubmissions(data)
      }
    } catch (error) {
      console.error('Error fetching submissions:', error)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'company': return 'bg-blue-100 text-blue-800'
      case 'project': return 'bg-green-100 text-green-800'
      case 'coworkers': return 'bg-purple-100 text-purple-800'
      case 'self': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (!currentUser) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">Loading...</div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">My Feedback</h1>
          <p className="text-muted-foreground">Feedback you have provided to others</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Feedback Given</CardTitle>
            <CardDescription>
              {submissions.length} feedback submission{submissions.length !== 1 ? 's' : ''}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {submissions.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Recipient</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {submissions.map((submission) => (
                    <TableRow key={submission._id}>
                      <TableCell>
                        {formatDate(submission.timestamp)}
                      </TableCell>
                      <TableCell>
                        {submission.request.recipient.name}
                        <br />
                        <span className="text-sm text-muted-foreground">
                          {submission.request.recipient.email}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge className={getCategoryColor(submission.request.category)}>
                          {submission.request.category}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={submission.approved ? "default" : "secondary"}>
                          {submission.approved ? "Approved" : "Pending"}
                        </Badge>
                        {submission.anonymous && (
                          <Badge variant="outline" className="ml-1">
                            Anonymous
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedSubmission(submission)
                            setShowDetails(true)
                          }}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No feedback submissions yet.</p>
                <p className="text-sm text-muted-foreground mt-2">
                  When you submit feedback, it will appear here.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Feedback Details Modal */}
        {showDetails && selectedSubmission && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-background rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-xl font-semibold">Feedback Details</h2>
                  <Button variant="outline" onClick={() => setShowDetails(false)}>
                    Close
                  </Button>
                </div>
                
                <FeedbackDetails 
                  feedback={selectedSubmission} 
                  showProviderInfo={false}
                  onClose={() => setShowDetails(false)}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
