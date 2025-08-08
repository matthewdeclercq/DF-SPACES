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
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger, SheetFooter } from '@/components/ui/sheet'
import { useSession } from 'next-auth/react'

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
  name: string
  category: string
  questions: string[]
  createdBy: {
    name: string
    email: string
  }
  isArchived?: boolean
}

interface FeedbackRequest {
  _id: string
  category: string
  recipient: {
    name: string
    email: string
  }
  recipients?: Array<{ name: string; email: string }>
  deadline?: string
  createdBy: {
    name: string
    email: string
  }
}

export default function AdminFeedbackPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [appMode, setAppMode] = useState<'mock' | 'real' | null>(null)
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
    name: '',
    category: '',
    questions: ['']
  })
  const [newRequest, setNewRequest] = useState({
    category: '',
    questionSetId: '',
    recipients: [] as string[],
    deadline: ''
  })

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

  useEffect(() => {
    if (appMode === null) return
    if (appMode === 'mock') {
      if (typeof window !== 'undefined') {
        try {
          const storedUser = localStorage.getItem('mockUser')
          if (storedUser) {
            const user = JSON.parse(storedUser)
            setCurrentUser(user)
            setIsAdmin(user.role === 'admin')
            if (user.role !== 'admin') router.push('/profile')
          } else {
            setIsAdmin(false)
          }
        } catch (error) {
          console.error('Error reading from localStorage:', error)
        }
      }
    } else {
      // real mode - rely on next-auth
      if (status === 'authenticated' && session?.user) {
        setIsAdmin(Boolean(session.user.isAdmin) || session.user.role === 'admin')
        setCurrentUser(null)
        if (!(Boolean(session.user.isAdmin) || session.user.role === 'admin')) {
          router.push('/profile')
        }
      } else if (status === 'unauthenticated') {
        router.push('/')
      }
    }
  }, [appMode, session, status, router])

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
        headers: appMode === 'mock' && currentUser ? { 'X-Mock-User': JSON.stringify(currentUser) } : undefined,
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
        headers: appMode === 'mock' && currentUser ? { 'X-Mock-User': JSON.stringify(currentUser) } : undefined,
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
        headers: appMode === 'mock' && currentUser ? { 'X-Mock-User': JSON.stringify(currentUser) } : undefined,
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
          ...(appMode === 'mock' && currentUser ? { 'X-Mock-User': JSON.stringify(currentUser) } : {}),
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
          ...(appMode === 'mock' && currentUser ? { 'X-Mock-User': JSON.stringify(currentUser) } : {}),
        },
        body: JSON.stringify({
          name: newQuestionSet.name,
          category: newQuestionSet.category,
          questions: newQuestionSet.questions.filter(q => q.trim() !== '')
        }),
      })

      if (response.ok) {
        setNewQuestionSet({ name: '', category: '', questions: [''] })
        fetchQuestions()
      }
    } catch (error) {
      console.error('Error creating question set:', error)
    }
  }

  // Users & Projects for typeahead
  interface SimpleUser { _id: string; name: string; email: string }
  interface SimpleProject { _id: string; name: string; members: SimpleUser[] }
  const [users, setUsers] = useState<SimpleUser[]>([])
  const [projects, setProjects] = useState<SimpleProject[]>([])
  const [recipientQuery, setRecipientQuery] = useState('')
  const [showUserDropdown, setShowUserDropdown] = useState(false)

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users', {
        headers: appMode === 'mock' && currentUser ? { 'X-Mock-User': JSON.stringify(currentUser) } : undefined,
      })
      if (res.ok) {
        const data = await res.json()
        setUsers(data)
      }
    } catch (e) {
      console.error('Error fetching users:', e)
    }
  }

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/projects')
      if (res.ok) {
        const data = await res.json()
        const simplified: SimpleProject[] = data.map((p: any) => ({ _id: p._id, name: p.name, members: p.members }))
        setProjects(simplified)
      }
    } catch (e) {
      console.error('Error fetching projects:', e)
    }
  }

  useEffect(() => {
    if (isAdmin) {
      fetchUsers()
      fetchProjects()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin])

  const selectedRecipientUsers: SimpleUser[] = newRequest.recipients
    .map(id => users.find(u => u._id === id))
    .filter(Boolean) as SimpleUser[]

  const filteredUsers = users
    .filter(u => !newRequest.recipients.includes(u._id))
    .filter(u => {
      const q = recipientQuery.trim().toLowerCase()
      if (!q) return true
      return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    })
    .slice(0, 8)

  const addRecipient = (id: string) => {
    setNewRequest(prev => ({ ...prev, recipients: Array.from(new Set([...prev.recipients, id])) }))
    setRecipientQuery('')
    setShowUserDropdown(false)
  }

  const removeRecipient = (id: string) => {
    setNewRequest(prev => ({ ...prev, recipients: prev.recipients.filter(r => r !== id) }))
  }

  const addProjectTeam = (projectId: string) => {
    const proj = projects.find(p => p._id === projectId)
    if (!proj) return
    const memberIds = proj.members.map(m => m._id)
    setNewRequest(prev => ({ ...prev, recipients: Array.from(new Set([...prev.recipients, ...memberIds])) }))
  }

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/feedback/requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(appMode === 'mock' && currentUser ? { 'X-Mock-User': JSON.stringify(currentUser) } : {}),
        },
        body: JSON.stringify({
          category: newRequest.category,
          questionSetId: newRequest.questionSetId,
          recipients: newRequest.recipients,
          deadline: newRequest.deadline || undefined
        }),
      })

      if (response.ok) {
        setNewRequest({
          category: '',
          questionSetId: '',
          recipients: [],
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

  // Edit state per question set
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<{ name: string; questions: string[] }>({ name: '', questions: [] })
  const [isSavingEdit, setIsSavingEdit] = useState(false)
  const [isArchivingId, setIsArchivingId] = useState<string | null>(null)
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false)

  const startEdit = (qs: FeedbackQuestion) => {
    setEditingId(qs._id)
    setEditForm({ name: qs.name, questions: [...qs.questions] })
    setIsEditSheetOpen(true)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditForm({ name: '', questions: [] })
    setIsEditSheetOpen(false)
  }

  const saveEdit = async (id: string) => {
    try {
      setIsSavingEdit(true)
      const response = await fetch(`/api/question-sets/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(appMode === 'mock' && currentUser ? { 'X-Mock-User': JSON.stringify(currentUser) } : {}),
        },
        body: JSON.stringify({
          name: editForm.name,
          questions: editForm.questions.filter(q => q.trim() !== '')
        })
      })
      if (response.ok) {
        cancelEdit()
        fetchQuestions()
      } else {
        let message = 'Failed to save changes'
        try {
          const data = await response.json()
          if (data?.error) message = data.error
        } catch {}
        alert(message)
      }
    } catch (error) {
      console.error('Error saving question set:', error)
      alert('Error saving question set')
    } finally {
      setIsSavingEdit(false)
    }
  }

  const addEditQuestion = () => {
    setEditForm(prev => ({ ...prev, questions: [...prev.questions, ''] }))
  }

  const removeEditQuestion = (index: number) => {
    setEditForm(prev => ({ ...prev, questions: prev.questions.filter((_, i) => i !== index) }))
  }

  const updateEditQuestion = (index: number, value: string) => {
    setEditForm(prev => ({ ...prev, questions: prev.questions.map((q, i) => i === index ? value : q) }))
  }

  const archiveQuestionSet = async (id: string) => {
    try {
      setIsArchivingId(id)
      const response = await fetch(`/api/question-sets/${id}`, {
        method: 'DELETE',
        headers: appMode === 'mock' && currentUser ? { 'X-Mock-User': JSON.stringify(currentUser) } : undefined,
      })
      if (response.ok) {
        fetchQuestions()
      } else {
        let message = 'Failed to archive question set'
        try {
          const data = await response.json()
          if (data?.error) message = data.error
        } catch {}
        alert(message)
      }
    } catch (error) {
      console.error('Error archiving question set:', error)
      alert('Error archiving question set')
    } finally {
      setIsArchivingId(null)
    }
  }

  const restoreQuestionSet = async (id: string) => {
    try {
      setIsArchivingId(id)
      const response = await fetch(`/api/question-sets/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(appMode === 'mock' && currentUser ? { 'X-Mock-User': JSON.stringify(currentUser) } : {}),
        },
        body: JSON.stringify({ restore: true })
      })
      if (response.ok) {
        fetchQuestions()
      } else {
        let message = 'Failed to restore question set'
        try {
          const data = await response.json()
          if (data?.error) message = data.error
        } catch {}
        alert(message)
      }
    } catch (error) {
      console.error('Error restoring question set:', error)
      alert('Error restoring question set')
    } finally {
      setIsArchivingId(null)
    }
  }

  const restoreVersion = async (questionSetId: string, version: number) => {
    try {
      const response = await fetch(`/api/question-sets/versions/${questionSetId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(appMode === 'mock' && currentUser ? { 'X-Mock-User': JSON.stringify(currentUser) } : {}),
        },
        body: JSON.stringify({ version })
      })
      if (response.ok) {
        fetchQuestions()
        // Close version history
        setExpandedVersions(prev => ({ ...prev, [questionSetId]: false }))
      } else {
        let message = 'Failed to restore version'
        try {
          const data = await response.json()
          if (data?.error) message = data.error
        } catch {}
        alert(message)
      }
    } catch (error) {
      console.error('Error restoring version:', error)
      alert('Error restoring version')
    }
  }

  // Version history state
  const [expandedVersions, setExpandedVersions] = useState<Record<string, boolean>>({})
  const [versionsById, setVersionsById] = useState<Record<string, Array<{ version: number; name: string; questions: string[]; updatedBy?: { name: string; email: string }; updatedAt: string }>>>({})

  const toggleVersions = async (id: string) => {
    const expanded = !expandedVersions[id]
    setExpandedVersions(prev => ({ ...prev, [id]: expanded }))
    if (expanded && !versionsById[id]) {
      try {
        const res = await fetch(`/api/question-sets/versions/${id}`, {
          headers: appMode === 'mock' && currentUser ? { 'X-Mock-User': JSON.stringify(currentUser) } : undefined,
        })
        if (res.ok) {
          const data = await res.json()
          setVersionsById(prev => ({ ...prev, [id]: data }))
        }
      } catch (error) {
        console.error('Error loading versions:', error)
      }
    }
  }

  if (!isAdmin) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
            <p className="text-muted-foreground">Admin access required</p>
            {appMode === 'mock' && (
              <p className="text-sm text-muted-foreground mt-2">Tip: Sign in as Sarah Admin in mock mode.</p>
            )}
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
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold">Question Sets</h2>
              <p className="text-muted-foreground">Create and manage feedback question sets</p>
            </div>
            <Sheet>
              <SheetTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-1" /> New Question Set
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <SheetHeader>
                  <SheetTitle>Create Question Set</SheetTitle>
                  <SheetDescription>Draft a new set of feedback questions</SheetDescription>
                </SheetHeader>
                <form onSubmit={handleCreateQuestionSet} className="space-y-4 mt-4">
                  <div>
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={newQuestionSet.name}
                      onChange={(e) => setNewQuestionSet(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Q1 2025 Company Pulse"
                      required
                    />
                  </div>
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
                  <SheetFooter>
                    <Button type="submit" className="w-full">Create Question Set</Button>
                  </SheetFooter>
                </form>
              </SheetContent>
            </Sheet>
          </div>

          <div className="space-y-8">
            {/* Company Question Sets */}
            <div>
              <h3 className="text-xl font-semibold mb-4">Company</h3>
              <div className="space-y-4">
                {questions.filter(q => q.category === 'company').map((questionSet) => (
                  <Card key={questionSet._id}>
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <div className="font-semibold text-lg">{questionSet.name}</div>
                          <div className="flex items-center gap-2 mt-1">
                            {questionSet.isArchived && (
                              <Badge variant="secondary">Archived</Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {!questionSet.isArchived && (
                            <Button type="button" size="sm" variant="outline" onClick={() => startEdit(questionSet)}>Edit</Button>
                          )}
                          {!questionSet.isArchived && (
                            <Button type="button" size="sm" variant="destructive" onClick={() => archiveQuestionSet(questionSet._id)} disabled={isArchivingId === questionSet._id}>
                              {isArchivingId === questionSet._id ? 'Archiving…' : 'Archive'}
                            </Button>
                          )}
                          {questionSet.isArchived && (
                            <Button type="button" size="sm" variant="outline" onClick={() => restoreQuestionSet(questionSet._id)} disabled={isArchivingId === questionSet._id}>
                              {isArchivingId === questionSet._id ? 'Restoring…' : 'Restore'}
                            </Button>
                          )}
                          <Button type="button" size="sm" variant="ghost" onClick={() => toggleVersions(questionSet._id)}>Version History</Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        {questionSet.questions.map((question, index) => (
                          <p key={index} className="text-sm text-muted-foreground">
                            {index + 1}. {question}
                          </p>
                        ))}
                      </div>

                      {/* Edit Sheet */}
                      <Sheet open={isEditSheetOpen && editingId === questionSet._id} onOpenChange={(open: boolean) => { if (!open) cancelEdit() }}>
                        <SheetContent side="right">
                          <SheetHeader>
                            <SheetTitle>Edit Question Set</SheetTitle>
                            <SheetDescription>Update the name and questions; a new version will be saved.</SheetDescription>
                          </SheetHeader>
                          <div className="space-y-4 mt-4">
                            <div>
                              <Label>Name</Label>
                              <Input value={editForm.name} onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))} />
                            </div>
                            <div>
                              <Label>Questions</Label>
                              <div className="space-y-2">
                                {editForm.questions.map((q, idx) => (
                                  <div key={idx} className="flex gap-2">
                                    <Textarea value={q} onChange={(e) => updateEditQuestion(idx, e.target.value)} />
                                    {editForm.questions.length > 1 && (
                                      <Button type="button" variant="outline" size="sm" onClick={() => removeEditQuestion(idx)}>Remove</Button>
                                    )}
                                  </div>
                                ))}
                              </div>
                              <Button type="button" variant="outline" className="mt-2" onClick={addEditQuestion}>Add Question</Button>
                            </div>
                            <SheetFooter>
                              <Button type="button" onClick={() => saveEdit(questionSet._id)} disabled={isSavingEdit}>
                                {isSavingEdit ? 'Saving…' : 'Save Changes'}
                              </Button>
                              <Button type="button" variant="outline" onClick={cancelEdit} disabled={isSavingEdit}>Cancel</Button>
                            </SheetFooter>
                          </div>
                        </SheetContent>
                      </Sheet>

                      {expandedVersions[questionSet._id] && versionsById[questionSet._id] && (
                        <div className="mt-4 border-t pt-3">
                          <div className="text-sm font-medium mb-2">Version History</div>
                          <div className="space-y-2">
                            {versionsById[questionSet._id].map((v) => (
                              <div key={v.version} className="text-sm text-muted-foreground">
                                <div className="flex justify-between">
                                  <span>v{v.version} — {v.name}</span>
                                  <span>{new Date(v.updatedAt).toLocaleString()}</span>
                                </div>
                                <div>Updated by: {v.updatedBy?.name} ({v.updatedBy?.email})</div>
                                <Button type="button" variant="outline" size="sm" onClick={() => restoreVersion(questionSet._id, v.version)} disabled={isArchivingId === questionSet._id}>
                                  Restore v{v.version}
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
                {questions.filter(q => q.category === 'company').length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No company question sets yet
                  </div>
                )}
              </div>
            </div>

            {/* Project Question Sets */}
            <div>
              <h3 className="text-xl font-semibold mb-4">Project</h3>
              <div className="space-y-4">
                {questions.filter(q => q.category === 'project').map((questionSet) => (
                  <Card key={questionSet._id}>
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <div className="font-semibold text-lg">{questionSet.name}</div>
                          <div className="flex items-center gap-2 mt-1">
                            {questionSet.isArchived && (
                              <Badge variant="secondary">Archived</Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {!questionSet.isArchived && (
                            <Button type="button" size="sm" variant="outline" onClick={() => startEdit(questionSet)}>Edit</Button>
                          )}
                          {!questionSet.isArchived && (
                            <Button type="button" size="sm" variant="destructive" onClick={() => archiveQuestionSet(questionSet._id)} disabled={isArchivingId === questionSet._id}>
                              {isArchivingId === questionSet._id ? 'Archiving…' : 'Archive'}
                            </Button>
                          )}
                          {questionSet.isArchived && (
                            <Button type="button" size="sm" variant="outline" onClick={() => restoreQuestionSet(questionSet._id)} disabled={isArchivingId === questionSet._id}>
                              {isArchivingId === questionSet._id ? 'Restoring…' : 'Restore'}
                            </Button>
                          )}
                          <Button type="button" size="sm" variant="ghost" onClick={() => toggleVersions(questionSet._id)}>Version History</Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        {questionSet.questions.map((question, index) => (
                          <p key={index} className="text-sm text-muted-foreground">
                            {index + 1}. {question}
                          </p>
                        ))}
                      </div>

                      {/* Edit Sheet */}
                      <Sheet open={isEditSheetOpen && editingId === questionSet._id} onOpenChange={(open: boolean) => { if (!open) cancelEdit() }}>
                        <SheetContent side="right">
                          <SheetHeader>
                            <SheetTitle>Edit Question Set</SheetTitle>
                            <SheetDescription>Update the name and questions; a new version will be saved.</SheetDescription>
                          </SheetHeader>
                          <div className="space-y-4 mt-4">
                            <div>
                              <Label>Name</Label>
                              <Input value={editForm.name} onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))} />
                            </div>
                            <div>
                              <Label>Questions</Label>
                              <div className="space-y-2">
                                {editForm.questions.map((q, idx) => (
                                  <div key={idx} className="flex gap-2">
                                    <Textarea value={q} onChange={(e) => updateEditQuestion(idx, e.target.value)} />
                                    {editForm.questions.length > 1 && (
                                      <Button type="button" variant="outline" size="sm" onClick={() => removeEditQuestion(idx)}>Remove</Button>
                                    )}
                                  </div>
                                ))}
                              </div>
                              <Button type="button" variant="outline" className="mt-2" onClick={addEditQuestion}>Add Question</Button>
                            </div>
                            <SheetFooter>
                              <Button type="button" onClick={() => saveEdit(questionSet._id)} disabled={isSavingEdit}>
                                {isSavingEdit ? 'Saving…' : 'Save Changes'}
                              </Button>
                              <Button type="button" variant="outline" onClick={cancelEdit} disabled={isSavingEdit}>Cancel</Button>
                            </SheetFooter>
                          </div>
                        </SheetContent>
                      </Sheet>

                      {expandedVersions[questionSet._id] && versionsById[questionSet._id] && (
                        <div className="mt-4 border-t pt-3">
                          <div className="text-sm font-medium mb-2">Version History</div>
                          <div className="space-y-2">
                            {versionsById[questionSet._id].map((v) => (
                              <div key={v.version} className="text-sm text-muted-foreground">
                                <div className="flex justify-between">
                                  <span>v{v.version} — {v.name}</span>
                                  <span>{new Date(v.updatedAt).toLocaleString()}</span>
                                </div>
                                <div>Updated by: {v.updatedBy?.name} ({v.updatedBy?.email})</div>
                                <Button type="button" variant="outline" size="sm" onClick={() => restoreVersion(questionSet._id, v.version)} disabled={isArchivingId === questionSet._id}>
                                  Restore v{v.version}
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
                {questions.filter(q => q.category === 'project').length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No project question sets yet
                  </div>
                )}
              </div>
            </div>

            {/* Coworkers Question Sets */}
            <div>
              <h3 className="text-xl font-semibold mb-4">Coworkers</h3>
              <div className="space-y-4">
                {questions.filter(q => q.category === 'coworkers').map((questionSet) => (
                  <Card key={questionSet._id}>
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <div className="font-semibold text-lg">{questionSet.name}</div>
                          <div className="flex items-center gap-2 mt-1">
                            {questionSet.isArchived && (
                              <Badge variant="secondary">Archived</Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {!questionSet.isArchived && (
                            <Button type="button" size="sm" variant="outline" onClick={() => startEdit(questionSet)}>Edit</Button>
                          )}
                          {!questionSet.isArchived && (
                            <Button type="button" size="sm" variant="destructive" onClick={() => archiveQuestionSet(questionSet._id)} disabled={isArchivingId === questionSet._id}>
                              {isArchivingId === questionSet._id ? 'Archiving…' : 'Archive'}
                            </Button>
                          )}
                          {questionSet.isArchived && (
                            <Button type="button" size="sm" variant="outline" onClick={() => restoreQuestionSet(questionSet._id)} disabled={isArchivingId === questionSet._id}>
                              {isArchivingId === questionSet._id ? 'Restoring…' : 'Restore'}
                            </Button>
                          )}
                          <Button type="button" size="sm" variant="ghost" onClick={() => toggleVersions(questionSet._id)}>Version History</Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        {questionSet.questions.map((question, index) => (
                          <p key={index} className="text-sm text-muted-foreground">
                            {index + 1}. {question}
                          </p>
                        ))}
                      </div>

                      {/* Edit Sheet */}
                      <Sheet open={isEditSheetOpen && editingId === questionSet._id} onOpenChange={(open: boolean) => { if (!open) cancelEdit() }}>
                        <SheetContent side="right">
                          <SheetHeader>
                            <SheetTitle>Edit Question Set</SheetTitle>
                            <SheetDescription>Update the name and questions; a new version will be saved.</SheetDescription>
                          </SheetHeader>
                          <div className="space-y-4 mt-4">
                            <div>
                              <Label>Name</Label>
                              <Input value={editForm.name} onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))} />
                            </div>
                            <div>
                              <Label>Questions</Label>
                              <div className="space-y-2">
                                {editForm.questions.map((q, idx) => (
                                  <div key={idx} className="flex gap-2">
                                    <Textarea value={q} onChange={(e) => updateEditQuestion(idx, e.target.value)} />
                                    {editForm.questions.length > 1 && (
                                      <Button type="button" variant="outline" size="sm" onClick={() => removeEditQuestion(idx)}>Remove</Button>
                                    )}
                                  </div>
                                ))}
                              </div>
                              <Button type="button" variant="outline" className="mt-2" onClick={addEditQuestion}>Add Question</Button>
                            </div>
                            <SheetFooter>
                              <Button type="button" onClick={() => saveEdit(questionSet._id)} disabled={isSavingEdit}>
                                {isSavingEdit ? 'Saving…' : 'Save Changes'}
                              </Button>
                              <Button type="button" variant="outline" onClick={cancelEdit} disabled={isSavingEdit}>Cancel</Button>
                            </SheetFooter>
                          </div>
                        </SheetContent>
                      </Sheet>

                      {expandedVersions[questionSet._id] && versionsById[questionSet._id] && (
                        <div className="mt-4 border-t pt-3">
                          <div className="text-sm font-medium mb-2">Version History</div>
                          <div className="space-y-2">
                            {versionsById[questionSet._id].map((v) => (
                              <div key={v.version} className="text-sm text-muted-foreground">
                                <div className="flex justify-between">
                                  <span>v{v.version} — {v.name}</span>
                                  <span>{new Date(v.updatedAt).toLocaleString()}</span>
                                </div>
                                <div>Updated by: {v.updatedBy?.name} ({v.updatedBy?.email})</div>
                                <Button type="button" variant="outline" size="sm" onClick={() => restoreVersion(questionSet._id, v.version)} disabled={isArchivingId === questionSet._id}>
                                  Restore v{v.version}
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
                {questions.filter(q => q.category === 'coworkers').length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No coworkers question sets yet
                  </div>
                )}
              </div>
            </div>

            {/* Self Reflection Question Sets */}
            <div>
              <h3 className="text-xl font-semibold mb-4">Self Reflection</h3>
              <div className="space-y-4">
                {questions.filter(q => q.category === 'self').map((questionSet) => (
                  <Card key={questionSet._id}>
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <div className="font-semibold text-lg">{questionSet.name}</div>
                          <div className="flex items-center gap-2 mt-1">
                            {questionSet.isArchived && (
                              <Badge variant="secondary">Archived</Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {!questionSet.isArchived && (
                            <Button type="button" size="sm" variant="outline" onClick={() => startEdit(questionSet)}>Edit</Button>
                          )}
                          {!questionSet.isArchived && (
                            <Button type="button" size="sm" variant="destructive" onClick={() => archiveQuestionSet(questionSet._id)} disabled={isArchivingId === questionSet._id}>
                              {isArchivingId === questionSet._id ? 'Archiving…' : 'Archive'}
                            </Button>
                          )}
                          {questionSet.isArchived && (
                            <Button type="button" size="sm" variant="outline" onClick={() => restoreQuestionSet(questionSet._id)} disabled={isArchivingId === questionSet._id}>
                              {isArchivingId === questionSet._id ? 'Restoring…' : 'Restore'}
                            </Button>
                          )}
                          <Button type="button" size="sm" variant="ghost" onClick={() => toggleVersions(questionSet._id)}>Version History</Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        {questionSet.questions.map((question, index) => (
                          <p key={index} className="text-sm text-muted-foreground">
                            {index + 1}. {question}
                          </p>
                        ))}
                      </div>

                      {/* Edit Sheet */}
                      <Sheet open={isEditSheetOpen && editingId === questionSet._id} onOpenChange={(open: boolean) => { if (!open) cancelEdit() }}>
                        <SheetContent side="right">
                          <SheetHeader>
                            <SheetTitle>Edit Question Set</SheetTitle>
                            <SheetDescription>Update the name and questions; a new version will be saved.</SheetDescription>
                          </SheetHeader>
                          <div className="space-y-4 mt-4">
                            <div>
                              <Label>Name</Label>
                              <Input value={editForm.name} onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))} />
                            </div>
                            <div>
                              <Label>Questions</Label>
                              <div className="space-y-2">
                                {editForm.questions.map((q, idx) => (
                                  <div key={idx} className="flex gap-2">
                                    <Textarea value={q} onChange={(e) => updateEditQuestion(idx, e.target.value)} />
                                    {editForm.questions.length > 1 && (
                                      <Button type="button" variant="outline" size="sm" onClick={() => removeEditQuestion(idx)}>Remove</Button>
                                    )}
                                  </div>
                                ))}
                              </div>
                              <Button type="button" variant="outline" className="mt-2" onClick={addEditQuestion}>Add Question</Button>
                            </div>
                            <SheetFooter>
                              <Button type="button" onClick={() => saveEdit(questionSet._id)} disabled={isSavingEdit}>
                                {isSavingEdit ? 'Saving…' : 'Save Changes'}
                              </Button>
                              <Button type="button" variant="outline" onClick={cancelEdit} disabled={isSavingEdit}>Cancel</Button>
                            </SheetFooter>
                          </div>
                        </SheetContent>
                      </Sheet>

                      {expandedVersions[questionSet._id] && versionsById[questionSet._id] && (
                        <div className="mt-4 border-t pt-3">
                          <div className="text-sm font-medium mb-2">Version History</div>
                          <div className="space-y-2">
                            {versionsById[questionSet._id].map((v) => (
                              <div key={v.version} className="text-sm text-muted-foreground">
                                <div className="flex justify-between">
                                  <span>v{v.version} — {v.name}</span>
                                  <span>{new Date(v.updatedAt).toLocaleString()}</span>
                                </div>
                                <div>Updated by: {v.updatedBy?.name} ({v.updatedBy?.email})</div>
                                <Button type="button" variant="outline" size="sm" onClick={() => restoreVersion(questionSet._id, v.version)} disabled={isArchivingId === questionSet._id}>
                                  Restore v{v.version}
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
                {questions.filter(q => q.category === 'self').length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No self reflection question sets yet
                  </div>
                )}
              </div>
            </div>
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
                    <Label>Recipients</Label>
                    <div className="border rounded-md p-2">
                      <div className="flex flex-wrap gap-2 mb-2">
                        {selectedRecipientUsers.map(u => (
                          <span key={u._id} className="inline-flex items-center gap-2 bg-muted rounded px-2 py-1 text-sm">
                            {u.name} <span className="text-muted-foreground">({u.email})</span>
                            <button type="button" className="text-xs" onClick={() => removeRecipient(u._id)}>✕</button>
                          </span>
                        ))}
                        {selectedRecipientUsers.length === 0 && (
                          <span className="text-sm text-muted-foreground">No recipients selected</span>
                        )}
                      </div>
                      <div className="relative">
                        <Input
                          placeholder="Search users by name or email"
                          value={recipientQuery}
                          onChange={(e) => { setRecipientQuery(e.target.value); setShowUserDropdown(true) }}
                          onFocus={() => setShowUserDropdown(true)}
                        />
                        {showUserDropdown && (
                          <div className="absolute z-10 mt-1 w-full bg-background border rounded-md max-h-60 overflow-auto" onMouseLeave={() => setShowUserDropdown(false)}>
                            {filteredUsers.length > 0 ? (
                              filteredUsers.map(u => (
                                <button
                                  type="button"
                                  key={u._id}
                                  className="w-full text-left px-3 py-2 hover:bg-accent"
                                  onClick={() => addRecipient(u._id)}
                                >
                                  <div className="font-medium">{u.name}</div>
                                  <div className="text-xs text-muted-foreground">{u.email}</div>
                                </button>
                              ))
                            ) : (
                              <div className="px-3 py-2 text-sm text-muted-foreground">No matches</div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label>Add by Project Team</Label>
                    <div className="flex gap-2 items-center">
                      <select
                        className="p-2 border border-input rounded-md bg-background flex-1"
                        onChange={(e) => addProjectTeam(e.target.value)}
                        value=""
                      >
                        <option value="" disabled>Add a project…</option>
                        {projects.map(p => (
                          <option key={p._id} value={p._id}>{p.name} Team ({p.members.length})</option>
                        ))}
                      </select>
                      <Button type="button" variant="outline" onClick={() => fetchProjects()}>Refresh</Button>
                    </div>
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
                        {/* Targets removed; show recipients implicitly by singular rows or count if needed */}
                      </div>
                      <p className="text-sm font-medium">
                        {request.recipient ? (
                          <>Recipient: {request.recipient.name}</>
                        ) : (
                          <>Recipients: {(request.recipients || []).map(r => r.name).join(', ') || '—'}</>
                        )}
                      </p>
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
