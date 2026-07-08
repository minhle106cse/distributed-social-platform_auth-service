import * as grpc from '@grpc/grpc-js'
import {
  AuthProvisioningService,
  type CommandBus,
  type ILogger,
} from '@distributed-social-platform/shared-kernel'
import { AuthProvisioningGrpcService } from '@/infrastructure/grpc/auth-provisioning.grpc-service'
import { config } from '@/config'

export function startGrpcServer(commandBus: CommandBus, logger: ILogger): grpc.Server {
  const server = new grpc.Server()
  server.addService(AuthProvisioningService, new AuthProvisioningGrpcService(commandBus, logger))

  server.bindAsync(
    `0.0.0.0:${config.grpcPort}`,
    grpc.ServerCredentials.createInsecure(),
    (err, port) => {
      if (err) {
        logger.error({ err }, 'Failed to start gRPC server')
        return
      }
      logger.info(`🔌 gRPC (AuthProvisioning) listening on port ${port}`)
    },
  )

  return server
}
