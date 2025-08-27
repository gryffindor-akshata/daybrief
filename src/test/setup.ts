import { beforeAll, vi } from 'vitest'

// Mock environment variables for tests
beforeAll(() => {
  vi.stubEnv('NEXTAUTH_URL', 'http://localhost:3000')
  vi.stubEnv('NEXTAUTH_SECRET', 'test-secret')
  vi.stubEnv('DATABASE_URL', 'file:./test.db')
  vi.stubEnv('OPENAI_API_BASE', 'https://api.openai.com/v1')
  vi.stubEnv('OPENAI_API_KEY', 'sk-test-key')
  vi.stubEnv('GOOGLE_CLIENT_ID', 'test-google-client-id')
  vi.stubEnv('GOOGLE_CLIENT_SECRET', 'test-google-client-secret')
  vi.stubEnv('MS_CLIENT_ID', 'test-ms-client-id')
  vi.stubEnv('MS_CLIENT_SECRET', 'test-ms-client-secret')
  vi.stubEnv('MS_TENANT_ID', 'common')
})
