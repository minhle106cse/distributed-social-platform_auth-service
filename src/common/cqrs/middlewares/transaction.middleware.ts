import { ICommandMiddleware, NextFn, ICommand } from '@/common/cqrs';
import { ITransactionManager } from '@/common/database/transaction-manager.interface';
import { ILogger } from '@distributed-social-platform/shared-kernel';

/**
 * Wraps each command execution in a database transaction.
 * Uses ITransactionManager so this class has zero knowledge of any specific ORM.
 * Respects Hexagonal Architecture: no Prisma imports here.
 */
export class TransactionMiddleware implements ICommandMiddleware {
  constructor(
    private readonly transactionManager: ITransactionManager,
    private readonly logger: ILogger,
  ) {}

  async execute<T extends ICommand, R = any>(command: T, next: NextFn<R>): Promise<R> {
    if (!command.options?.transactional) {
      return next();
    }

    this.logger.debug(`[TransactionMiddleware] Starting transaction for ${command.name}`);

    return await this.transactionManager.run(async () => {
      try {
        const result = await next();
        this.logger.debug(`[TransactionMiddleware] Transaction committed for ${command.name}`);
        return result;
      } catch (error) {
        this.logger.debug(`[TransactionMiddleware] Transaction rolled back for ${command.name} due to error`);
        throw error;
      }
    });
  }
}
