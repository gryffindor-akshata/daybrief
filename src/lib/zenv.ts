import { z } from 'zod'

const envSchema = z.object({
  NEXTAUTH_URL: z.string().url().optional().default('http://localhost:3000'),
  NEXTAUTH_SECRET: z.string().min(1).optional().default('development-secret-change-in-production'),
  DATABASE_URL: z.string().min(1).optional().default('file:./dev.db'),
  OPENAI_API_BASE: z.string().url().optional().default('https://api.openai.com/v1'),
  OPENAI_API_KEY: z.string().min(1).optional().default('sk-development-key'),
  GOOGLE_CLIENT_ID: z.string().min(1).optional().default('development-client-id'),
  GOOGLE_CLIENT_SECRET: z.string().min(1).optional().default('development-client-secret'),
  MS_CLIENT_ID: z.string().min(1).optional().default('development-ms-client-id'),
  MS_CLIENT_SECRET: z.string().min(1).optional().default('development-ms-client-secret'),
  MS_TENANT_ID: z.string().optional().default('common'),
  RESEND_API_KEY: z.string().optional(),
  SLACK_BOT_TOKEN: z.string().optional(),
  SLACK_SIGNING_SECRET: z.string().optional(),
})

// Only validate required env vars in production
const isProduction = process.env.NODE_ENV === 'production'

if (isProduction) {
  const requiredInProduction = [
    'NEXTAUTH_URL',
    'NEXTAUTH_SECRET', 
    'DATABASE_URL',
    'OPENAI_API_KEY',
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET'
  ]
  
  const missing = requiredInProduction.filter(key => !process.env[key])
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables in production: ${missing.join(', ')}`)
  }
}

export const env = envSchema.parse(process.env)

export type Env = z.infer<typeof envSchema>
