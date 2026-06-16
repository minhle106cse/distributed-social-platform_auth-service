import { ICommand } from '@/common/cqrs/interfaces/command.interface';

export class CreateRoleCommand implements ICommand {
  readonly name = CreateRoleCommand.name;

  constructor(
    public readonly code: string,
    public readonly nameRole: string, // named nameRole to avoid shadowing
    public readonly description?: string,
  ) {}
}
