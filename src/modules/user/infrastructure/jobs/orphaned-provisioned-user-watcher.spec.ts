import type { ILogger } from '@distributed-social-platform/shared-kernel'
import { startOrphanedProvisionedUserWatcher } from './orphaned-provisioned-user-watcher'

describe('startOrphanedProvisionedUserWatcher', () => {
  let logger: jest.Mocked<ILogger>
  let count: jest.Mock

  beforeEach(() => {
    jest.useFakeTimers()
    logger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    }
    count = jest.fn().mockResolvedValue(0)
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  const prisma = () => ({ client: { user: { count } } })

  it('nên query đúng điều kiện: provisionedViaSaga:true, emailVerified:false, createdAt trước cutoff 24h', async () => {
    const watcher = startOrphanedProvisionedUserWatcher(prisma(), logger, 1000)

    await jest.advanceTimersByTimeAsync(1000)

    expect(count).toHaveBeenCalledWith({
      where: {
        provisionedViaSaga: true,
        emailVerified: false,
        createdAt: { lt: expect.any(Date) },
      },
    })
    watcher.stop()
  })

  it('KHÔNG log warn khi không tìm thấy orphan nào', async () => {
    count.mockResolvedValue(0)
    const watcher = startOrphanedProvisionedUserWatcher(prisma(), logger, 1000)

    await jest.advanceTimersByTimeAsync(1000)

    expect(logger.warn).not.toHaveBeenCalled()
    watcher.stop()
  })

  it('log warn (KHÔNG xoá gì) khi tìm thấy orphan — chỉ quan sát, không tự động remediate', async () => {
    count.mockResolvedValue(3)
    const watcher = startOrphanedProvisionedUserWatcher(prisma(), logger, 1000)

    await jest.advanceTimersByTimeAsync(1000)

    expect(logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({ count: 3 }),
      expect.stringContaining('possible orphan'),
    )
    watcher.stop()
  })

  it('log error (không throw) khi query thất bại', async () => {
    count.mockRejectedValue(new Error('db down'))
    const watcher = startOrphanedProvisionedUserWatcher(prisma(), logger, 1000)

    await jest.advanceTimersByTimeAsync(1000)

    expect(logger.error).toHaveBeenCalledWith(
      expect.objectContaining({ err: expect.any(Error) }),
      expect.stringContaining('watcher check failed'),
    )
    watcher.stop()
  })

  it('stop() dừng interval — không còn query nào sau khi gọi stop', async () => {
    const watcher = startOrphanedProvisionedUserWatcher(prisma(), logger, 1000)
    await jest.advanceTimersByTimeAsync(1000)
    expect(count).toHaveBeenCalledTimes(1)

    watcher.stop()
    await jest.advanceTimersByTimeAsync(5000)

    expect(count).toHaveBeenCalledTimes(1)
  })
})
