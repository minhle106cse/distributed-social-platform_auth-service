import 'dotenv/config'
import { createApp } from './app'
import { config } from './config'

async function bootstrap() {
  const app = createApp()

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
