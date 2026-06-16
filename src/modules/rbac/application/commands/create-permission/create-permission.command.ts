import { ICommand } from '@/common/cqrs/interfaces/command.interface';

export class CreatePermissionCommand implements ICommand {
  readonly name = CreatePermissionCommand.name;

  constructor(
    public readonly code: string,
    public readonly moduleName: string, // module is reserved
    public readonly description?: string,
  ) {}
}
