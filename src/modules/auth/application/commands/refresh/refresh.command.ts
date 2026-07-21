import type { ICommand, CommandOptions } from '@distributed-social-platform/shared-kernel'

export class RefreshCommand implements ICommand {
  readonly name = RefreshCommand.name
  /**
   * MUST be transactional: marks old token as used AND creates new token.
   * If create fails without a transaction, user loses access permanently.
   */
  readonly options: CommandOptions = {
    transactional: true,
    // domain-guard: refresh token is single-use (usedAt) — a replay throws RefreshTokenUsedError and
    // revokes the whole family (theft response). none: no duplicate-creation race. transactional:true
    // → safe to auto-retry on deadlock.
  }
  constructor(
    public readonly refreshToken: string,
    public readonly ipAddress?: string,
    public readonly userAgent?: string,
  ) {}
}
