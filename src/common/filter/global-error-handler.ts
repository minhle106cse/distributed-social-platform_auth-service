import type { FastifyError } from 'fastify';
import { type FastifyReply, type FastifyRequest } from 'fastify'
import type { ErrorResponse } from 'packages/shared-kernel'
import { ApplicationError, type ErrorDetails } from 'packages/shared-kernel'

export function globalErrorHandler(exception: FastifyError, req: FastifyRequest, reply: FastifyReply) {
  let status = 500
  let code = 'INTERNAL_SERVER_ERROR' as string
  let message = 'Internal server error'
  let userMessage = 'An unexpected error occurred'
  let details: ErrorDetails

  if (exception?.code === 'FST_ERR_VALIDATION') {
    status = 400
    code = 'VALIDATION_ERROR'
    message = exception.message
    userMessage = 'Invalid request data'

    details = exception?.validation?.map((v: { instancePath?: string; message?: string }) => ({
      field: v.instancePath?.replace('/', '') || 'unknown',
      message: v.message,
    }))
  }

  if (exception instanceof ApplicationError) {
    status = exception.statusCode
    code = exception.code
    message = exception.message
    userMessage = exception.userMessage || userMessage

    if (exception.details !== undefined) {
      details = exception.details
    }
  }

  if (exception instanceof Error && !(exception instanceof ApplicationError)) {
    req.log.error(exception)
  }

  const body: ErrorResponse = {
    success: false,
    message: userMessage,
    error: {
      code,
      message,
      details,
    },
    meta: {
      requestId: req.id,
      timestamp: new Date().toISOString(),
    },
  }

  reply.status(status).send(body)
}
