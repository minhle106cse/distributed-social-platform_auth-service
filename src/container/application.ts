import { CommandBusService, EventBusService, QueryBusService } from '@distributed-social-platform/shared-kernel'
import { LoginHandler } from '@/modules/auth/application/commands/login/login.handler'
import { RefreshHandler } from '@/modules/auth/application/commands/refresh/refresh.handler'
import { RegisterHandler } from '@/modules/auth/application/commands/register/register.handler'
import { GetMeHandler } from '@/modules/user/application/queries/get-me/get-me.handler'
import { UpdateProfileHandler } from '@/modules/user/application/commands/update-profile/update-profile.handler'
import { CreateRoleHandler } from '@/modules/rbac/application/commands/create-role/create-role.handler'
import { AssignRoleHandler } from '@/modules/rbac/application/commands/assign-role/assign-role.handler'
import { CreatePermissionHandler } from '@/modules/rbac/application/commands/create-permission/create-permission.handler'
import { AssignPermissionsHandler } from '@/modules/rbac/application/commands/assign-permissions/assign-permissions.handler'
import { RevokeRoleHandler } from '@/modules/rbac/application/commands/revoke-role/revoke-role.handler'
import { RevokePermissionsHandler } from '@/modules/rbac/application/commands/revoke-permissions/revoke-permissions.handler'
import { DeleteRoleHandler } from '@/modules/rbac/application/commands/delete-role/delete-role.handler'
import { GetRolesHandler } from '@/modules/rbac/application/queries/get-roles/get-roles.handler'
import { GetRoleHandler } from '@/modules/rbac/application/queries/get-role/get-role.handler'
import { GetPermissionsHandler } from '@/modules/rbac/application/queries/get-permissions/get-permissions.handler'
import { PrismaRoleQueryRepository } from '@/modules/rbac/infrastructure/repositories/prisma-role.query-repository'
import { PrismaPermissionQueryRepository } from '@/modules/rbac/infrastructure/repositories/prisma-permission.query-repository'
import { PrismaUserQueryRepository } from '@/modules/user/infrastructure/repositories/prisma-user.query-repository'
import { PrismaRoleRepository } from '@/modules/rbac/infrastructure/repositories/prisma-role.repository'
import { PrismaPermissionRepository } from '@/modules/rbac/infrastructure/repositories/prisma-permission.repository'
import { type InfraDeps } from './infra'
import { LoggingMiddleware } from '@distributed-social-platform/shared-kernel'
import { TransactionMiddleware } from '@distributed-social-platform/shared-kernel'
import { RetryMiddleware } from '@distributed-social-platform/shared-kernel'
import { PrismaTransactionManager } from '@/infrastructure/database/prisma/prisma-transaction-manager'
import { isPrismaTransientError } from '@/infrastructure/database/prisma/prisma-transient-error'

export function buildApplication(infra: InfraDeps) {
  const commandBusService = new CommandBusService()
  const eventBusService = new EventBusService()
  const queryBusService = new QueryBusService()

  // Wiring Infra implementations into framework-agnostic Middlewares.
  // This is the ONLY place that knows about Prisma-specific details.
  const transactionManager = new PrismaTransactionManager(infra.prisma)

  // Middlewares are executed in order: Logging -> Retry -> Transaction
  commandBusService.use(new LoggingMiddleware(infra.logger))
  commandBusService.use(new RetryMiddleware(infra.logger, isPrismaTransientError))
  commandBusService.use(new TransactionMiddleware(transactionManager, infra.logger))

  const loginHandler = new LoginHandler(
    infra.userRepository,
    infra.refreshTokenRepository,
    infra.passwordService,
    infra.tokenService,
  )
  const registerHandler = new RegisterHandler(infra.userRepository, infra.passwordService)
  const refreshHandler = new RefreshHandler(infra.refreshTokenRepository, infra.tokenService, infra.userRepository)
  const updateProfileHandler = new UpdateProfileHandler(infra.userRepository)
  
  const roleRepo = new PrismaRoleRepository(infra.prisma)
  const permissionRepo = new PrismaPermissionRepository(infra.prisma)

  const createRoleHandler = new CreateRoleHandler(roleRepo)
  const assignRoleHandler = new AssignRoleHandler(roleRepo)
  const createPermissionHandler = new CreatePermissionHandler(permissionRepo)
  const assignPermissionsHandler = new AssignPermissionsHandler(roleRepo, permissionRepo)
  const revokeRoleHandler = new RevokeRoleHandler(roleRepo)
  const revokePermissionsHandler = new RevokePermissionsHandler(roleRepo)
  const deleteRoleHandler = new DeleteRoleHandler(roleRepo)

  commandBusService.register('LoginCommand', loginHandler)
  commandBusService.register('RegisterCommand', registerHandler)
  commandBusService.register('RefreshCommand', refreshHandler)
  commandBusService.register('UpdateProfileCommand', updateProfileHandler)
  commandBusService.register('CreateRoleCommand', createRoleHandler)
  commandBusService.register('AssignRoleCommand', assignRoleHandler)
  commandBusService.register('CreatePermissionCommand', createPermissionHandler)
  commandBusService.register('AssignPermissionsCommand', assignPermissionsHandler)
  commandBusService.register('RevokeRoleCommand', revokeRoleHandler)
  commandBusService.register('RevokePermissionsCommand', revokePermissionsHandler)
  commandBusService.register('DeleteRoleCommand', deleteRoleHandler)

  const userQueryRepository = new PrismaUserQueryRepository(infra.prisma)
  const getMeHandler = new GetMeHandler(userQueryRepository)
  queryBusService.register('GetMeQuery', getMeHandler)
  
  const roleQueryRepository = new PrismaRoleQueryRepository(infra.prisma)
  const permissionQueryRepository = new PrismaPermissionQueryRepository(infra.prisma)
  
  queryBusService.register('GetRolesQuery', new GetRolesHandler(roleQueryRepository))
  queryBusService.register('GetRoleQuery', new GetRoleHandler(roleQueryRepository))
  queryBusService.register('GetPermissionsQuery', new GetPermissionsHandler(permissionQueryRepository))
  
  return {
    CommandBusService: commandBusService,
    EventBusService: eventBusService,
    QueryBusService: queryBusService,
  }
}

export type Application = ReturnType<typeof buildApplication>

