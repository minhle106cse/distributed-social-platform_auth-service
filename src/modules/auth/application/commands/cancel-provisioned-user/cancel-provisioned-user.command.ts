import type { ICommand, CommandOptions } from '@distributed-social-platform/shared-kernel'

// Compensating action (saga rollback) for ProvisionUserCommand — called by
// core-api when org creation fails AFTER the owner's user was provisioned.
export class CancelProvisionedUserCommand implements ICommand {
  readonly name = CancelProvisionedUserCommand.name
  readonly options: CommandOptions = {
    transactional: true,
    // domain-guard: saga compensation — hard-deletes only if emailVerified=false (never a real user
    // who slipped in during the race), so a replay is a guarded no-op. none: no duplicate-race.
  }
  constructor(public userId: string) {}
}
