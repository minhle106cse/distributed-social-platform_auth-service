import type { ICommand, CommandOptions } from '@distributed-social-platform/shared-kernel'

export class CreateRoleCommand implements ICommand {
  readonly name = CreateRoleCommand.name
  readonly options: CommandOptions = { transactional: false, retryable: false }

  constructor(
    public readonly code: string,
    public readonly nameRole: string, // named nameRole to avoid shadowing
    public readonly description?: string,
  ) {}
}
