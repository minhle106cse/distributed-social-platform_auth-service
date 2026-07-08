import { join } from 'path'
import { config } from 'dotenv'
// Shared infra config (DB/Kafka/Redis/... — same for every service).
config({ path: join(process.cwd(), '../../.env') })
// Service-only secrets (JWT_PRIVATE_KEY/JWT_REFRESH_SECRET) — only
// auth-service loads this file; no other service's envFilePath points here.
config({ path: join(process.cwd(), '.env.secrets') })
import { envSchema } from './env.schema'

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  console.error('❌ Invalid environment variables')
  console.error(parsed.error.format())
  process.exit(1)
}

export const env = {
  ...parsed.data,
}
