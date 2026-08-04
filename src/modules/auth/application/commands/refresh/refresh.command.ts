import type { ICommand } from '@distributed-social-platform/shared-kernel'

// Safety notes (kept from the removed CommandOptions block — ADR-0001 replaced the
// flag with the handler type, but the reasoning about replay/concurrency still applies):
// domain-guard: refresh token is single-use (usedAt) — a replay throws RefreshTokenUsedError and
// revokes the whole family (theft response). none: no duplicate-creation race. transactional:true
// → safe to auto-retry on deadlock.
export class RefreshCommand implements ICommand {
  readonly name = RefreshCommand.name
  /**
   * MUST be transactional: marks old token as used AND creates new token.
   * If create fails without a transaction, user loses access permanently.
   */
  constructor(
    public readonly refreshToken: string,
    public readonly ipAddress?: string,
    public readonly userAgent?: string,
  ) {}
}
