import { ICommand } from '@/common/cqrs/interfaces/command.interface';

export class UpdateProfileCommand implements ICommand {
  readonly name = UpdateProfileCommand.name;

  constructor(
    public readonly userId: string,
    public readonly firstName?: string,
    public readonly lastName?: string,
    public readonly displayName?: string,
    public readonly avatarUrl?: string,
    public readonly phoneNumber?: string,
  ) {}
}
