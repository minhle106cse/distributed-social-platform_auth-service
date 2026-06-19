import { ICommand } from '@distributed-social-platform/shared-kernel';

export class AssignRoleCommand implements ICommand {
  readonly name = AssignRoleCommand.name;

  constructor(
    public readonly userId: string,
    public readonly roleCode: string,
  ) {}
}
