import {
  runInTransaction,
  type ITransactionManager,
} from '@distributed-social-platform/shared-kernel'
import type { PrismaClient } from '@/generated'

export class PrismaTransactionManager implements ITransactionManager {
  constructor(private readonly prisma: PrismaClient) {}

  run<R>(callback: () => Promise<R>): Promise<R> {
    return this.prisma.$transaction((tx) => runInTransaction(tx, callback), { timeout: 10000 })
  }
}
