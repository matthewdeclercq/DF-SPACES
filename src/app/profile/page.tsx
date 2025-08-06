'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import Layout from '@/components/Layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { useMockAuth } from '@/hooks/useMockAuth'
import { mockAuth } from '@/lib/mock-auth'

const profileSchema = z.object({
  bio: z.string().max(500, 'Bio must be less than 500 characters'),
  interests: z.string().max(200, 'Interests must be less than 200 characters'),
  avatar: z.string().url('Must be a valid URL').optional().or(z.literal('')),
})

type ProfileFormData = z.infer<typeof profileSchema>

interface UserProfile {
  bio: string
  interests: string[]
  avatar: string | undefined
}

export default function ProfilePage() {
  const { data: session, status } = useMockAuth()
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      bio: '',
      interests: '',
      avatar: '',
    },
  })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/')
    }
  }, [status, router])

  useEffect(() => {
    if (session?.user?.id) {
      fetchProfile()
    }
  }, [session])

  const fetchProfile = async () => {
    try {
      // Simulate API call with mock data
      const currentSession = mockAuth.getSession()
      if (currentSession?.user) {
        const userProfile = {
          bio: currentSession.user.bio || '',
          interests: currentSession.user.interests || [],
          avatar: currentSession.user.avatar || '',
        }
        setProfile(userProfile)
        form.reset({
          bio: userProfile.bio,
          interests: userProfile.interests.join(', '),
          avatar: userProfile.avatar || '',
        })
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const onSubmit = async (data: ProfileFormData) => {
    if (!session?.user?.id) return

    setIsSaving(true)
    try {
      const interests = data.interests
        .split(',')
        .map(interest => interest.trim())
        .filter(interest => interest.length > 0)

      // Update mock user data
      const currentSession = mockAuth.getSession()
      if (currentSession?.user) {
        currentSession.user.bio = data.bio
        currentSession.user.interests = interests
        currentSession.user.avatar = data.avatar
        
        // Update localStorage
        localStorage.setItem('mockUser', JSON.stringify(currentSession.user))
        
        // Update profile state
        setProfile({
          bio: data.bio,
          interests,
          avatar: data.avatar,
        })
      }
    } catch (error) {
      console.error('Error updating profile:', error)
    } finally {
      setIsSaving(false)
    }
  }

  if (status === 'loading' || isLoading) {
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
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>
              Customize your profile information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                {session.user.avatar ? (
                  <img
                    src={session.user.avatar}
                    alt={session.user.name || ''}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <span className="text-2xl font-bold text-primary">
                    {session.user.name?.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div>
                <h3 className="text-lg font-semibold">{session.user.name}</h3>
                <p className="text-muted-foreground">{session.user.email}</p>
                <p className="text-sm text-primary font-medium capitalize">{session.user.role}</p>
              </div>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="avatar"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Avatar URL</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://example.com/avatar.jpg"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bio</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Tell us about yourself..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="interests"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Interests</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Technology, Design, Music (comma-separated)"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" disabled={isSaving} className="w-full">
                  {isSaving ? 'Saving...' : 'Save Profile'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
} 