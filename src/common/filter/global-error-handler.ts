import type { FastifyError } from 'fastify';
import { type FastifyReply, type FastifyRequest } from 'fastify'
import type { ErrorResponse } from 'packages/shared-kernel'
import { ApplicationError, type ErrorDetails } from 'packages/shared-kernel'

export function globalErrorHandler(exception: FastifyError, req: FastifyRequest, reply: FastifyReply) {
  let status = 500
  let code = 'INTERNAL_SERVER_ERROR' as string
  let message = 'Internal server error'
  let details: ErrorDetails

  if (exception?.code === 'FST_ERR_VALIDATION') {
    reply.code(400)
    status = 400
    code = 'VALIDATION_ERROR'
    message = exception.message

    details = exception?.validation?.map((v: { instancePath?: string; message?: string }) => ({
      field: v.instancePath?.replace('/', '') || 'unknown',
      message: v.message,
    }))
  }

  if (exception instanceof ApplicationError) {
    reply.code(exception.statusCode)
    status = exception.statusCode
    code = exception.code
    message = exception.message

    if (exception.details !== undefined) {
      details = exception.details
    }
  }

  if (exception instanceof Error && !(exception instanceof ApplicationError)) {
    req.log.error(exception)
  }

  const body: ErrorResponse = {
    success: false,
    message,
    error: {
      code,
      details,
    },
    meta: {
      requestId: req.id,
      timestamp: new Date().toISOString(),
    },
  }

  reply.status(status).send(body)
}
