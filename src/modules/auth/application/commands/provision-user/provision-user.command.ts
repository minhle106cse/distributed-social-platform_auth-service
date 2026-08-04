import type { ICommand } from '@distributed-social-platform/shared-kernel'

// Internal-only (gRPC AuthProvisioning.ProvisionUser) — creates a User with a
// server-generated random password. Distinct from RegisterCommand: the caller
// is core-api (System Admin org provisioning), not an end user typing a
// password of their own choosing.
// Safety notes (kept from the removed CommandOptions block — ADR-0001 replaced the
// flag with the handler type, but the reasoning about replay/concurrency still applies):
// domain-guard: gRPC saga step — an existing email resolves to a tagged { alreadyExists } instead
// of throwing (so the org saga can proceed). unique-constraint: email uniqueness is the backstop.
export class ProvisionUserCommand implements ICommand {
  readonly name = ProvisionUserCommand.name
  constructor(
    public email: string,
    // Threaded from core-api's own X-Idempotency-Key over gRPC (review of
    // ADR-0001, 2026-07-30) — a repeated key recovers the SAME user (fresh
    // temp password re-issued) instead of failing with UserAlreadyExistsError
    // on a genuine client retry whose first response was lost after this
    // service had already committed. Undefined = caller sent none.
    public idempotencyKey?: string,
  ) {}
}
