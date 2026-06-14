import { CommandBus, EventBus, QueryBus } from '@/common/cqrs'
import { LoginHandler } from '@/modules/auth/application/commands/login/login.handler'
import { RefreshHandler } from '@/modules/auth/application/commands/refresh/refresh.handler'
import { RegisterHandler } from '@/modules/auth/application/commands/register/register.handler'
import { GetMeHandler } from '@/modules/auth/application/queries/get-me/get-me.handler'
import { PrismaUserQueryRepository } from '@/modules/auth/infrastructure/repositories/prisma-user.query-repository'
import { type InfraDeps } from './infra'
import { LoggingMiddleware } from '@/common/cqrs/middlewares/logging.middleware'
import { TransactionMiddleware } from '@/common/cqrs/middlewares/transaction.middleware'
import { RetryMiddleware } from '@/common/cqrs/middlewares/retry.middleware'
import { PrismaTransactionManager } from '@/infrastructure/database/prisma/prisma-transaction-manager'
import { isPrismaTransientError } from '@/infrastructure/database/prisma/prisma-transient-error'

export function buildApplication(infra: InfraDeps) {
  const commandBus = new CommandBus()
  const eventBus = new EventBus()
  const queryBus = new QueryBus()

  // Wiring Infra implementations into framework-agnostic Middlewares.
  // This is the ONLY place that knows about Prisma-specific details.
  const transactionManager = new PrismaTransactionManager(infra.prisma)

  // Middlewares are executed in order: Logging -> Retry -> Transaction
  commandBus.use(new LoggingMiddleware(infra.logger))
  commandBus.use(new RetryMiddleware(infra.logger, isPrismaTransientError))
  commandBus.use(new TransactionMiddleware(transactionManager, infra.logger))

  const loginHandler = new LoginHandler(
    infra.userRepository,
    infra.refreshTokenRepository,
    infra.passwordService,
    infra.tokenService,
  )
  const registerHandler = new RegisterHandler(infra.userRepository, infra.passwordService)
  const refreshHandler = new RefreshHandler(infra.refreshTokenRepository, infra.tokenService)

  commandBus.register('LoginCommand', loginHandler)
  commandBus.register('RegisterCommand', registerHandler)
  commandBus.register('RefreshCommand', refreshHandler)

  const userQueryRepository = new PrismaUserQueryRepository(infra.prisma)
  const getMeHandler = new GetMeHandler(userQueryRepository)
  queryBus.register('GetMeQuery', getMeHandler)

  return {
    commandBus,
    eventBus,
    queryBus,
  }
}

export type Application = ReturnType<typeof buildApplication>
