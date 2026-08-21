import { randomBytes } from 'crypto'
import type { ITransactionalCommandHandler } from '@distributed-social-platform/shared-kernel'
import type { ProvisionUserCommand } from './provision-user.command'
import type { AuthServiceRepos } from '@/container/repos'
import { UserAlreadyExistsError, IdempotencyKeyConflictError } from '@/common/errors/user.error'
import { User } from '@/modules/user/domain/entities/user.entity'
import type { IPasswordService } from '@/modules/auth/domain/services/password.service'

export interface ProvisionUserResult {
  userId: string
  temporaryPassword: string
}

// Matches core-api's IdempotencyRecord TTL (resilience_patterns.md §1.1) — no
// reason for this one to differ.
const IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1000

export class ProvisionUserHandler implements ITransactionalCommandHandler<
  ProvisionUserCommand,
  ProvisionUserResult,
  AuthServiceRepos
> {
  readonly kind = 'transactional' as const

  constructor(public readonly passwordService: IPasswordService) {}

  async execute(command: ProvisionUserCommand, tx: AuthServiceRepos): Promise<ProvisionUserResult> {
    const { email, idempotencyKey } = command

    if (idempotencyKey) {
      const existing = await tx.grpcIdempotency.findByKey(idempotencyKey)
      if (existing) {
        // The key alone is not enough to prove this is the SAME logical
        // request replaying — without checking email, two different requests
        // that happen to collide on the same key (client bug, or a key reused
        // across admins) would silently hand back a live temp password for
        // an unrelated account. Reject instead of guessing.
        if (existing.email !== email) {
          throw new IdempotencyKeyConflictError()
        }
        // Genuine retry — the FIRST attempt already committed this user, but
        // its response was lost before core-api's saga ever saw the userId
        // (review of ADR-0001, 2026-07-30). Re-issue a FRESH temp password
        // rather than trying to recover the original one: it was never
        // persisted at rest (see GrpcIdempotencyRecord's doc), and rotating on
        // an ambiguous-delivery retry is the safer call anyway.
        const temporaryPassword = randomBytes(12).toString('base64url')
        const passwordHash = await this.passwordService.hash(temporaryPassword)
        await tx.users.updateLocalPasswordHash(existing.userId, passwordHash)
        return { userId: existing.userId, temporaryPassword }
      }
    }

    const existingUser = await tx.users.findByEmail(email)
    if (existingUser) {
      throw new UserAlreadyExistsError()
    }

    const temporaryPassword = randomBytes(12).toString('base64url')
    const user = await User.create(
      { email, password: temporaryPassword, provisionedViaSaga: true },
      this.passwordService,
    )
    await tx.users.create(user)

    if (idempotencyKey) {
      await tx.grpcIdempotency.create(
        idempotencyKey,
        user.id,
        email,
        new Date(Date.now() + IDEMPOTENCY_TTL_MS),
      )
    }

    return { userId: user.id, temporaryPassword }
  }
}
