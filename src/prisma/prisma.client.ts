import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../generated/client'
import { config } from '../config'

const logLevels: Array<'query' | 'info' | 'warn' | 'error'> =
  config.nodeEnv === 'production' ? ['warn', 'error'] : ['query', 'info', 'warn', 'error']

declare global {
  var prismaService: PrismaService | undefined
}

export class PrismaService {
  public readonly client: PrismaClient

  constructor() {
    const adapter = new PrismaPg({
      connectionString: config.databaseUrl,
    })

    this.client = new PrismaClient({
      adapter,
      log: logLevels,
    })
  }

  async connect() {
    await this.client.$connect()
  }

  async disconnect() {
    await this.client.$disconnect()
  }
}

export const prismaService =
  globalThis.prismaService ?? new PrismaService()

export const prisma = prismaService.client