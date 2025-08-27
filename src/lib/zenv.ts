import { z } from 'zod'

const envSchema = z.object({
  NEXTAUTH_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(1),
  DATABASE_URL: z.string().min(1),
  OPENAI_API_BASE: z.string().url(),
  OPENAI_API_KEY: z.string().min(1),
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
  MS_CLIENT_ID: z.string().min(1),
  MS_CLIENT_SECRET: z.string().min(1),
  MS_TENANT_ID: z.string().default('common'),
  RESEND_API_KEY: z.string().optional(),
  SLACK_BOT_TOKEN: z.string().optional(),
  SLACK_SIGNING_SECRET: z.string().optional(),
})

export const env = envSchema.parse(process.env)

export type Env = z.infer<typeof envSchema>
