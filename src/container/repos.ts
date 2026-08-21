import type { IRepoFactory } from '@distributed-social-platform/shared-kernel'
import type { Prisma } from '@/generated'
import { PrismaUserRepository } from '@/modules/user/infrastructure/repositories/prisma-user.repository'
import { PrismaRoleRepository } from '@/modules/rbac/infrastructure/repositories/prisma-role.repository'
import { PrismaRefreshTokenRepository } from '@/modules/auth/infrastructure/repositories/prisma-refresh-token.repository'
import { PrismaGrpcIdempotencyRepository } from '@/modules/auth/infrastructure/repositories/prisma-grpc-idempotency.repository'
import type { IUserRepository } from '@/modules/user/domain/repositories/user.repository'
import type { IRoleRepository } from '@/modules/rbac/domain/repositories/role.repository'
import type { IRefreshTokenRepository } from '@/modules/auth/domain/repositories/refresh-token.repository'
import type { IGrpcIdempotencyRepository } from '@/modules/auth/domain/repositories/grpc-idempotency.repository'

/**
 * Write-side Unit of Work for the WHOLE service (ADR-0001). One repos shape,
 * not one per module (Auth/Rbac/User used to each have their own TxScope +
 * factory + registration) — collapsed 2026-07-30. `users` alone was already
 * shared between the old AuthTxScope and UserTxScope (login/refresh need
 * BOTH the user and a refresh token in one transaction), so the 3 scopes were
 * never really independent; splitting them bought a soft protection (a
 * handler in one module doesn't see another module's repos on autocomplete)
 * at the cost of upkeep (3 interfaces + 3 factories + 3 registrations to keep
 * in sync) for a service this size. See shared-kernel's tx-scope.ts doc for
 * the full reasoning.
 */
export interface AuthServiceRepos {
  readonly users: IUserRepository
  readonly refreshTokens: IRefreshTokenRepository
  readonly grpcIdempotency: IGrpcIdempotencyRepository
  readonly roles: IRoleRepository
}

/**
 * The only place write repositories are constructed — always from an open
 * transaction client, which is what makes "a write repository has a
 * transaction" true by construction rather than by convention (ADR-0001).
 *
 * auth-service has no DI container, so this lives at the composition root
 * instead of being a Nest provider; the shape is identical.
 */
export const authServiceRepoFactory: IRepoFactory<AuthServiceRepos, Prisma.TransactionClient> = {
  create(tx: Prisma.TransactionClient): AuthServiceRepos {
    return {
      users: new PrismaUserRepository(tx),
      refreshTokens: new PrismaRefreshTokenRepository(tx),
      grpcIdempotency: new PrismaGrpcIdempotencyRepository(tx),
      roles: new PrismaRoleRepository(tx),
    }
  },
}
