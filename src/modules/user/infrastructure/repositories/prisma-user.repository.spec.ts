import { Prisma, type PrismaClient } from '@/generated'
import { PrismaUserRepository } from './prisma-user.repository'
import { UserAlreadyExistsError } from '@/common/errors/user.error'
import { User } from '@/modules/user/domain/entities/user.entity'

describe('PrismaUserRepository', () => {
  describe('create', () => {
    it('nên map P2002 (unique email) sang UserAlreadyExistsError thay vì để lộ lỗi Prisma thô', async () => {
      const p2002 = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: 'test',
      })
      const mockPrisma = {
        user: { create: jest.fn().mockRejectedValueOnce(p2002) },
      } as unknown as PrismaClient
      const repo = new PrismaUserRepository(mockPrisma)

      const user = await User.create(
        { email: 'dup@example.com', password: 'plain-pass' },
        { hash: jest.fn().mockResolvedValue('hashed'), verify: jest.fn() },
      )

      // Xác nhận đây đúng là race check-then-create (không phải lỗi Prisma
      // khác) — 2 request register cùng email đồng thời đều pass qua
      // findByEmail trước khi commit, nên unique constraint ở DB mới là
      // guard thật; create() phải map nó về đúng domain error, không để
      // rơi xuống 500 generic.
      await expect(repo.create(user)).rejects.toThrow(UserAlreadyExistsError)
    })

    it('nên rethrow nguyên trạng lỗi Prisma khác không phải P2002', async () => {
      const otherError = new Prisma.PrismaClientKnownRequestError('Some other error', {
        code: 'P2025',
        clientVersion: 'test',
      })
      const mockPrisma = {
        user: { create: jest.fn().mockRejectedValueOnce(otherError) },
      } as unknown as PrismaClient
      const repo = new PrismaUserRepository(mockPrisma)

      const user = await User.create(
        { email: 'x@example.com', password: 'plain-pass' },
        { hash: jest.fn().mockResolvedValue('hashed'), verify: jest.fn() },
      )

      await expect(repo.create(user)).rejects.toBe(otherError)
    })
  })
})
