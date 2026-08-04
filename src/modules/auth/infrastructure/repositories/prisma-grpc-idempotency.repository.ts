import type { Prisma } from '@/generated'
import type {
  GrpcIdempotencyRecord,
  IGrpcIdempotencyRepository,
} from '@/modules/auth/domain/repositories/grpc-idempotency.repository'

export class PrismaGrpcIdempotencyRepository implements IGrpcIdempotencyRepository {
  constructor(private readonly db: Prisma.TransactionClient) {}

  async findByKey(key: string): Promise<GrpcIdempotencyRecord | null> {
    const record = await this.db.grpcIdempotencyRecord.findUnique({ where: { key } })
    return record ? { userId: record.userId, email: record.email } : null
  }

  async create(key: string, userId: string, email: string, expiresAt: Date): Promise<void> {
    // No P2002 handling: a race would need two concurrent gRPC calls carrying
    // the EXACT SAME idempotency key, on an internal System-Admin-only RPC —
    // low enough odds that a raw 500 on the loser is an acceptable trade-off
    // against adding speculative race-recovery code for it.
    await this.db.grpcIdempotencyRecord.create({ data: { key, userId, email, expiresAt } })
  }
}
