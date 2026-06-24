import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@/generated/client'
import { config } from '@/config'

const logLevels: Array<'query' | 'info' | 'warn' | 'error'> =
  config.nodeEnv === 'production' ? ['warn', 'error'] : ['query', 'info', 'warn', 'error']

declare global {
  var prismaService: PrismaService | undefined
}

export class PrismaService {
  public readonly rawClient: PrismaClient
  public readonly client: PrismaClient

  constructor() {
    const adapter = new PrismaPg({
      connectionString: config.databaseUrl,
    })

    this.rawClient = new PrismaClient({
      adapter,
      log: logLevels,
    })

    this.client = this.rawClient.$extends({
      query: {
        $allModels: {
          async $allOperations({ model, operation, args, query }) {
            const modelsWithSoftDelete = ['User', 'Role', 'Permission']
            if (
              modelsWithSoftDelete.includes(model) &&
              ['findUnique', 'findFirst', 'findMany', 'count'].includes(operation as string)
            ) {
              const where = (args as any).where || {}
              // If a query explicitly includes 'deletedAt' key (even if undefined), don't override it
              if (!('deletedAt' in where)) {
                ;(args as any).where = { ...where, deletedAt: null }
              }
            }
            return query(args)
          },
        },
      },
    }) as unknown as PrismaClient
  }

  async connect() {
    await this.rawClient.$connect()
  }

  async disconnect() {
    await this.rawClient.$disconnect()
  }
}

export const prismaService = globalThis.prismaService ?? new PrismaService()

export const prisma = prismaService.client
