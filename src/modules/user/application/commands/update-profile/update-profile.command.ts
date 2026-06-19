import { ICommand } from '@distributed-social-platform/shared-kernel';

export class UpdateProfileCommand implements ICommand {
  readonly name = UpdateProfileCommand.name;

  constructor(
    public readonly userId: string,
    public readonly firstName?: string | null,
    public readonly lastName?: string | null,
    public readonly displayName?: string | null,
    public readonly avatarUrl?: string | null,
    public readonly phoneNumber?: string | null,
  ) {}
}
