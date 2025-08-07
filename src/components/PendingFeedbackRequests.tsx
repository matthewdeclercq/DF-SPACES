'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MessageSquare } from 'lucide-react'

interface FeedbackRequest {
  _id: string
  category: string
  recipient: {
    name: string
    email: string
  }
  deadline?: string
  questionSet: {
    questions: string[]
  }
}

export default function PendingFeedbackRequests() {
  const [requests, setRequests] = useState<FeedbackRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchRequests()
  }, [])

  const fetchRequests = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/feedback/requests')
      if (response.ok) {
        const data = await response.json()
        setRequests(data)
      }
    } catch (error) {
      console.error('Error fetching requests:', error)
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
    return <div className="text-center py-4">Loading...</div>
  }

  if (requests.length === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <MessageSquare className="h-5 w-5" />
          <span>Pending Feedback Requests</span>
        </CardTitle>
        <CardDescription>
          You have {requests.length} pending feedback request{requests.length !== 1 ? 's' : ''}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {requests.map((request) => (
            <div key={request._id} className="border rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <Badge className={getCategoryColor(request.category)}>
                  {request.category}
                </Badge>
                {request.deadline && (
                  <span className="text-sm text-muted-foreground">
                    Due: {formatDate(request.deadline)}
                  </span>
                )}
              </div>
              <p className="text-sm font-medium mb-1">
                Provide feedback for: {request.recipient.name}
              </p>
              <p className="text-sm text-muted-foreground mb-3">
                {request.questionSet.questions.length} questions to answer
              </p>
              <Button size="sm" variant="outline">
                Submit Feedback
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
