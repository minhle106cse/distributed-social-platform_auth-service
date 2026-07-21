import { getTx } from '@distributed-social-platform/shared-kernel'
import { Prisma, type PrismaClient } from '@/generated'
import type { User } from '@/modules/user/domain/entities/user.entity'
import type { UserRepository } from '@/modules/user/domain/repositories/user.repository'
import { UserMapper } from '@/modules/user/infrastructure/mapper/user.mapper'
import { UserAlreadyExistsError } from '@/common/errors/user.error'

const rolesInclude = {
  roles: {
    include: {
      role: true,
    },
  },
} as const

export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string, includeDeleted = false): Promise<User | null> {
    const db = getTx<PrismaClient>() ?? this.prisma
    const record = await db.user.findFirst({
      where: { id, ...(includeDeleted ? {} : { deletedAt: null }) },
      include: { authIdentities: true, profile: true, ...rolesInclude },
    })
    if (!record) return null
    return UserMapper.toDomain(record)
  }

  async findByEmail(email: string, includeDeleted = false): Promise<User | null> {
    const db = getTx<PrismaClient>() ?? this.prisma
    const record = await db.user.findFirst({
      where: { email, ...(includeDeleted ? {} : { deletedAt: null }) },
      include: { authIdentities: true, profile: true, ...rolesInclude },
    })
    if (!record) return null
    return UserMapper.toDomain(record)
  }

  async create(user: User): Promise<void> {
    const db = getTx<PrismaClient>() ?? this.prisma
    try {
      await db.user.create({ data: UserMapper.toPersistence(user) })
    } catch (err) {
      // Handlers already do a check-then-create on email (findByEmail, then
      // create) — that read is inherently racy: two concurrent registrations
      // for the same email can both pass the check before either commits.
      // The unique constraint on `email` is the real guard; this just maps
      // its violation to the same domain error the check-then-create path
      // already throws, instead of letting a raw P2002 fall through as a
      // generic 500.
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new UserAlreadyExistsError()
      }
      throw err
    }
  }

  async save(user: User): Promise<void> {
    const db = getTx<PrismaClient>() ?? this.prisma

    await db.user.update({
      where: { id: user.id },
      data: UserMapper.toPersistenceUserData(user),
    })

    const profile = user.profile
    if (profile) {
      const profileData = UserMapper.toPersistenceProfileData(profile)
      await db.userProfile.upsert({
        where: { userId: user.id },
        create: { id: profile.id, userId: user.id, ...profileData },
        update: profileData,
      })
    }
  }

  async hardDelete(id: string): Promise<void> {
    const db = getTx<PrismaClient>() ?? this.prisma
    // authIdentities/refreshTokens/profile/roles cascade via onDelete: Cascade
    // in schema.prisma — a single delete is enough.
    await db.user.delete({ where: { id } })
  }
}
