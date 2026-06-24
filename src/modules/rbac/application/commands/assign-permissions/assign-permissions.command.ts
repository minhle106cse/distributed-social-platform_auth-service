import { ICommand, CommandOptions } from '@distributed-social-platform/shared-kernel';

export class AssignPermissionsCommand implements ICommand {
  readonly name = AssignPermissionsCommand.name;
  readonly options: CommandOptions = { transactional: false, retryable: false }

  constructor(
    public readonly roleCode: string,
    public readonly permissionCodes: string[],
  ) {}
}
