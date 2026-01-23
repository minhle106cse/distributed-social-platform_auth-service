import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../generated/client'
import { config } from '../config'

const adapter = new PrismaPg({
  connectionString: config.databaseUrl!,
})

declare global {
  var prisma: PrismaClient
}

const logLevels: Array<'query' | 'info' | 'warn' | 'error'> =
  config.nodeEnv === 'production' ? ['warn', 'error'] : ['query', 'info', 'warn', 'error']

export const prisma =
  global.prisma ||
  new PrismaClient({
    adapter,
    log: logLevels,
  })

if (config.nodeEnv !== 'production') {
  global.prisma = prisma
}
