import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0]
    
    const localDate = new Date(date + 'T00:00:00')

    const summaries = await prisma.summary.findMany({
      where: {
        userId: user.id,
        date: localDate,
      },
      orderBy: {
        startsAt: 'asc',
      },
    })

    const formattedSummaries = summaries.map(summary => ({
      id: summary.id,
      eventId: summary.eventId,
      provider: summary.provider,
      title: summary.title,
      startsAt: summary.startsAt.toISOString(),
      endsAt: summary.endsAt.toISOString(),
      attendees: JSON.parse(summary.attendees),
      location: summary.location,
      summaryMd: summary.summaryMd,
      actionItems: JSON.parse(summary.actionItems),
      confidence: summary.confidence,
      finalized: summary.finalized,
      createdAt: summary.createdAt.toISOString(),
      updatedAt: summary.updatedAt.toISOString(),
    }))

    return NextResponse.json({ summaries: formattedSummaries })
  } catch (error) {
    console.error('Summaries API error:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch summaries' 
    }, { status: 500 })
  }
}
