import { Prisma } from '@/generated'
import type { User } from '@/modules/user/domain/entities/user.entity'
import type { IUserRepository } from '@/modules/user/domain/repositories/user.repository'
import { UserMapper } from '@/modules/user/infrastructure/mapper/user.mapper'
import { UserAlreadyExistsError } from '@/common/errors/user.error'

const rolesInclude = {
  roles: {
    include: {
      role: true,
    },
  },
} as const

export class PrismaUserRepository implements IUserRepository {
  constructor(private readonly db: Prisma.TransactionClient) {}

  async findById(id: string, includeDeleted = false): Promise<User | null> {
    const record = await this.db.user.findFirst({
      // `deletedAt: undefined` (not `{}`) keeps the key PRESENT — the SOFT_DELETE_MODELS
      // extension only auto-injects `deletedAt: null` when the key is absent from `where`.
      // A present key, even `undefined`, is the documented escape hatch (database_standard.md).
      where: { id, deletedAt: includeDeleted ? undefined : null },
      include: { authIdentities: true, profile: true, ...rolesInclude },
    })
    if (!record) return null
    return UserMapper.toDomain(record)
  }

  async findByEmail(email: string, includeDeleted = false): Promise<User | null> {
    const record = await this.db.user.findFirst({
      where: { email, deletedAt: includeDeleted ? undefined : null },
      include: { authIdentities: true, profile: true, ...rolesInclude },
    })
    if (!record) return null
    return UserMapper.toDomain(record)
  }

  async create(user: User): Promise<void> {
    try {
      await this.db.user.create({ data: UserMapper.toPersistence(user) })
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
    await this.db.user.update({
      where: { id: user.id },
      data: UserMapper.toPersistenceUserData(user),
    })

    const profile = user.profile
    if (profile) {
      const profileData = UserMapper.toPersistenceProfileData(profile)
      await this.db.userProfile.upsert({
        where: { userId: user.id },
        create: { id: profile.id, userId: user.id, ...profileData },
        update: profileData,
      })
    }
  }

  async hardDelete(id: string): Promise<void> {
    // authIdentities/refreshTokens/profile/roles cascade via onDelete: Cascade
    // in schema.prisma — a single delete is enough.
    await this.db.user.delete({ where: { id } })
  }

  async updateLocalPasswordHash(userId: string, passwordHash: string): Promise<void> {
    await this.db.authIdentity.updateMany({
      where: { userId, provider: 'LOCAL' },
      data: { passwordHash },
    })
  }
}
