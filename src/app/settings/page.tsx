'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { HeaderNav } from '@/components/HeaderNav'
import { Badge } from '@/components/ui/badge'
import { Save, Trash2, CheckCircle, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export default function SettingsPage() {
  const { data: session, update } = useSession()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [settings, setSettings] = useState({
    timezone: 'America/Los_Angeles',
    recapEmail: false,
    recapSlack: false,
    slackUserId: '',
  })

  // Load user settings
  useEffect(() => {
    if (session?.user) {
      setSettings({
        timezone: session.user.timezone || 'America/Los_Angeles',
        recapEmail: false, // We'll need to fetch this from user object
        recapSlack: false, // We'll need to fetch this from user object
        slackUserId: '',   // We'll need to fetch this from user object
      })
    }
  }, [session])

  const handleSaveSettings = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/user/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })

      if (!response.ok) {
        throw new Error('Failed to save settings')
      }

      await update() // Refresh session
      toast.success('Settings saved successfully!')
    } catch (error) {
      toast.error('Failed to save settings')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteAllData = async () => {
    if (!confirm('Are you sure you want to delete all your data? This action cannot be undone.')) {
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/user/data', {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete data')
      }

      toast.success('All data deleted successfully')
      router.push('/')
    } catch (error) {
      toast.error('Failed to delete data')
    } finally {
      setIsLoading(false)
    }
  }

  const timezones = [
    'America/Los_Angeles',
    'America/Denver',
    'America/Chicago',
    'America/New_York',
    'Europe/London',
    'Europe/Paris',
    'Asia/Tokyo',
    'Asia/Shanghai',
    'Australia/Sydney',
  ]

  if (!session) {
    return <div>Please sign in to access settings.</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <HeaderNav
        selectedDate={new Date().toISOString().split('T')[0]}
        onDateChange={() => {}}
        onSendRecap={() => {}}
      />

      <main className="container mx-auto px-4 py-6 max-w-2xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Settings</h1>
          <p className="text-muted-foreground">
            Manage your DayBrief preferences and account settings.
          </p>
        </div>

        <div className="space-y-6">
          {/* Account Information */}
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>
                Your connected calendar provider and account details.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Email</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input value={session.user?.email || ''} disabled />
                  <Badge variant={session.user?.provider === 'google' ? 'default' : 'secondary'}>
                    {session.user?.provider === 'google' ? 'Google' : 'Microsoft'}
                  </Badge>
                </div>
              </div>
              <div>
                <Label>Name</Label>
                <Input value={session.user?.name || ''} disabled className="mt-1" />
              </div>
            </CardContent>
          </Card>

          {/* Timezone Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Timezone</CardTitle>
              <CardDescription>
                Choose your timezone for accurate meeting times and schedules.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Label htmlFor="timezone">Timezone</Label>
              <select
                id="timezone"
                value={settings.timezone}
                onChange={(e) => setSettings(prev => ({ ...prev, timezone: e.target.value }))}
                className="w-full mt-1 px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {timezones.map(tz => (
                  <option key={tz} value={tz}>{tz}</option>
                ))}
              </select>
            </CardContent>
          </Card>

          {/* Recap Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Daily Recap</CardTitle>
              <CardDescription>
                Configure how you receive your end-of-day meeting summaries.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Email Recap</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive daily recap via email at 6 PM
                  </p>
                </div>
                <Switch
                  checked={settings.recapEmail}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({ ...prev, recapEmail: checked }))
                  }
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Slack Recap</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive daily recap via Slack DM
                    </p>
                  </div>
                  <Switch
                    checked={settings.recapSlack}
                    onCheckedChange={(checked) => 
                      setSettings(prev => ({ ...prev, recapSlack: checked }))
                    }
                  />
                </div>
                
                {settings.recapSlack && (
                  <div>
                    <Label htmlFor="slackUserId">Slack User ID</Label>
                    <Input
                      id="slackUserId"
                      value={settings.slackUserId}
                      onChange={(e) => 
                        setSettings(prev => ({ ...prev, slackUserId: e.target.value }))
                      }
                      placeholder="U1234567890"
                      className="mt-1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Find your Slack User ID in your Slack profile
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-3">
            <Button 
              onClick={handleSaveSettings}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {isLoading ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>

          {/* Danger Zone */}
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="text-red-600">Danger Zone</CardTitle>
              <CardDescription>
                Irreversible actions that will permanently delete your data.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="destructive"
                onClick={handleDeleteAllData}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Delete All My Data
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
