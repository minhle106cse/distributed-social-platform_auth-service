import type { ICommand, CommandOptions } from '@distributed-social-platform/shared-kernel'

// Internal-only (gRPC AuthProvisioning.ProvisionUser) — creates a User with a
// server-generated random password. Distinct from RegisterCommand: the caller
// is core-api (System Admin org provisioning), not an end user typing a
// password of their own choosing.
export class ProvisionUserCommand implements ICommand {
  readonly name = ProvisionUserCommand.name
  readonly options: CommandOptions = { transactional: true, retryable: true }
  constructor(public email: string) {}
}
