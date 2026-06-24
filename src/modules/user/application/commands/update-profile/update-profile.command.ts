import { ICommand, CommandOptions } from '@distributed-social-platform/shared-kernel';

export class UpdateProfileCommand implements ICommand {
  readonly name = UpdateProfileCommand.name;
  // save() ghi 2 bảng (user + user_profile) → cần atomic, tránh partial write.
  readonly options: CommandOptions = { transactional: true, retryable: false }

  constructor(
    public readonly userId: string,
    public readonly firstName?: string | null,
    public readonly lastName?: string | null,
    public readonly displayName?: string | null,
    public readonly avatarUrl?: string | null,
    public readonly phoneNumber?: string | null,
  ) {}
}
