'use client'

import { signIn, getProviders } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, Chrome, User } from 'lucide-react'
import Link from 'next/link'

interface Provider {
  id: string
  name: string
  type: string
  signinUrl: string
  callbackUrl: string
}

export default function SignInPage() {
  const [providers, setProviders] = useState<Record<string, Provider> | null>(null)
  const [isLoading, setIsLoading] = useState('')

  useEffect(() => {
    getProviders().then(setProviders)
  }, [])

  const handleSignIn = async (providerId: string) => {
    setIsLoading(providerId)
    try {
      await signIn(providerId, { callbackUrl: '/' })
    } catch (error) {
      console.error('Sign in error:', error)
    } finally {
      setIsLoading('')
    }
  }

  const getProviderIcon = (providerId: string) => {
    switch (providerId) {
      case 'google':
        return <Chrome className="h-5 w-5" />
      case 'microsoft':
        return <User className="h-5 w-5" />
      default:
        return <User className="h-5 w-5" />
    }
  }

  const getProviderDescription = (providerId: string) => {
    switch (providerId) {
      case 'google':
        return 'Connect your Google Calendar to get started with AI meeting summaries.'
      case 'microsoft':
        return 'Connect your Microsoft Outlook calendar to get started with AI meeting summaries.'
      default:
        return 'Connect your calendar to get started.'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <Calendar className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">DayBrief</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Sign in to your account
          </h1>
          <p className="text-gray-600">
            Choose your calendar provider to continue
          </p>
        </div>

        <div className="space-y-4">
          {providers ? (
            Object.values(providers).map((provider) => (
              <Card key={provider.id} className="transition-shadow hover:shadow-md">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-3 text-lg">
                    {getProviderIcon(provider.id)}
                    Continue with {provider.name}
                  </CardTitle>
                  <CardDescription>
                    {getProviderDescription(provider.id)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={() => handleSignIn(provider.id)}
                    disabled={isLoading === provider.id}
                    className="w-full"
                    size="lg"
                  >
                    {isLoading === provider.id ? 'Connecting...' : `Connect ${provider.name}`}
                  </Button>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading sign-in options...</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600">
            By signing in, you agree to our terms and privacy policy.
            <br />
            We only request read-only access to your calendar.
          </p>
        </div>
      </div>
    </div>
  )
}
