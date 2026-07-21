import type { ICommand, CommandOptions } from '@distributed-social-platform/shared-kernel'

// Internal-only (gRPC AuthProvisioning.ProvisionUser) — creates a User with a
// server-generated random password. Distinct from RegisterCommand: the caller
// is core-api (System Admin org provisioning), not an end user typing a
// password of their own choosing.
export class ProvisionUserCommand implements ICommand {
  readonly name = ProvisionUserCommand.name
  readonly options: CommandOptions = {
    transactional: true,
    // domain-guard: gRPC saga step — an existing email resolves to a tagged { alreadyExists } instead
    // of throwing (so the org saga can proceed). unique-constraint: email uniqueness is the backstop.
  }
  constructor(public email: string) {}
}
