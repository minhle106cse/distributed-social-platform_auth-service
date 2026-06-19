import { ICommand } from '@distributed-social-platform/shared-kernel';

export class CreatePermissionCommand implements ICommand {
  readonly name = CreatePermissionCommand.name;

  constructor(
    public readonly code: string,
    public readonly moduleName: string, // module is reserved
    public readonly description?: string,
  ) {}
}
