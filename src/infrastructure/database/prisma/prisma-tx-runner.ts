import {
  AbstractTxRunner,
  type ILogger,
  type IRepoFactory,
} from '@distributed-social-platform/shared-kernel'
import type { Prisma, PrismaClient } from '@/generated'
import type { AuthServiceRepos } from '@/container/repos'

const TRANSACTION_TIMEOUT_MS = 10_000

/**
 * The ONLY Prisma-specific line of the Unit-of-Work runner (ADR-0001) — opening
 * the interactive transaction. Everything else (nesting guard, transaction
 * logging) lives in `AbstractTxRunner` (shared-kernel), shared by every
 * service instead of copy-pasted into each one.
 *
 * auth-service has no Nest DI — the repos factory is passed explicitly at the
 * composition root (`container/application.ts`), a plain constructor argument
 * instead of a `registerScope()` call (2026-07-30 collapse: one repos shape
 * for the whole service, no more per-module registry — see shared-kernel's
 * tx-scope.ts doc for why).
 */
export class PrismaTxRunner extends AbstractTxRunner<AuthServiceRepos, Prisma.TransactionClient> {
  constructor(
    private readonly prisma: PrismaClient,
    logger: ILogger,
    factory: IRepoFactory<AuthServiceRepos, Prisma.TransactionClient>,
  ) {
    super(logger, factory)
  }

  protected beginTransaction<R>(fn: (db: Prisma.TransactionClient) => Promise<R>): Promise<R> {
    return this.prisma.$transaction(fn, { timeout: TRANSACTION_TIMEOUT_MS })
  }
}
