import { ICommand } from '@/common/cqrs/interfaces/command.interface';

export class AssignRoleCommand implements ICommand {
  readonly name = AssignRoleCommand.name;

  constructor(
    public readonly userId: string,
    public readonly roleCode: string,
  ) {}
}
