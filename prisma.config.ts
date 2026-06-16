import { config } from 'dotenv'
import { join } from 'path'
config({ path: join(process.cwd(), '../../.env') })
import { defineConfig } from 'prisma/config'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: process.env.AUTH_DIRECT_URL || process.env.AUTH_DATABASE_URL!,
  }
})
