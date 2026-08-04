import { CommandBus, EventBus, QueryBus } from '@distributed-social-platform/shared-kernel'
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
import { PrismaTxRunner } from '@/infrastructure/database/prisma/prisma-tx-runner'
import { authServiceRepoFactory } from './repos'
import { transientError } from '@/infrastructure/database/prisma/prisma-transient-error'

export function buildApplication(infra: InfraDeps) {
  // The ONLY place that knows about Prisma-specific details. The repos
  // factory is a plain constructor argument now (2026-07-30 collapse) — no
  // separate registerScope() call, no chance to forget it: TxRunner cannot
  // be constructed without one.
  const txRunner = new PrismaTxRunner(infra.prisma, infra.logger, authServiceRepoFactory)

  // Logging → retry → transaction is fixed inside CommandBus now; there is no
  // .use() to get the order wrong (ADR-0001 §2.3).
  const commandBus = new CommandBus(infra.logger, txRunner, transientError)
  const eventBus = new EventBus(infra.logger)
  const queryBus = new QueryBus(infra.logger)

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
  //
  // Write repositories are NOT constructed here any more: they are built per
  // transaction by the scope factories above, so handlers receive them as a
  // parameter instead of holding one for the process lifetime.
  commandBus.register(
    'LoginCommand',
    new LoginHandler(infra.passwordService, infra.tokenService, infra.logger),
  )
  commandBus.register('RegisterCommand', new RegisterHandler(infra.passwordService, infra.logger))
  commandBus.register('ProvisionUserCommand', new ProvisionUserHandler(infra.passwordService))
  commandBus.register('CancelProvisionedUserCommand', new CancelProvisionedUserHandler())
  commandBus.register('RefreshCommand', new RefreshHandler(infra.tokenService, infra.logger))
  commandBus.register('UpdateProfileCommand', new UpdateProfileHandler())
  commandBus.register('CreateRoleCommand', new CreateRoleHandler())
  commandBus.register('AssignRoleCommand', new AssignRoleHandler())
  commandBus.register('AssignPermissionsCommand', new AssignPermissionsHandler())
  commandBus.register('RevokeRoleCommand', new RevokeRoleHandler())
  commandBus.register('RevokePermissionsCommand', new RevokePermissionsHandler())
  commandBus.register('DeleteRoleCommand', new DeleteRoleHandler())

  // Read side is unchanged: queries need no transaction, so their repositories
  // stay long-lived on the plain client.
  const userQueryRepository = new PrismaUserQueryRepository(infra.prisma)
  queryBus.register('GetMeQuery', new GetMeHandler(userQueryRepository))

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
