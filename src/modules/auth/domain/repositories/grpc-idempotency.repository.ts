export interface GrpcIdempotencyRecord {
  userId: string
  email: string
}

/**
 * Write side of the AuthProvisioning.ProvisionUser idempotency cache — see
 * schema.prisma's GrpcIdempotencyRecord doc for why it exists (review of
 * ADR-0001, 2026-07-30). Read-then-create is intentionally check-then-write,
 * not a separate atomicity mechanism: the `key` column's own unique
 * constraint is the real guard under a race (mirrors PrismaUserRepository's
 * own reasoning for `create()`'s email uniqueness).
 */
export interface IGrpcIdempotencyRepository {
  findByKey(key: string): Promise<GrpcIdempotencyRecord | null>
  create(key: string, userId: string, email: string, expiresAt: Date): Promise<void>
}
