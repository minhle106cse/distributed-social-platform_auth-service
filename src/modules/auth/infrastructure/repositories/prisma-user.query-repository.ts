import type { PrismaClient } from '@/generated'
import type { UserQueryRepository } from '@/modules/auth/application/repositories/user.query-repository'
import type { GetMeDto } from '@/modules/auth/application/queries/get-me/get-me.dto'

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
      },
    })

    return user
  }
}
