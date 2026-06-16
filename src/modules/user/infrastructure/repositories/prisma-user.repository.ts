import type { PrismaClient } from '@/generated'
import type { User } from '@/modules/user/domain/entities/user.entity'
import type { UserRepository } from '@/modules/user/domain/repositories/user.repository'
import { UserMapper } from '@/modules/user/infrastructure/mapper/user.mapper'
import { getTx } from '@/common/database/transaction.context'

export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaClient) { }

  async findById(id: string): Promise<User | null> {
    const db = (getTx() ?? this.prisma) as PrismaClient;
    const record = await db.user.findUnique({
      where: { id },
      include: {
        authIdentities: true,
        profile: true,
        roles: {
          include: { 
            role: {
              include: {
                permissions: {
                  include: { permission: true }
                }
              }
            }
          }
        }
      },
    })

    if (!record) return null

    return UserMapper.toDomain(record)
  }

  async findByEmail(email: string): Promise<User | null> {
    const db = (getTx() ?? this.prisma) as PrismaClient;
    const record = await db.user.findUnique({
      where: { email },
      include: {
        authIdentities: true,
        profile: true,
        roles: {
          include: { 
            role: {
              include: {
                permissions: {
                  include: { permission: true }
                }
              }
            }
          }
        }
      },
    })

    if (!record) return null

    return UserMapper.toDomain(record)
  }

  async create(user: User): Promise<void> {
    const data = UserMapper.toPersistence(user)
    const db = (getTx() ?? this.prisma) as PrismaClient;
    await db.user.create({ data })
  }

  async save(user: User): Promise<void> {
    const db = (getTx() ?? this.prisma) as PrismaClient;
    
    // Update main user fields
    await db.user.update({
      where: { id: user.id },
      data: UserMapper.toPersistenceUserData(user),
    });

    // Upsert profile
    if (user.getProfile) {
      const profileData = UserMapper.toPersistenceProfileData(user.getProfile);
      await db.userProfile.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          ...profileData,
        },
        update: profileData,
      });
    }
  }
}
