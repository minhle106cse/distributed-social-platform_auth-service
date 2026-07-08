import { type User } from '@/modules/user/domain/entities/user.entity'

export interface UserRepository {
  findById(id: string, includeDeleted?: boolean): Promise<User | null>
  findByEmail(email: string, includeDeleted?: boolean): Promise<User | null>
  create(user: User): Promise<void>
  save(user: User): Promise<void>
  // Real delete (not the deletedAt soft-delete) — only for rolling back a
  // just-provisioned user in a saga compensation, never for a real lifecycle
  // event on an activated account.
  hardDelete(id: string): Promise<void>
}
