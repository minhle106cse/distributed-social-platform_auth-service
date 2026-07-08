import * as grpc from '@grpc/grpc-js'
import {
  type AuthProvisioningServer,
  type CommandBus,
  type ILogger,
  verifyInternalGrpcSecret,
} from '@distributed-social-platform/shared-kernel'
import { ProvisionUserCommand } from '@/modules/auth/application/commands/provision-user/provision-user.command'
import type { ProvisionUserResult } from '@/modules/auth/application/commands/provision-user/provision-user.handler'
import { CancelProvisionedUserCommand } from '@/modules/auth/application/commands/cancel-provisioned-user/cancel-provisioned-user.command'
import type { CancelProvisionedUserResult } from '@/modules/auth/application/commands/cancel-provisioned-user/cancel-provisioned-user.handler'
import { UserAlreadyExistsError } from '@/common/errors/user.error'
import { config } from '@/config'

export class AuthProvisioningGrpcService implements AuthProvisioningServer {
  // AuthProvisioningServer extends grpc-js's UntypedServiceImplementation,
  // which carries a `[name: string]: UntypedHandleCall` index signature —
  // `implements` requires the class to redeclare it explicitly. A regular
  // (TS-only `private`) field would ALSO have to satisfy that same index
  // type, which CommandBus/ILogger don't — true ECMAScript private fields
  // (`#foo`) aren't string-keyed members of the class's structural type, so
  // they're exempt and can hold anything.
  [name: string]: grpc.UntypedHandleCall
  #commandBus: CommandBus
  #logger: ILogger

  constructor(commandBus: CommandBus, logger: ILogger) {
    this.#commandBus = commandBus
    this.#logger = logger
  }

  // Arrow-function class properties, not prototype methods — grpc-js calls
  // `implementation[name](call, callback)` without rebinding `this` to the
  // instance, so a regular method here would lose access to
  // this.#commandBus/this.#logger the moment it's extracted off the object.
  // Arrow properties capture `this` lexically at construction time instead.
  //
  // handleUnaryCall's signature is void-returning — grpc-js invokes it
  // fire-and-forget, so the async body is wrapped in `void (async () =>
  // ...)()` rather than making the property itself an async function (which
  // no-misused-promises correctly flags: an unhandled rejection here would be
  // silently swallowed by grpc-js).
  provisionUser: AuthProvisioningServer['provisionUser'] = (call, callback) => {
    void (async () => {
      if (!verifyInternalGrpcSecret(call, config.internalGrpcSharedSecret)) {
        callback({ code: grpc.status.UNAUTHENTICATED, message: 'Invalid internal secret' })
        return
      }

      try {
        const result = await this.#commandBus.execute<ProvisionUserCommand, ProvisionUserResult>(
          new ProvisionUserCommand(call.request.email),
        )
        callback(null, { userId: result.userId, temporaryPassword: result.temporaryPassword })
      } catch (err) {
        if (err instanceof UserAlreadyExistsError) {
          callback({ code: grpc.status.ALREADY_EXISTS, message: err.message })
          return
        }
        this.#logger.error({ err }, 'ProvisionUser gRPC call failed')
        callback({ code: grpc.status.INTERNAL, message: 'Failed to provision user' })
      }
    })()
  }

  cancelProvisionedUser: AuthProvisioningServer['cancelProvisionedUser'] = (call, callback) => {
    void (async () => {
      if (!verifyInternalGrpcSecret(call, config.internalGrpcSharedSecret)) {
        callback({ code: grpc.status.UNAUTHENTICATED, message: 'Invalid internal secret' })
        return
      }

      try {
        const result = await this.#commandBus.execute<
          CancelProvisionedUserCommand,
          CancelProvisionedUserResult
        >(new CancelProvisionedUserCommand(call.request.userId))
        callback(null, { cancelled: result.cancelled })
      } catch (err) {
        this.#logger.error({ err }, 'CancelProvisionedUser gRPC call failed')
        callback({ code: grpc.status.INTERNAL, message: 'Failed to cancel provisioned user' })
      }
    })()
  }
}
