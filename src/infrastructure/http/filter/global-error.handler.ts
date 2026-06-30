import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify'
import type { ErrorDetails } from '@distributed-social-platform/shared-kernel'
import {
  ApplicationError,
  buildErrorBody,
  LogContext,
} from '@distributed-social-platform/shared-kernel'

export function globalErrorHandler(
  exception: FastifyError,
  req: FastifyRequest,
  reply: FastifyReply,
) {
  let status = 500
  let code = 'INTERNAL_SERVER_ERROR'
  let message = 'Internal server error'
  let details: ErrorDetails

  if (exception?.code === 'FST_ERR_VALIDATION') {
    status = 400
    code = 'VALIDATION_ERROR'
    message = exception.message
    details = exception?.validation?.map((v: { instancePath?: string; message?: string }) => ({
      field: v.instancePath?.replace('/', '') || 'unknown',
      message: v.message,
    }))
  } else if (exception instanceof ApplicationError) {
    status = exception.statusCode
    code = exception.code
    message = exception.message
    details = exception.details
  } else if (exception instanceof Error) {
    req.log.error({ context: LogContext.EXCEPTION, err: exception }, 'Unhandled exception')
  }

  reply.status(status).send(buildErrorBody({ code, message, details, requestId: req.id }))
}
