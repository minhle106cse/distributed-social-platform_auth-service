import type { PrismaClient } from '@/generated'
import type { User } from '@/modules/user/domain/entities/user.entity'
import type { UserRepository } from '@/modules/user/domain/repositories/user.repository'
import { UserMapper } from '@/modules/user/infrastructure/mapper/user.mapper'
import { getTx } from '@/common/database/transaction.context'

const rolesInclude = {
  roles: {
    include: {
      role: {
        include: {
          permissions: { include: { permission: true } },
        },
      },
    },
  },
} as const

export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string, includeDeleted = false): Promise<User | null> {
    const db = (getTx() ?? this.prisma) as PrismaClient
    const record = await db.user.findFirst({
      where: { id, ...(includeDeleted ? {} : { deletedAt: null }) },
      include: { authIdentities: true, profile: true, ...rolesInclude },
    })
    if (!record) return null
    return UserMapper.toDomain(record)
  }

  async findByEmail(email: string, includeDeleted = false): Promise<User | null> {
    const db = (getTx() ?? this.prisma) as PrismaClient
    const record = await db.user.findFirst({
      where: { email, ...(includeDeleted ? {} : { deletedAt: null }) },
      include: { authIdentities: true, profile: true, ...rolesInclude },
    })
    if (!record) return null
    return UserMapper.toDomain(record)
  }

  async create(user: User): Promise<void> {
    const db = (getTx() ?? this.prisma) as PrismaClient
    await db.user.create({ data: UserMapper.toPersistence(user) })
  }

  async save(user: User): Promise<void> {
    const db = (getTx() ?? this.prisma) as PrismaClient

    await db.user.update({
      where: { id: user.id },
      data: UserMapper.toPersistenceUserData(user),
    })

    if (user.getProfile) {
      const profileData = UserMapper.toPersistenceProfileData(user.getProfile)
      await db.userProfile.upsert({
        where: { userId: user.id },
        create: { userId: user.id, ...profileData },
        update: profileData,
      })
    }
  }
}
