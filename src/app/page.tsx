'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { HeaderNav } from '@/components/HeaderNav'
import { EventCard } from '@/components/EventCard'
import { NormalizedEvent } from '@/lib/calendar/types'
import { Button } from '@/components/ui/button'
import { Calendar, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

interface Summary {
  id: string
  eventId: string
  summaryMd: string
  actionItems: string[]
  confidence: number
  finalized: boolean
}

export default function TodayPage() {
  const { data: session, status } = useSession()
  const [selectedDate, setSelectedDate] = useState(() => 
    new Date().toISOString().split('T')[0]
  )
  const queryClient = useQueryClient()

  // Fetch events for the selected date
  const { data: eventsData, isLoading: isLoadingEvents, error: eventsError, refetch } = useQuery({
    queryKey: ['events', selectedDate],
    queryFn: async () => {
      const response = await fetch(`/api/events?date=${selectedDate}`)
      if (!response.ok) {
        throw new Error('Failed to fetch events')
      }
      return response.json()
    },
    enabled: !!session,
  })

  // Fetch summaries for the selected date
  const { data: summariesData } = useQuery({
    queryKey: ['summaries', selectedDate],
    queryFn: async () => {
      const response = await fetch(`/api/summaries?date=${selectedDate}`)
      if (!response.ok) {
        throw new Error('Failed to fetch summaries')
      }
      return response.json()
    },
    enabled: !!session,
  })

  // Summarize mutation
  const summarizeMutation = useMutation({
    mutationFn: async ({ event, regenerate = false }: { event: NormalizedEvent, regenerate?: boolean }) => {
      const response = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event, regenerate }),
      })
      if (!response.ok) {
        throw new Error('Failed to generate summary')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['summaries', selectedDate] })
      toast.success('Summary generated successfully!')
    },
    onError: (error) => {
      toast.error(`Failed to generate summary: ${error.message}`)
    },
  })

  // Send recap mutation
  const recapMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/recap/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: selectedDate }),
      })
      if (!response.ok) {
        throw new Error('Failed to send recap')
      }
      return response.json()
    },
    onSuccess: (data) => {
      const methods = data.sentTo.join(' and ')
      toast.success(`Recap sent via ${methods || 'preview generated'}!`)
    },
    onError: (error) => {
      toast.error(`Failed to send recap: ${error.message}`)
    },
  })

  const handleSummarize = async (event: NormalizedEvent, regenerate = false) => {
    await summarizeMutation.mutateAsync({ event, regenerate })
  }

  const handleSendRecap = () => {
    recapMutation.mutate()
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center max-w-md mx-auto p-8">
          <Calendar className="h-16 w-16 text-blue-600 mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Welcome to DayBrief</h1>
          <p className="text-gray-600 mb-8">
            Get AI-powered summaries of your daily meetings with smart action item extraction.
          </p>
          <Link href="/auth/signin">
            <Button size="lg" className="w-full">
              Sign In to Get Started
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const events: NormalizedEvent[] = eventsData?.events || []
  const summaries: Summary[] = summariesData?.summaries || []
  
  // Create a map of summaries by eventId
  const summaryMap = summaries.reduce((acc, summary) => {
    acc[summary.eventId] = summary
    return acc
  }, {} as Record<string, Summary>)

  return (
    <div className="min-h-screen bg-gray-50">
      <HeaderNav
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        onSendRecap={handleSendRecap}
        isRecapLoading={recapMutation.isPending}
      />

      <main className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {selectedDate === new Date().toISOString().split('T')[0] 
                  ? 'Today\'s Meetings' 
                  : `Meetings for ${new Date(selectedDate).toLocaleDateString()}`
                }
              </h1>
              {events.length > 0 && (
                <p className="text-muted-foreground mt-1">
                  {events.length} meeting{events.length !== 1 ? 's' : ''} found
                </p>
              )}
            </div>
            
            <Button
              onClick={() => refetch()}
              disabled={isLoadingEvents}
              variant="outline"
              size="sm"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingEvents ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {isLoadingEvents ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-white rounded-lg animate-pulse" />
            ))}
          </div>
        ) : eventsError ? (
          <div className="text-center py-12">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
              <h3 className="font-medium text-red-800 mb-2">Failed to load events</h3>
              <p className="text-red-600 text-sm mb-4">
                {eventsError.message || 'There was an error fetching your calendar events.'}
              </p>
              <Button onClick={() => refetch()} variant="outline" size="sm">
                Try Again
              </Button>
            </div>
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-medium text-gray-900 mb-2">No meetings today 🎉</h3>
            <p className="text-muted-foreground">
              Enjoy your free time or check a different date.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {events.map((event) => (
              <EventCard
                key={`${event.provider}-${event.id}`}
                event={event}
                summary={summaryMap[event.id]}
                timezone={session?.user?.timezone || 'America/Los_Angeles'}
                onSummarize={handleSummarize}
                isLoading={summarizeMutation.isPending}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}