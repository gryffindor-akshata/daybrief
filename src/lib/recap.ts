import { PrismaClient } from '@prisma/client'
import { buildRecapPrompt } from './prompt'
import { Resend } from 'resend'
import { WebClient } from '@slack/web-api'
import { env } from './zenv'

const prisma = new PrismaClient()

export interface RecapData {
  userId: string
  date: string // YYYY-MM-DD
  timezone: string
}

export async function generateDailyRecap(data: RecapData) {
  const { userId, date, timezone } = data
  
  // Get user settings
  const user = await prisma.user.findUnique({
    where: { id: userId },
  })

  if (!user) {
    throw new Error('User not found')
  }

  // Get summaries for the day
  const localDate = new Date(date + 'T00:00:00')
  const summaries = await prisma.summary.findMany({
    where: {
      userId,
      date: localDate,
    },
    orderBy: {
      startsAt: 'asc',
    },
  })

  if (summaries.length === 0) {
    return {
      content: `# Your DayBrief — ${date}\n\nNo meetings today 🎉\n\n—\nSent by DayBrief`,
      sentTo: [],
    }
  }

  // Format summaries for recap
  const formattedSummaries = summaries.map(summary => {
    const startTime = summary.startsAt.toLocaleTimeString('en-US', {
      timeZone: timezone,
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })

    return {
      title: summary.title,
      time: startTime,
      summaryMd: summary.summaryMd,
      actionItems: JSON.parse(summary.actionItems),
    }
  })

  const recapContent = buildRecapPrompt(formattedSummaries, date)
  const sentTo: string[] = []

  // Send email if enabled
  if (user.recapEmail && user.email && env.RESEND_API_KEY) {
    try {
      await sendRecapEmail({
        to: user.email,
        content: recapContent,
        date,
      })
      sentTo.push('email')
    } catch (error) {
      console.error('Failed to send recap email:', error)
    }
  }

  // Send Slack DM if enabled
  if (user.recapSlack && user.slackUserId && env.SLACK_BOT_TOKEN) {
    try {
      await sendRecapSlack({
        userId: user.slackUserId,
        content: recapContent,
      })
      sentTo.push('slack')
    } catch (error) {
      console.error('Failed to send recap Slack DM:', error)
    }
  }

  return {
    content: recapContent,
    sentTo,
  }
}

async function sendRecapEmail(data: {
  to: string
  content: string
  date: string
}) {
  if (!env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY not configured')
  }

  const resend = new Resend(env.RESEND_API_KEY)

  await resend.emails.send({
    from: 'DayBrief <noreply@daybrief.com>',
    to: data.to,
    subject: `Your DayBrief — ${data.date}`,
    html: markdownToHtml(data.content),
    text: data.content,
  })
}

async function sendRecapSlack(data: {
  userId: string
  content: string
}) {
  if (!env.SLACK_BOT_TOKEN) {
    throw new Error('SLACK_BOT_TOKEN not configured')
  }

  const slack = new WebClient(env.SLACK_BOT_TOKEN)

  await slack.chat.postMessage({
    channel: data.userId,
    text: data.content,
    mrkdwn: true,
  })
}

function markdownToHtml(markdown: string): string {
  let html = markdown
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^\*\*(.+)\*\*$/gm, '<strong>$1</strong>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/\n/g, '<br>')
  
  // Wrap consecutive list items in ul tags
  html = html.replace(/(<li>.*?<\/li>)(<br>(<li>.*?<\/li>))*<br>/g, '<ul>$&</ul>')
  
  return html
}
