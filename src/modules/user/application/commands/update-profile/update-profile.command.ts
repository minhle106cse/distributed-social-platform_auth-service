import type { ICommand, CommandOptions } from '@distributed-social-platform/shared-kernel'

export class UpdateProfileCommand implements ICommand {
  readonly name = UpdateProfileCommand.name
  // save() ghi 2 bảng (user + user_profile) → cần atomic, tránh partial write.
  readonly options: CommandOptions = {
    transactional: true,
    // set-semantics: overwrites profile fields (user + user_profile in one tx) — a repeat is a no-op.
  }

  constructor(
    public readonly userId: string,
    public readonly firstName?: string | null,
    public readonly lastName?: string | null,
    public readonly displayName?: string | null,
    public readonly avatarUrl?: string | null,
    public readonly phoneNumber?: string | null,
  ) {}
}
