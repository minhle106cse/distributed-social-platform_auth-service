import { ICommand } from '@/common/cqrs/interfaces/command.interface';

export class AssignPermissionsCommand implements ICommand {
  readonly name = AssignPermissionsCommand.name;

  constructor(
    public readonly roleCode: string,
    public readonly permissionCodes: string[],
  ) {}
}
