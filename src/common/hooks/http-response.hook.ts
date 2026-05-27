import { Readable } from 'node:stream'
import type { FastifyReply, FastifyRequest } from 'fastify'
import { HttpResponseBuilder, HttpResponseError } from 'packages/shared-kernel'

// eslint-disable-next-line @typescript-eslint/require-await
export async function httpResponseHook(req: FastifyRequest, reply: FastifyReply, payload: unknown) {
  const routeConfig = req.routeOptions.config as { skipResponseWrapper?: boolean } | undefined

  if (reply.statusCode >= 400) {
    return payload
  }

  if (routeConfig?.skipResponseWrapper) {
    return payload
  }

  if (Buffer.isBuffer(payload) || payload instanceof Uint8Array || payload instanceof Readable) {
    return payload
  }

  if (payload instanceof HttpResponseBuilder) {
    reply.code(payload.statusCode)

    return {
      success: payload.success,
      data: payload.data,
      message: payload.message,
      meta: {
        requestId: req.id,
        timestamp: new Date().toISOString(),
      },
    }
  }

  throw new HttpResponseError()
}
