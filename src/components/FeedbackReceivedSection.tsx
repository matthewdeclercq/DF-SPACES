'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
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
  provider?: {
    name: string
    email: string
  }
  request: {
    category: string
    recipient?: {
      name: string
      email: string
      id?: string
      _id?: string
    }
  }
}

interface FeedbackReceivedSectionProps {
  userId: string
  currentUser: any
}

export default function FeedbackReceivedSection({ userId, currentUser }: FeedbackReceivedSectionProps) {
  const [submissions, setSubmissions] = useState<FeedbackSubmission[]>([])
  const [selectedSubmission, setSelectedSubmission] = useState<FeedbackSubmission | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchSubmissions()
  }, [userId])

  const fetchSubmissions = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/feedback/submissions?view=recipient')
      if (response.ok) {
        const data = await response.json()
        // Filter for this specific user's received feedback
        const userSubmissions = data.filter((sub: FeedbackSubmission) => 
          sub.request.recipient?.id === userId || 
          sub.request.recipient?._id === userId
        )
        setSubmissions(userSubmissions)
      }
    } catch (error) {
      console.error('Error fetching submissions:', error)
    } finally {
      setIsLoading(false)
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

  if (isLoading) {
    return <div className="text-center py-4">Loading feedback...</div>
  }

  return (
    <div>
      {submissions.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Provider</TableHead>
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
                  {submission.anonymous ? (
                    <span className="text-muted-foreground">Anonymous</span>
                  ) : (
                    <>
                      {submission.provider?.name || 'Unknown'}
                      <br />
                      <span className="text-sm text-muted-foreground">
                        {submission.provider?.email || ''}
                      </span>
                    </>
                  )}
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
          <p className="text-muted-foreground">No feedback received yet.</p>
          <p className="text-sm text-muted-foreground mt-2">
            When colleagues provide feedback, it will appear here.
          </p>
        </div>
      )}

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
  )
}
