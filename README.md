# DayBrief - AI Meeting Summaries

DayBrief is a minimal, reliable web app that connects to your calendar (Google Calendar + Microsoft Outlook), fetches your daily meetings, and generates concise, structured summaries with action items using AI.

## Features

- 🔐 **Secure OAuth Authentication** - Connect with Google or Microsoft accounts
- 📅 **Calendar Integration** - Read-only access to Google Calendar and Microsoft Outlook
- 🤖 **AI-Powered Summaries** - Generate structured meeting summaries with action items
- 📧 **Daily Recap** - Optional email and Slack notifications
- 🎯 **Action Items** - Extract and track meeting action items
- 🌍 **Timezone Support** - Proper timezone handling for global teams
- 📱 **Responsive Design** - Clean, modern UI that works on all devices

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui, React Query
- **Backend**: Next.js API routes, Node.js 20+
- **Authentication**: NextAuth.js with OAuth for Google + Microsoft
- **Database**: SQLite via Prisma (easily switchable to PostgreSQL)
- **AI**: OpenAI-compatible API endpoints
- **Email**: Resend for recap emails
- **Slack**: Slack Bot for recap DMs

## Prerequisites

Before you begin, ensure you have:

- Node.js 20+ installed
- A Google Cloud Console project with Calendar API enabled
- A Microsoft Azure AD application (optional, for Microsoft Calendar)
- An OpenAI API key or compatible API endpoint
- Resend API key (optional, for email recaps)
- Slack Bot token (optional, for Slack recaps)

## Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd daybrief
npm install
```

### 2. Environment Setup

Copy the example environment file:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your configuration:

```env
# Next.js
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-here-generate-with-openssl-rand-base64-32

# Database
DATABASE_URL="file:./dev.db"

# OpenAI-compatible
OPENAI_API_BASE=https://api.openai.com/v1
OPENAI_API_KEY=sk-your-openai-key-here

# Google OAuth (Required)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Microsoft OAuth (Optional)
MS_CLIENT_ID=your-ms-client-id
MS_CLIENT_SECRET=your-ms-client-secret
MS_TENANT_ID=common

# Resend (Optional - for email recaps)
RESEND_API_KEY=your-resend-key

# Slack (Optional - for Slack recaps)
SLACK_BOT_TOKEN=xoxb-your-slack-token
SLACK_SIGNING_SECRET=your-slack-signing-secret
```

### 3. Database Setup

Initialize and create the database:

```bash
npm run db:push
```

### 4. OAuth Configuration

#### Google Calendar Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable the Google Calendar API
4. Create OAuth 2.0 credentials:
   - Application type: Web application
   - Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`
5. Copy Client ID and Client Secret to `.env.local`

#### Microsoft Outlook Setup (Optional)

1. Go to [Azure Portal](https://portal.azure.com/)
2. Navigate to Azure Active Directory → App registrations
3. Create a new registration:
   - Redirect URI: `http://localhost:3000/api/auth/callback/microsoft`
   - API permissions: `Calendars.Read`, `openid`, `email`, `profile`, `offline_access`
4. Copy Application (client) ID and create a client secret
5. Add to `.env.local`

### 5. Run the Application

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to access DayBrief.

## Usage

### First Time Setup

1. **Sign In**: Choose Google or Microsoft to connect your calendar
2. **Grant Permissions**: Allow read-only access to your calendar
3. **Set Timezone**: Go to Settings and configure your timezone
4. **Configure Recaps**: Enable email/Slack recaps if desired

### Daily Workflow

1. **View Today's Meetings**: The main page shows all meetings for the selected date
2. **Generate Summaries**: Click "Summarize" on any meeting to get AI-generated insights
3. **Review Action Items**: Check off completed action items
4. **Send Daily Recap**: Use the "Send Recap" button for end-of-day summaries

### Features in Detail

#### Meeting Summaries
- AI analyzes meeting metadata (title, description, attendees, location)
- Generates 4-7 bullet point summaries focused on purpose and outcomes
- Extracts explicit action items with owners and due dates
- Provides confidence scores based on available context

#### Action Items
- Automatically extracted from meeting context
- Interactive checkboxes to track completion
- Format: "Owner: Task — Due date (if any)"

#### Daily Recaps
- Configurable email and Slack notifications
- Sent at 6 PM local time (configurable)
- Includes all day's summaries and action items
- Markdown format with links back to individual meetings

## Development

### Project Structure

```
src/
├── app/                 # Next.js App Router pages and API routes
│   ├── api/            # API endpoints
│   ├── auth/           # Authentication pages
│   ├── settings/       # Settings page
│   └── page.tsx        # Main Today view
├── components/         # React components
│   ├── ui/            # shadcn/ui components
│   ├── EventCard.tsx  # Meeting display component
│   ├── HeaderNav.tsx  # Navigation header
│   └── SummaryCard.tsx # AI summary display
├── lib/               # Core utilities and integrations
│   ├── calendar/      # Calendar API integrations
│   ├── auth.ts        # NextAuth configuration
│   ├── llm.ts         # LLM API client
│   ├── prompt.ts      # AI prompt templates
│   ├── recap.ts       # Recap generation
│   └── zenv.ts        # Environment validation
└── test/              # Test files
```

### Scripts

```bash
# Development
npm run dev              # Start development server
npm run build           # Build for production
npm run start           # Start production server

# Database
npm run db:push         # Push schema changes to database
npm run db:generate     # Generate Prisma client
npm run db:studio       # Open Prisma Studio

# Testing
npm run test            # Run tests in watch mode
npm run test:run        # Run tests once
npm run test:coverage   # Run tests with coverage
```

### Adding New Calendar Providers

1. Create integration in `src/lib/calendar/`
2. Add provider to NextAuth configuration
3. Update normalization logic
4. Add OAuth configuration to environment variables

### Extending AI Capabilities

The LLM integration is designed to be flexible:

- Modify prompts in `src/lib/prompt.ts`
- Adjust confidence scoring in `src/lib/llm.ts`
- Add new summary fields to the Prisma schema

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect repository to Vercel
3. Add environment variables in Vercel dashboard
4. Update `NEXTAUTH_URL` to your production domain
5. Deploy

### Other Platforms

DayBrief can be deployed to any Node.js hosting platform:

- Update database configuration for production (PostgreSQL recommended)
- Set all environment variables
- Run `npm run build` and `npm start`

## Security & Privacy

- **Read-Only Access**: Only requests calendar read permissions
- **Data Minimization**: Stores only necessary meeting metadata and summaries
- **User Control**: Users can delete all their data anytime
- **No PII Logging**: Sensitive information is not logged
- **OAuth Security**: Implements proper OAuth flows with secure token storage

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run the test suite
6. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions:

1. Check the [GitHub Issues](link-to-issues)
2. Review this README and environment setup
3. Check OAuth configuration in Google/Microsoft consoles
4. Verify API keys and permissions

## Roadmap

- [ ] Microsoft Teams integration
- [ ] Meeting transcription support
- [ ] Multi-day meeting history UI
- [ ] Notion/Confluence export
- [ ] Project clustering by meeting topics
- [ ] Mobile app (React Native)