import { config as dotenvConfig } from 'dotenv'
import { join } from 'path'
dotenvConfig({ path: join(process.cwd(), '../../.env') })
import { collectDefaultMetrics } from 'prom-client'
import { createApp } from './app'
import { config } from './config'

collectDefaultMetrics()

async function bootstrap() {
  const app = await createApp()

  await app.listen({
    port: config.port,
    host: '0.0.0.0',
  })

  app.log.info(`🚀 Server running on port ${config.port}`)
}

bootstrap().catch((err) => {
  console.error('❌ Fatal error during bootstrap')
  console.error(err)
  process.exit(1)
})
