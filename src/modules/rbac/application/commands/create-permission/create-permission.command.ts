import type { ICommand, CommandOptions } from '@distributed-social-platform/shared-kernel'

export class CreatePermissionCommand implements ICommand {
  readonly name = CreatePermissionCommand.name
  readonly options: CommandOptions = { transactional: false, retryable: false }

  constructor(
    public readonly code: string,
    public readonly moduleName: string, // module is reserved
    public readonly description?: string,
  ) {}
}
