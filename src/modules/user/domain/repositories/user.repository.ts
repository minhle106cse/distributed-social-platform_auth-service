import { type User } from '@/modules/user/domain/entities/user.entity'

export interface IUserRepository {
  findById(id: string, includeDeleted?: boolean): Promise<User | null>
  findByEmail(email: string, includeDeleted?: boolean): Promise<User | null>
  create(user: User): Promise<void>
  save(user: User): Promise<void>
  // Real delete (not the deletedAt soft-delete) — only for rolling back a
  // just-provisioned user in a saga compensation, never for a real lifecycle
  // event on an activated account.
  hardDelete(id: string): Promise<void>
  // Re-issues the LOCAL AuthIdentity's password hash without touching anything
  // else on the user — used only when ProvisionUserHandler sees a repeated
  // idempotency key: a fresh temp password is safer than persisting the
  // original one at rest for later replay (review of ADR-0001, 2026-07-30).
  updateLocalPasswordHash(userId: string, passwordHash: string): Promise<void>
}
