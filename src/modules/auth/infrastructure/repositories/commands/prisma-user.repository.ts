import type { PrismaClient } from '@/generated'
import type { User } from '@/modules/auth/domain/entities/user.entity'
import type { UserRepository } from '@/modules/auth/domain/repositories/user.repository'
import { UserMapper } from '@/modules/auth/infrastructure/mapper/user.mapper'
import { getTx } from '@/common/database/transaction.context'

export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByEmail(email: string): Promise<User | null> {
    const db = (getTx() ?? this.prisma) as PrismaClient;
    const record = await db.user.findUnique({
      where: { email },
      include: { authMethods: true },
    })

    if (!record) return null

    return UserMapper.toDomain(record)
  }

  async create(user: User): Promise<void> {
    const data = UserMapper.toCreatePersistence(user)
    const db = (getTx() ?? this.prisma) as PrismaClient;
    await db.user.create({ data })
  }
}
