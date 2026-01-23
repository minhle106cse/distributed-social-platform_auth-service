import { type User } from '../../domain/entities/user.entity'
import { type UserRepository } from '../../domain/repositories/user.repository'
import { UserMapper } from '../mapper/user.mapper'

export class PrismaUserRepository implements UserRepository {
  async findByEmail(email: string): Promise<User | null> {
    const record = await prisma.user.findUnique({ where: { email }, include: { authMethods: true } })
    if (!record) return null
    return UserMapper.toDomain(record)
  }
}
