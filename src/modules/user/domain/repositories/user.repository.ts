import { type User } from '@/modules/user/domain/entities/user.entity'

export interface UserRepository {
  findById(id: string): Promise<User | null>
  findByEmail(email: string): Promise<User | null>
  create(user: User): Promise<void>
  save(user: User): Promise<void>
}
