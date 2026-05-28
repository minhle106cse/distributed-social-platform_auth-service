import { type User } from '@/modules/auth/domain/entities/user.entity'

export interface UserRepository {
  findByEmail(email: string): Promise<User | null>
  create(user: User): Promise<void>
}
