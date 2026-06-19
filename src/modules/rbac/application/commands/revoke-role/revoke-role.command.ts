import { ICommand, CommandOptions } from '@distributed-social-platform/shared-kernel'

export class RevokeRoleCommand implements ICommand {
  public readonly name = RevokeRoleCommand.name
  public readonly options: CommandOptions = { transactional: true, retryable: true }
  constructor(public readonly userId: string, public readonly roleCode: string) {}
}
