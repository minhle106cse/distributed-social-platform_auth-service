import type { ICommand } from '@distributed-social-platform/shared-kernel'

// Safety notes (kept from the removed CommandOptions block — ADR-0001 replaced the
// flag with the handler type, but the reasoning about replay/concurrency still applies):
// set-semantics: overwrites profile fields (user + user_profile in one tx) — a repeat is a no-op.
export class UpdateProfileCommand implements ICommand {
  readonly name = UpdateProfileCommand.name
  // save() ghi 2 bảng (user + user_profile) → cần atomic, tránh partial write.

  constructor(
    public readonly userId: string,
    public readonly firstName?: string | null,
    public readonly lastName?: string | null,
    public readonly displayName?: string | null,
    public readonly avatarUrl?: string | null,
    public readonly phoneNumber?: string | null,
  ) {}
}
