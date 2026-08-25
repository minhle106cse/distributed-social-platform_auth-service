import * as grpc from '@grpc/grpc-js'
import {
  type SystemRbacServer,
  type QueryBus,
  type ILogger,
  verifyInternalGrpcSecret,
  readTraceparent,
  startTraceContext,
  runWithTraceContext,
  LogContext,
} from '@distributed-social-platform/shared-kernel'
import { ResolveSystemPermissionsQuery } from '@/modules/rbac/application/queries/resolve-system-permissions/resolve-system-permissions.query'
import type { ResolveSystemPermissionsResult } from '@/modules/rbac/application/queries/resolve-system-permissions/resolve-system-permissions.handler'
import { config } from '@/config'

/**
 * Server half of proto/system-rbac.proto — auth_db owns System RBAC, so it is
 * the only place that can answer "what may this user do on the platform?".
 * core-api's SystemPermissionGuard calls this per request instead of reading
 * the JWT's `permissions` claim, which was a snapshot frozen at login.
 *
 * Delegates to QueryBus rather than touching a repository directly, matching
 * AuthProvisioningGrpcService (CommandBus) and core-api's
 * MembershipVerificationGrpcService (QueryBus).
 *
 * See auth-provisioning.grpc-service.ts for why the members are `#private` and
 * the handlers are arrow properties — grpc-js's typing and call convention.
 */
export class SystemRbacGrpcService implements SystemRbacServer {
  [name: string]: grpc.UntypedHandleCall
  #queryBus: QueryBus
  #logger: ILogger

  constructor(queryBus: QueryBus, logger: ILogger) {
    this.#queryBus = queryBus
    this.#logger = logger
  }

  resolveSystemPermissions: SystemRbacServer['resolveSystemPermissions'] = (call, callback) => {
    const traceCtx = startTraceContext(readTraceparent(call))
    void runWithTraceContext(traceCtx, async () => {
      if (!verifyInternalGrpcSecret(call, config.internalGrpcSharedSecret)) {
        // gRPC has no boundary interceptor equivalent to the HTTP one, so a
        // rejected call leaves no trace unless this branch logs it itself.
        this.#logger.warn(
          { context: LogContext.GRPC },
          'ResolveSystemPermissions gRPC call rejected — invalid internal secret',
        )
        callback({ code: grpc.status.UNAUTHENTICATED, message: 'Invalid internal secret' })
        return
      }

      try {
        const { userId } = call.request
        const result = await this.#queryBus.execute<
          ResolveSystemPermissionsQuery,
          ResolveSystemPermissionsResult
        >(new ResolveSystemPermissionsQuery(userId))

        // Count, not the codes themselves: this runs on every platform-admin
        // request and the permission list is the sensitive part of the answer.
        this.#logger.info(
          { context: LogContext.GRPC, userId, permissionCount: result.permissions.length },
          'ResolveSystemPermissions gRPC call succeeded',
        )
        callback(null, { permissions: result.permissions })
      } catch (err) {
        this.#logger.error(
          { context: LogContext.GRPC, err },
          'ResolveSystemPermissions gRPC call failed',
        )
        callback({ code: grpc.status.INTERNAL, message: 'Failed to resolve system permissions' })
      }
    })
  }
}
