import type { ICommand, CommandOptions } from '@distributed-social-platform/shared-kernel'

// Compensating action (saga rollback) for ProvisionUserCommand — called by
// core-api when org creation fails AFTER the owner's user was provisioned.
export class CancelProvisionedUserCommand implements ICommand {
  readonly name = CancelProvisionedUserCommand.name
  readonly options: CommandOptions = { transactional: true, retryable: true }
  constructor(public userId: string) {}
}
