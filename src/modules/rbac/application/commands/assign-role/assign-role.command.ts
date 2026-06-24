import type { ICommand, CommandOptions } from '@distributed-social-platform/shared-kernel'

export class AssignRoleCommand implements ICommand {
  readonly name = AssignRoleCommand.name
  readonly options: CommandOptions = { transactional: false, retryable: false }

  constructor(
    public readonly userId: string,
    public readonly roleCode: string,
  ) {}
}
