'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import Layout from '@/components/Layout'
import FeedbackDetails from '@/components/FeedbackDetails'
import { Eye, Plus, Users, FileText } from 'lucide-react'

interface FeedbackSubmission {
  _id: string
  responses: Array<{
    question: string
    answer: string
  }>
  provider: {
    name: string
    email: string
  }
  request: {
    category: string
    recipient: {
      name: string
      email: string
    }
  }
  anonymousRequested: boolean
  anonymous: boolean
  approved: boolean
  timestamp: string
}

interface FeedbackQuestion {
  _id: string
  category: string
  questions: string[]
  createdBy: {
    name: string
    email: string
  }
}

interface FeedbackRequest {
  _id: string
  category: string
  targets: Array<{
    name: string
    email: string
  }>
  recipient: {
    name: string
    email: string
  }
  deadline?: string
  createdBy: {
    name: string
    email: string
  }
}

export default function AdminFeedbackPage() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [submissions, setSubmissions] = useState<FeedbackSubmission[]>([])
  const [questions, setQuestions] = useState<FeedbackQuestion[]>([])
  const [requests, setRequests] = useState<FeedbackRequest[]>([])
  const [selectedSubmission, setSelectedSubmission] = useState<FeedbackSubmission | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  // Tabs are managed via shadcn Tabs; no manual activeTab state needed
  
  // Form states
  const [newQuestionSet, setNewQuestionSet] = useState({
    category: '',
    questions: ['']
  })
  const [newRequest, setNewRequest] = useState({
    category: '',
    questionSetId: '',
    targets: [] as string[],
    recipient: '',
    deadline: ''
  })

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const storedUser = localStorage.getItem('mockUser')
        if (storedUser) {
          const user = JSON.parse(storedUser)
          setCurrentUser(user)
          setIsAdmin(user.role === 'admin')
          
          if (user.role !== 'admin') {
            router.push('/profile')
          }
        }
      } catch (error) {
        console.error('Error reading from localStorage:', error)
      }
    }
  }, [router])

  useEffect(() => {
    if (isAdmin) {
      fetchSubmissions()
      fetchQuestions()
      fetchRequests()
    }
  }, [isAdmin])

  const fetchSubmissions = async () => {
    try {
      const response = await fetch('/api/feedback/submissions', {
        headers: currentUser ? { 'X-Mock-User': JSON.stringify(currentUser) } : undefined,
      })
      if (response.ok) {
        const data = await response.json()
        setSubmissions(data)
      }
    } catch (error) {
      console.error('Error fetching submissions:', error)
    }
  }

  const fetchQuestions = async () => {
    try {
      const response = await fetch('/api/feedback/questions', {
        headers: currentUser ? { 'X-Mock-User': JSON.stringify(currentUser) } : undefined,
      })
      if (response.ok) {
        const data = await response.json()
        setQuestions(data)
      }
    } catch (error) {
      console.error('Error fetching questions:', error)
    }
  }

  const fetchRequests = async () => {
    try {
      const response = await fetch('/api/feedback/requests', {
        headers: currentUser ? { 'X-Mock-User': JSON.stringify(currentUser) } : undefined,
      })
      if (response.ok) {
        const data = await response.json()
        setRequests(data)
      }
    } catch (error) {
      console.error('Error fetching requests:', error)
    }
  }

  const handleApproveSubmission = async (submissionId: string, approved: boolean, anonymous?: boolean) => {
    try {
      const response = await fetch(`/api/feedback/submissions/${submissionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(currentUser && { 'X-Mock-User': JSON.stringify(currentUser) }),
        },
        body: JSON.stringify({
          approved,
          ...(typeof anonymous === 'boolean' && { anonymous })
        }),
      })

      if (response.ok) {
        fetchSubmissions()
        setShowDetails(false)
        setSelectedSubmission(null)
      }
    } catch (error) {
      console.error('Error updating submission:', error)
    }
  }

  const handleCreateQuestionSet = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/feedback/questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(currentUser && { 'X-Mock-User': JSON.stringify(currentUser) }),
        },
        body: JSON.stringify({
          category: newQuestionSet.category,
          questions: newQuestionSet.questions.filter(q => q.trim() !== '')
        }),
      })

      if (response.ok) {
        setNewQuestionSet({ category: '', questions: [''] })
        fetchQuestions()
      }
    } catch (error) {
      console.error('Error creating question set:', error)
    }
  }

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/feedback/requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(currentUser && { 'X-Mock-User': JSON.stringify(currentUser) }),
        },
        body: JSON.stringify({
          category: newRequest.category,
          questionSetId: newRequest.questionSetId,
          targets: newRequest.targets,
          recipient: newRequest.recipient,
          deadline: newRequest.deadline || undefined
        }),
      })

      if (response.ok) {
        setNewRequest({
          category: '',
          questionSetId: '',
          targets: [],
          recipient: '',
          deadline: ''
        })
        fetchRequests()
      }
    } catch (error) {
      console.error('Error creating request:', error)
    }
  }

  const addQuestion = () => {
    setNewQuestionSet(prev => ({
      ...prev,
      questions: [...prev.questions, '']
    }))
  }

  const removeQuestion = (index: number) => {
    setNewQuestionSet(prev => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index)
    }))
  }

  const updateQuestion = (index: number, value: string) => {
    setNewQuestionSet(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) => i === index ? value : q)
    }))
  }

  if (!isAdmin) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
            <p className="text-muted-foreground">Admin access required</p>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Feedback Administration</h1>
          <p className="text-muted-foreground">Manage feedback questions, requests, and submissions</p>
        </div>

        <Tabs defaultValue="submissions" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="submissions" className="flex items-center space-x-2">
              <FileText className="h-4 w-4 mr-1" />
              <span>Submissions</span>
            </TabsTrigger>
            <TabsTrigger value="questions" className="flex items-center space-x-2">
              <Plus className="h-4 w-4 mr-1" />
              <span>Question Sets</span>
            </TabsTrigger>
            <TabsTrigger value="requests" className="flex items-center space-x-2">
              <Users className="h-4 w-4 mr-1" />
              <span>Requests</span>
            </TabsTrigger>
          </TabsList>

          {/* Submissions Tab */}
          <TabsContent value="submissions">
          <Card>
            <CardHeader>
              <CardTitle>Feedback Submissions</CardTitle>
              <CardDescription>Review and approve feedback submissions</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Provider</TableHead>
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
                        {new Date(submission.timestamp).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {submission.anonymous ? 'Anonymous' : submission.provider.name}
                      </TableCell>
                      <TableCell>{submission.request.recipient.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{submission.request.category}</Badge>
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
                          Review
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          </TabsContent>

        {/* Questions Tab */}
        <TabsContent value="questions">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Create Question Set</CardTitle>
                <CardDescription>Draft a new set of feedback questions</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateQuestionSet} className="space-y-4">
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <select
                      id="category"
                      value={newQuestionSet.category}
                      onChange={(e) => setNewQuestionSet(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full p-2 border border-input rounded-md bg-background"
                      required
                    >
                      <option value="">Select category...</option>
                      <option value="company">Company</option>
                      <option value="project">Project</option>
                      <option value="coworkers">Coworkers</option>
                      <option value="self">Self Reflection</option>
                    </select>
                  </div>
                  
                  <div>
                    <Label>Questions</Label>
                    <div className="space-y-2">
                      {newQuestionSet.questions.map((question, index) => (
                        <div key={index} className="flex space-x-2">
                          <Textarea
                            value={question}
                            onChange={(e) => updateQuestion(index, e.target.value)}
                            placeholder={`Question ${index + 1}`}
                            required
                          />
                          {newQuestionSet.questions.length > 1 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeQuestion(index)}
                            >
                              Remove
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addQuestion}
                      className="mt-2"
                    >
                      Add Question
                    </Button>
                  </div>
                  
                  <Button type="submit" className="w-full">
                    Create Question Set
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Existing Question Sets</CardTitle>
                <CardDescription>Manage your question sets</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {questions.map((questionSet) => (
                    <div key={questionSet._id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <Badge variant="outline">{questionSet.category}</Badge>
                        <span className="text-sm text-muted-foreground">
                          {questionSet.questions.length} questions
                        </span>
                      </div>
                      <div className="space-y-1">
                        {questionSet.questions.map((question, index) => (
                          <p key={index} className="text-sm text-muted-foreground">
                            {index + 1}. {question}
                          </p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Requests Tab */}
        <TabsContent value="requests">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Create Feedback Request</CardTitle>
                <CardDescription>Request feedback from specific users</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateRequest} className="space-y-4">
                  <div>
                    <Label htmlFor="req-category">Category</Label>
                    <select
                      id="req-category"
                      value={newRequest.category}
                      onChange={(e) => setNewRequest(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full p-2 border border-input rounded-md bg-background"
                      required
                    >
                      <option value="">Select category...</option>
                      <option value="company">Company</option>
                      <option value="project">Project</option>
                      <option value="coworkers">Coworkers</option>
                      <option value="self">Self Reflection</option>
                    </select>
                  </div>
                  
                  <div>
                    <Label htmlFor="questionSet">Question Set</Label>
                    <select
                      id="questionSet"
                      value={newRequest.questionSetId}
                      onChange={(e) => setNewRequest(prev => ({ ...prev, questionSetId: e.target.value }))}
                      className="w-full p-2 border border-input rounded-md bg-background"
                      required
                    >
                      <option value="">Select question set...</option>
                      {questions.map((qs) => (
                        <option key={qs._id} value={qs._id}>
                          {qs.category} ({qs.questions.length} questions)
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <Label htmlFor="recipient">Recipient</Label>
                    <Input
                      id="recipient"
                      type="email"
                      placeholder="recipient@company.com"
                      value={newRequest.recipient}
                      onChange={(e) => setNewRequest(prev => ({ ...prev, recipient: e.target.value }))}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="targets">Targets (comma-separated emails)</Label>
                    <Input
                      id="targets"
                      type="text"
                      placeholder="user1@company.com, user2@company.com"
                      value={newRequest.targets.join(', ')}
                      onChange={(e) => setNewRequest(prev => ({ 
                        ...prev, 
                        targets: e.target.value.split(',').map(t => t.trim()).filter(t => t)
                      }))}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="deadline">Deadline (optional)</Label>
                    <Input
                      id="deadline"
                      type="datetime-local"
                      value={newRequest.deadline}
                      onChange={(e) => setNewRequest(prev => ({ ...prev, deadline: e.target.value }))}
                    />
                  </div>
                  
                  <Button type="submit" className="w-full">
                    Create Request
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Active Requests</CardTitle>
                <CardDescription>Monitor feedback requests</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {requests.map((request) => (
                    <div key={request._id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <Badge variant="outline">{request.category}</Badge>
                        <span className="text-sm text-muted-foreground">
                          {request.targets.length} targets
                        </span>
                      </div>
                      <p className="text-sm font-medium">Recipient: {request.recipient.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Created by: {request.createdBy.name}
                      </p>
                      {request.deadline && (
                        <p className="text-sm text-muted-foreground">
                          Deadline: {new Date(request.deadline).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        </Tabs>

        {/* Feedback Details Modal */}
        {showDetails && selectedSubmission && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-background rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-xl font-semibold">Review Feedback</h2>
                  <Button variant="outline" onClick={() => setShowDetails(false)}>
                    Close
                  </Button>
                </div>
                
                <FeedbackDetails 
                  feedback={selectedSubmission} 
                  showProviderInfo={true}
                  onClose={() => setShowDetails(false)}
                />
                
                <div className="flex justify-end space-x-2 mt-4 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => handleApproveSubmission(
                      selectedSubmission._id, 
                      false
                    )}
                  >
                    Reject
                  </Button>
                  <Button
                    onClick={() => handleApproveSubmission(
                      selectedSubmission._id, 
                      true,
                      selectedSubmission.anonymousRequested
                    )}
                  >
                    Approve
                  </Button>
                  {selectedSubmission.anonymousRequested && (
                    <Button
                      variant="secondary"
                      onClick={() => handleApproveSubmission(
                        selectedSubmission._id, 
                        true,
                        false
                      )}
                    >
                      Approve & Reveal
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
