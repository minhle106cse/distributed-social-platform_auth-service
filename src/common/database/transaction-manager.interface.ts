/**
 * Abstract interface for transaction management.
 * Decouples the TransactionMiddleware from any specific ORM.
 * Implementations are wired in the Infra layer (e.g. PrismaTransactionManager).
 */
export interface ITransactionManager {
  run<R>(callback: () => Promise<R>): Promise<R>;
}
