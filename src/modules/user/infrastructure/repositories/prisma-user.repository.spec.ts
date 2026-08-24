import { PrismaUserRepository } from './prisma-user.repository'
import { Prisma, type PrismaClient } from '@/generated'
import { UserAlreadyExistsError } from '@/modules/user/domain/user.error'
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

  describe('findByEmail / findById — includeDeleted escape hatch', () => {
    // Regression test: the SOFT_DELETE_MODELS extension (prisma.client.ts) only
    // auto-injects `deletedAt: null` when the `where` object is MISSING the
    // 'deletedAt' key entirely (`!('deletedAt' in where)`). `{ deletedAt: undefined }`
    // still has the key present, so the extension leaves it alone — but the
    // OLD code passed `...(includeDeleted ? {} : { deletedAt: null })`, which for
    // includeDeleted=true produced `{}` (key absent), letting the extension silently
    // re-inject `deletedAt: null` anyway. That made findByEmail(email, true) — used by
    // login.handler.ts to find soft-deleted accounts for the recovery flow — always
    // behave identically to includeDeleted=false. Asserting the exact `where` shape here
    // is what would have caught it (a mocked resolved value alone would not).

    it('findByEmail(email, false) → where includes deletedAt: null (visible-only)', async () => {
      const findFirst = jest.fn().mockResolvedValue(null)
      const mockPrisma = { user: { findFirst } } as unknown as PrismaClient
      const repo = new PrismaUserRepository(mockPrisma)

      await repo.findByEmail('a@example.com', false)

      expect(findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: { email: 'a@example.com', deletedAt: null } }),
      )
    })

    it('findByEmail(email, true) → where has deletedAt KEY PRESENT as undefined (includes soft-deleted)', async () => {
      const findFirst = jest.fn().mockResolvedValue(null)
      const mockPrisma = { user: { findFirst } } as unknown as PrismaClient
      const repo = new PrismaUserRepository(mockPrisma)

      await repo.findByEmail('a@example.com', true)

      const calledWhere = findFirst.mock.calls[0][0].where
      expect('deletedAt' in calledWhere).toBe(true)
      expect(calledWhere.deletedAt).toBeUndefined()
    })

    it('findById(id, true) → where has deletedAt KEY PRESENT as undefined (includes soft-deleted)', async () => {
      const findFirst = jest.fn().mockResolvedValue(null)
      const mockPrisma = { user: { findFirst } } as unknown as PrismaClient
      const repo = new PrismaUserRepository(mockPrisma)

      await repo.findById('u1', true)

      const calledWhere = findFirst.mock.calls[0][0].where
      expect('deletedAt' in calledWhere).toBe(true)
      expect(calledWhere.deletedAt).toBeUndefined()
    })
  })
})
