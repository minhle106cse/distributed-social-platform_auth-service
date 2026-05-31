import { ICommand, CommandOptions } from '@/common/cqrs'

export class RefreshCommand implements ICommand {
  readonly name = 'RefreshCommand'
  /**
   * MUST be transactional: marks old token as used AND creates new token.
   * If create fails without a transaction, user loses access permanently.
   */
  readonly options: CommandOptions = { transactional: true, retryable: true }
  constructor(
    public readonly refreshToken: string,
    public readonly decoded: { sub: string; email: string },
    public readonly ipAddress?: string,
    public readonly userAgent?: string,
  ) {}
}
