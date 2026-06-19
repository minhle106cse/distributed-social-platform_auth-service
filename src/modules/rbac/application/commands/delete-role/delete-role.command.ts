import { ICommand, CommandOptions } from '@distributed-social-platform/shared-kernel'

export class DeleteRoleCommand implements ICommand {
  public readonly name = DeleteRoleCommand.name
  public readonly options: CommandOptions = { transactional: true, retryable: true }
  constructor(public readonly roleCode: string) {}
}
