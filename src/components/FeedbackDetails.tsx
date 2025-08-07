'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Eye, EyeOff } from 'lucide-react'

interface FeedbackResponse {
  question: string
  answer: string
}

interface FeedbackDetailsProps {
  feedback: {
    _id: string
    responses: FeedbackResponse[]
    anonymousRequested: boolean
    anonymous: boolean
    approved: boolean
    timestamp: string
    provider?: {
      name: string
      email: string
    }
    request?: {
      category: string
      recipient?: {
        name: string
        email: string
      }
    }
  }
  showProviderInfo?: boolean
  onClose?: () => void
}

export default function FeedbackDetails({ feedback, showProviderInfo = false, onClose }: FeedbackDetailsProps) {
  const [viewMode, setViewMode] = useState<'list' | 'qa'>('qa')

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-2xl">Feedback Details</CardTitle>
            <CardDescription>
              Submitted on {formatDate(feedback.timestamp)}
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            {feedback.request?.category && (
              <Badge className={getCategoryColor(feedback.request.category)}>
                {feedback.request.category}
              </Badge>
            )}
            <Badge variant={feedback.approved ? "default" : "secondary"}>
              {feedback.approved ? "Approved" : "Pending"}
            </Badge>
            {feedback.anonymous && (
              <Badge variant="outline" className="flex items-center gap-1">
                <EyeOff className="h-3 w-3" />
                Anonymous
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Provider/Recipient Info */}
        {showProviderInfo && feedback.provider && !feedback.anonymous && (
          <div className="p-4 bg-muted rounded-lg">
            <h3 className="font-semibold mb-2">Provider Information</h3>
            <p className="text-sm text-muted-foreground">
              {feedback.provider.name} ({feedback.provider.email})
            </p>
          </div>
        )}

        {feedback.request?.recipient && (
          <div className="p-4 bg-muted rounded-lg">
            <h3 className="font-semibold mb-2">Recipient</h3>
            <p className="text-sm text-muted-foreground">
              {feedback.request.recipient.name} ({feedback.request.recipient.email})
            </p>
          </div>
        )}

        {/* View Mode Toggle */}
        <div className="flex justify-center">
          <div className="flex bg-muted rounded-lg p-1">
            <Button
              variant={viewMode === 'qa' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('qa')}
            >
              Q&A Format
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              List View
            </Button>
          </div>
        </div>

        {/* Responses */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Responses</h3>
          
          {viewMode === 'qa' ? (
            <div className="space-y-6">
              {feedback.responses.map((response, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <h4 className="font-medium text-primary mb-2">
                    Question {index + 1}
                  </h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    {response.question}
                  </p>
                  <div className="bg-muted p-3 rounded">
                    <p className="text-sm">{response.answer}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {feedback.responses.map((response, index) => (
                <div key={index} className="flex flex-col space-y-1">
                  <span className="text-sm font-medium text-muted-foreground">
                    Q{index + 1}: {response.question}
                  </span>
                  <span className="text-sm ml-4">A: {response.answer}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Close Button */}
        {onClose && (
          <div className="flex justify-end pt-4 border-t">
            <Button onClick={onClose} variant="outline">
              Close
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
