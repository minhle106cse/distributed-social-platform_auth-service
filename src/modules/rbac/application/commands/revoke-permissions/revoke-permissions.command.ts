import { ICommand, CommandOptions } from '@/common/cqrs'

export class RevokePermissionsCommand implements ICommand {
  public readonly name = RevokePermissionsCommand.name
  public readonly options: CommandOptions = { transactional: true, retryable: true }
  constructor(public readonly roleCode: string, public readonly permissionCodes: string[]) {}
}
