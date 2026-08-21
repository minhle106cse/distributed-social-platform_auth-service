import type { CommandBus, ILogger } from '@distributed-social-platform/shared-kernel'
import { AuthProvisioningGrpcService } from './auth-provisioning.grpc-service'
import { config } from '@/config'

// Minimal fake grpc-js ServerUnaryCall — only what verifyInternalGrpcSecret +
// the handler bodies actually read (metadata.get, request).
function buildCall(secret: string | undefined, request: Record<string, unknown> = {}) {
  return {
    metadata: {
      get: (key: string) => (key === 'x-internal-secret' && secret !== undefined ? [secret] : []),
    },
    request,
  } as any
}

describe('AuthProvisioningGrpcService — internal-secret rejection logging (2026-07-25, previously silent)', () => {
  let mockCommandBus: jest.Mocked<CommandBus>
  let mockLogger: jest.Mocked<ILogger>
  let service: AuthProvisioningGrpcService

  beforeEach(() => {
    mockCommandBus = { execute: jest.fn() } as unknown as jest.Mocked<CommandBus>
    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    }
    service = new AuthProvisioningGrpcService(mockCommandBus, mockLogger)
  })

  it('provisionUser: logs a warn and rejects when the internal secret is wrong', async () => {
    const callback = jest.fn()
    service.provisionUser(buildCall('wrong-secret', { email: 'a@b.com' }), callback)
    await new Promise((r) => setImmediate(r))

    expect(callback).toHaveBeenCalledWith(expect.objectContaining({ code: expect.any(Number) }))
    expect(mockCommandBus.execute).not.toHaveBeenCalled()
    expect(mockLogger.warn).toHaveBeenCalledWith(
      expect.objectContaining({ context: 'GrpcLayer' }),
      expect.stringContaining('invalid internal secret'),
    )
  })

  it('provisionUser: does NOT log the rejection warn when the secret is correct', async () => {
    mockCommandBus.execute.mockResolvedValueOnce({ userId: 'u1', temporaryPassword: 'tmp' })
    const callback = jest.fn()
    service.provisionUser(
      buildCall(config.internalGrpcSharedSecret, { email: 'a@b.com' }),
      callback,
    )
    await new Promise((r) => setImmediate(r))

    expect(mockLogger.warn).not.toHaveBeenCalled()
  })

  it('cancelProvisionedUser: logs a warn and rejects when the internal secret is wrong', async () => {
    const callback = jest.fn()
    service.cancelProvisionedUser(buildCall('wrong-secret', { userId: 'u1' }), callback)
    await new Promise((r) => setImmediate(r))

    expect(mockCommandBus.execute).not.toHaveBeenCalled()
    expect(mockLogger.warn).toHaveBeenCalledWith(
      expect.objectContaining({ context: 'GrpcLayer' }),
      expect.stringContaining('invalid internal secret'),
    )
  })
})
