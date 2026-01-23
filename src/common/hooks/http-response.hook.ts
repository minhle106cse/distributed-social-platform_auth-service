import { Readable } from 'node:stream'
import type { FastifyReply, FastifyRequest } from 'fastify'

export function httpResponseHook(
  req: FastifyRequest,
  reply: FastifyReply,
  payload: unknown,
) {
  const routeConfig = req.routeOptions.config as { skipResponseWrapper?: boolean } | undefined

  if (reply.statusCode >= 400) {
    return payload
  }

  if (routeConfig?.skipResponseWrapper) {
    return payload
  }

  if (payload && typeof payload === 'object' && 'success' in payload) {
    return payload
  }

  if (
    Buffer.isBuffer(payload) ||
    payload instanceof Uint8Array ||
    payload instanceof Readable
  ) {
    return payload
  }

  return {
    success: true,
    data: payload,
    meta: {
      requestId: req.id,
      timestamp: new Date().toISOString(),
    },
  }
}
