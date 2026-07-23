import { CommandBus, EventBus, QueryBus } from '@distributed-social-platform/shared-kernel'
import { LoggingMiddleware } from '@distributed-social-platform/shared-kernel'
import { TransactionMiddleware } from '@distributed-social-platform/shared-kernel'
import { RetryMiddleware } from '@distributed-social-platform/shared-kernel'
import { type InfraDeps } from './infra'
import { LoginHandler } from '@/modules/auth/application/commands/login/login.handler'
import { RefreshHandler } from '@/modules/auth/application/commands/refresh/refresh.handler'
import { RegisterHandler } from '@/modules/auth/application/commands/register/register.handler'
import { ProvisionUserHandler } from '@/modules/auth/application/commands/provision-user/provision-user.handler'
import { CancelProvisionedUserHandler } from '@/modules/auth/application/commands/cancel-provisioned-user/cancel-provisioned-user.handler'
import { GetMeHandler } from '@/modules/user/application/queries/get-me/get-me.handler'
import { UpdateProfileHandler } from '@/modules/user/application/commands/update-profile/update-profile.handler'
import { CreateRoleHandler } from '@/modules/rbac/application/commands/create-role/create-role.handler'
import { AssignRoleHandler } from '@/modules/rbac/application/commands/assign-role/assign-role.handler'
import { AssignPermissionsHandler } from '@/modules/rbac/application/commands/assign-permissions/assign-permissions.handler'
import { RevokeRoleHandler } from '@/modules/rbac/application/commands/revoke-role/revoke-role.handler'
import { RevokePermissionsHandler } from '@/modules/rbac/application/commands/revoke-permissions/revoke-permissions.handler'
import { DeleteRoleHandler } from '@/modules/rbac/application/commands/delete-role/delete-role.handler'
import { GetRolesHandler } from '@/modules/rbac/application/queries/get-roles/get-roles.handler'
import { GetRoleHandler } from '@/modules/rbac/application/queries/get-role/get-role.handler'
import { GetPermissionsHandler } from '@/modules/rbac/application/queries/get-permissions/get-permissions.handler'
import { PrismaRoleQueryRepository } from '@/modules/rbac/infrastructure/repositories/prisma-role.query-repository'
import { PrismaUserQueryRepository } from '@/modules/user/infrastructure/repositories/prisma-user.query-repository'
import { PrismaRoleRepository } from '@/modules/rbac/infrastructure/repositories/prisma-role.repository'
import { PrismaTransactionManager } from '@/infrastructure/database/prisma/prisma-transaction-manager'
import {
  isPrismaTransientError,
  recordDbTransientErrorObservation,
} from '@/infrastructure/database/prisma/prisma-transient-error'

export function buildApplication(infra: InfraDeps) {
  const commandBus = new CommandBus()
  const eventBus = new EventBus(infra.logger)
  const queryBus = new QueryBus(infra.logger)

  // Wiring Infra implementations into framework-agnostic Middlewares.
  // This is the ONLY place that knows about Prisma-specific details.
  const transactionManager = new PrismaTransactionManager(infra.prisma)

  // Middlewares are executed in order: Logging -> Retry -> Transaction
  commandBus.use(new LoggingMiddleware(infra.logger))
  commandBus.use(
    new RetryMiddleware(
      infra.logger,
      isPrismaTransientError,
      undefined,
      undefined,
      undefined,
      recordDbTransientErrorObservation,
    ),
  )
  commandBus.use(new TransactionMiddleware(transactionManager, infra.logger))

  // 2026-07-25 — REVERTED the `.child({context: ClassName.name})` pattern
  // used here before. Found it produces a genuinely malformed log line: real
  // pino's `child()` bindings and a later per-call object argument with the
  // SAME key (`context`) do NOT merge — they're both written to the JSON
  // output, producing a line with the `context` key TWICE
  // (`"context":"LoginHandler","context":"AuditLog"`), correct only by
  // accident because most JSON parsers take the last occurrence. Verified
  // with a real pino instance. Every log call these 3 handlers make goes
  // through `logAudit()`, which ALREADY sets `context: LogContext.AUDIT`
  // explicitly — the child binding was dead weight producing bad JSON for
  // zero benefit. Passing `infra.logger` directly, unmodified.
  const loginHandler = new LoginHandler(
    infra.userRepository,
    infra.refreshTokenRepository,
    infra.passwordService,
    infra.tokenService,
    infra.logger,
  )
  const registerHandler = new RegisterHandler(
    infra.userRepository,
    infra.passwordService,
    infra.logger,
  )
  const provisionUserHandler = new ProvisionUserHandler(infra.userRepository, infra.passwordService)
  const cancelProvisionedUserHandler = new CancelProvisionedUserHandler(infra.userRepository)
  const refreshHandler = new RefreshHandler(
    infra.refreshTokenRepository,
    infra.tokenService,
    infra.userRepository,
    infra.logger,
  )
  const updateProfileHandler = new UpdateProfileHandler(infra.userRepository)

  const roleRepo = new PrismaRoleRepository(infra.prisma)

  const createRoleHandler = new CreateRoleHandler(roleRepo)
  const assignRoleHandler = new AssignRoleHandler(roleRepo)
  const assignPermissionsHandler = new AssignPermissionsHandler(roleRepo)
  const revokeRoleHandler = new RevokeRoleHandler(roleRepo)
  const revokePermissionsHandler = new RevokePermissionsHandler(roleRepo)
  const deleteRoleHandler = new DeleteRoleHandler(roleRepo)

  commandBus.register('LoginCommand', loginHandler)
  commandBus.register('RegisterCommand', registerHandler)
  commandBus.register('ProvisionUserCommand', provisionUserHandler)
  commandBus.register('CancelProvisionedUserCommand', cancelProvisionedUserHandler)
  commandBus.register('RefreshCommand', refreshHandler)
  commandBus.register('UpdateProfileCommand', updateProfileHandler)
  commandBus.register('CreateRoleCommand', createRoleHandler)
  commandBus.register('AssignRoleCommand', assignRoleHandler)
  commandBus.register('AssignPermissionsCommand', assignPermissionsHandler)
  commandBus.register('RevokeRoleCommand', revokeRoleHandler)
  commandBus.register('RevokePermissionsCommand', revokePermissionsHandler)
  commandBus.register('DeleteRoleCommand', deleteRoleHandler)

  const userQueryRepository = new PrismaUserQueryRepository(infra.prisma)
  const getMeHandler = new GetMeHandler(userQueryRepository)
  queryBus.register('GetMeQuery', getMeHandler)

  const roleQueryRepository = new PrismaRoleQueryRepository(infra.prisma)

  queryBus.register('GetRolesQuery', new GetRolesHandler(roleQueryRepository))
  queryBus.register('GetRoleQuery', new GetRoleHandler(roleQueryRepository))
  queryBus.register('GetPermissionsQuery', new GetPermissionsHandler())

  return {
    CommandBus: commandBus,
    EventBus: eventBus,
    QueryBus: queryBus,
  }
}

export type Application = ReturnType<typeof buildApplication>
