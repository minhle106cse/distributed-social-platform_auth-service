import { ICommand, CommandOptions } from '@/common/cqrs'

export class DeleteRoleCommand implements ICommand {
  public readonly name = DeleteRoleCommand.name
  public readonly options: CommandOptions = { transactional: true, retryable: true }
  constructor(public readonly roleCode: string) {}
}
