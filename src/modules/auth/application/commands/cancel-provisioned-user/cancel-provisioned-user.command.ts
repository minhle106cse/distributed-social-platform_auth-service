import type { ICommand } from '@distributed-social-platform/shared-kernel'

// Compensating action (saga rollback) for ProvisionUserCommand — called by
// core-api when org creation fails AFTER the owner's user was provisioned.
// Safety notes (kept from the removed CommandOptions block — ADR-0001 replaced the
// flag with the handler type, but the reasoning about replay/concurrency still applies):
// domain-guard: saga compensation — hard-deletes only if emailVerified=false (never a real user
// who slipped in during the race), so a replay is a guarded no-op. none: no duplicate-race.
export class CancelProvisionedUserCommand implements ICommand {
  readonly name = CancelProvisionedUserCommand.name
  constructor(public userId: string) {}
}
