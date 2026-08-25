import * as grpc from '@grpc/grpc-js'
import {
  AuthProvisioningService,
  SystemRbacService,
  LogContext,
  type CommandBus,
  type QueryBus,
  type ILogger,
} from '@distributed-social-platform/shared-kernel'
import { AuthProvisioningGrpcService } from '@/infrastructure/grpc/auth-provisioning.grpc-service'
import { SystemRbacGrpcService } from '@/infrastructure/grpc/system-rbac.grpc-service'
import { config } from '@/config'

export function startGrpcServer(
  commandBus: CommandBus,
  queryBus: QueryBus,
  logger: ILogger,
): grpc.Server {
  const server = new grpc.Server()
  server.addService(AuthProvisioningService, new AuthProvisioningGrpcService(commandBus, logger))
  // System RBAC resolution for core-api's SystemPermissionGuard (2026-08-25) —
  // auth_db is the only owner of system roles/permissions.
  server.addService(SystemRbacService, new SystemRbacGrpcService(queryBus, logger))

  server.bindAsync(
    `0.0.0.0:${config.grpcPort}`,
    grpc.ServerCredentials.createInsecure(),
    (err, port) => {
      if (err) {
        logger.error({ context: LogContext.GRPC, err }, 'Failed to start gRPC server')
        return
      }
      logger.info(
        { context: LogContext.GRPC },
        `🔌 gRPC (AuthProvisioning, SystemRbac) listening on port ${port}`,
      )
    },
  )

  return server
}
