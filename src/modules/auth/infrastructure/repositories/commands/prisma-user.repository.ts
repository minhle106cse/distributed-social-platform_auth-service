import type { PrismaClient } from '@/generated'
import type { User } from '@/modules/auth/domain/entities/user.entity'
import type { UserRepository } from '@/modules/auth/domain/repositories/user.repository'
import { UserMapper } from '@/modules/auth/infrastructure/mapper/user.mapper'

export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByEmail(email: string): Promise<User | null> {
    const record = await this.prisma.user.findUnique({
      where: { email },
      include: { authMethods: true },
    })

    if (!record) return null

    return UserMapper.toDomain(record)
  }

  async create(user: User): Promise<void> {
    const data = UserMapper.toCreatePersistence(user)
    await this.prisma.user.create({ data })
  }
}
