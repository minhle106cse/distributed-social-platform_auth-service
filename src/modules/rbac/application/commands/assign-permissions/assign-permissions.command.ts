import { ICommand } from '@distributed-social-platform/shared-kernel';

export class AssignPermissionsCommand implements ICommand {
  readonly name = AssignPermissionsCommand.name;

  constructor(
    public readonly roleCode: string,
    public readonly permissionCodes: string[],
  ) {}
}
