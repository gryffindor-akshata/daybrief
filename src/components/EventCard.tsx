'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { MapPin, Users, ExternalLink, Loader2 } from 'lucide-react'
import { NormalizedEvent } from '@/lib/calendar/types'
import { SummaryCard } from './SummaryCard'

interface EventCardProps {
  event: NormalizedEvent
  summary?: {
    summaryMd: string
    actionItems: string[]
    confidence: number
    finalized: boolean
  }
  timezone: string
  onSummarize: (event: NormalizedEvent, regenerate?: boolean) => Promise<void>
  isLoading?: boolean
}

export function EventCard({ 
  event, 
  summary, 
  timezone, 
  onSummarize, 
  isLoading = false 
}: EventCardProps) {
  const [isRegenerating, setIsRegenerating] = useState(false)

  const startTime = new Date(event.startsAt).toLocaleTimeString('en-US', {
    timeZone: timezone,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })

  const endTime = new Date(event.endsAt).toLocaleTimeString('en-US', {
    timeZone: timezone,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })

  const isPast = new Date(event.endsAt) < new Date()

  const handleSummarize = async (regenerate = false) => {
    if (regenerate) setIsRegenerating(true)
    try {
      await onSummarize(event, regenerate)
    } finally {
      setIsRegenerating(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant={isPast ? "secondary" : "default"} className="text-xs">
                {startTime} – {endTime}
              </Badge>
              {event.provider === 'google' && (
                <Badge variant="outline" className="text-xs">Google</Badge>
              )}
              {event.provider === 'microsoft' && (
                <Badge variant="outline" className="text-xs">Microsoft</Badge>
              )}
            </div>
            <h3 className="font-semibold text-lg leading-tight mb-2">
              {event.title}
            </h3>
            
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              {event.attendees.length > 0 && (
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <div className="flex items-center gap-1">
                    {event.attendees.slice(0, 3).map((attendee, i) => (
                      <Avatar key={i} className="h-6 w-6">
                        <AvatarFallback className="text-xs">
                          {(attendee.name || attendee.email || '?').charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                    {event.attendees.length > 3 && (
                      <span className="text-xs ml-1">
                        +{event.attendees.length - 3}
                      </span>
                    )}
                  </div>
                </div>
              )}
              
              {(event.location || event.htmlLink) && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {event.htmlLink ? (
                    <a 
                      href={event.htmlLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline flex items-center gap-1"
                    >
                      {event.location || 'Join Meeting'}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    <span>{event.location}</span>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            {!summary ? (
              <Button 
                onClick={() => handleSummarize(false)}
                disabled={isLoading}
                size="sm"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Summarizing...
                  </>
                ) : (
                  'Summarize'
                )}
              </Button>
            ) : (
              <Button 
                onClick={() => handleSummarize(true)}
                disabled={isRegenerating}
                variant="outline"
                size="sm"
              >
                {isRegenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Regenerating...
                  </>
                ) : (
                  'Regenerate'
                )}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      {summary && (
        <CardContent className="pt-0">
          <SummaryCard 
            summary={summary.summaryMd}
            actionItems={summary.actionItems}
            confidence={summary.confidence}
            finalized={summary.finalized}
          />
        </CardContent>
      )}

      {event.description && (
        <CardContent className="pt-0">
          <details className="group">
            <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
              Show event description
            </summary>
            <div className="mt-2 text-sm whitespace-pre-wrap bg-muted/30 p-3 rounded-md">
              {event.description.length > 500 
                ? event.description.substring(0, 500) + '...'
                : event.description
              }
            </div>
          </details>
        </CardContent>
      )}
    </Card>
  )
}
