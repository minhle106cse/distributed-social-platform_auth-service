import type { PrismaClient } from '@/generated'
import type { UserQueryRepository } from '@/modules/user/application/repositories/user.query-repository'
import type { GetMeDto } from '@/modules/user/application/queries/get-me/get-me.dto'

export class PrismaUserQueryRepository implements UserQueryRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async getMe(userId: string): Promise<GetMeDto | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        isActive: true,
        emailVerified: true,
        createdAt: true,
        roles: {
          include: { 
            role: {
              include: {
                permissions: {
                  include: { permission: true }
                }
              }
            }
          },
        },
        profile: true,
      },
    })

    if (!user) return null

    const permissions = new Set<string>();
    user.roles.forEach(ur => {
      ur.role.permissions.forEach(rp => {
        permissions.add(rp.permission.code);
      });
    });

    return {
      id: user.id,
      email: user.email,
      isActive: user.isActive,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
      roles: user.roles.map(r => r.role.code),
      permissions: Array.from(permissions),
      profile: user.profile ? {
        firstName: user.profile.firstName,
        lastName: user.profile.lastName,
        displayName: user.profile.displayName,
        avatarUrl: user.profile.avatarUrl,
        phoneNumber: user.profile.phoneNumber,
      } : null,
    }
  }
}
