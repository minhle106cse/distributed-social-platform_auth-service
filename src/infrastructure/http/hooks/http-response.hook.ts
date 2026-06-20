import { Readable } from 'node:stream'
import type { FastifyReply, FastifyRequest } from 'fastify'
import { ApiResponse, ResponseFormatError, buildSuccessBody } from '@distributed-social-platform/shared-kernel'

// eslint-disable-next-line @typescript-eslint/require-await
export async function httpResponseHook(req: FastifyRequest, reply: FastifyReply, payload: unknown) {
  const routeConfig = req.routeOptions.config as { skipResponseWrapper?: boolean } | undefined

  if (reply.statusCode >= 400) return payload
  if (routeConfig?.skipResponseWrapper) return payload
  if (Buffer.isBuffer(payload) || payload instanceof Uint8Array || payload instanceof Readable) return payload

  if (payload instanceof ApiResponse) {
    reply.code(payload.statusCode)
    return buildSuccessBody({ data: payload.data, message: payload.message, requestId: req.id })
  }

  throw new ResponseFormatError()
}
