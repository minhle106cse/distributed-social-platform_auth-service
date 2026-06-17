import type { FastifyRequest, FastifyReply } from 'fastify'

export function httpLoggingHook(
  req: FastifyRequest,
  reply: FastifyReply,
) {
  if (req.url === '/health' || req.url === '/metrics') {
    return
  }
  const startTime = process.hrtime.bigint()

  const durationMs =
    Number(process.hrtime.bigint() - startTime) / 1_000_000

  const payload = {
    requestId: req.id,
    method: req.method,
    route: req.routeOptions?.url,
    url: req.url,
    statusCode: reply.statusCode,
    durationMs: Number(durationMs.toFixed(2)),
    ip: req.ip,
    userAgent: req.headers['user-agent'],
  }

  if (reply.statusCode >= 500) {
    req.log.error(payload, 'HTTP request failed')
    return
  }

  if (reply.statusCode >= 400) {
    req.log.warn(payload, 'HTTP request client error')
    return
  }

  req.log.info(payload, 'HTTP request success')
}
