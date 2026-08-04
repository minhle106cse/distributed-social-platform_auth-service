import type { AuthServiceRepos } from '@/container/repos'
import type { ITransactionalCommandHandler } from '@distributed-social-platform/shared-kernel'
import type { IUserRepository } from '../../../domain/repositories/user.repository'
import { UserProfile } from '../../../domain/entities/user-profile.entity'
import type { UpdateProfileCommand } from './update-profile.command'
import { UserNotFoundError } from '@/common/errors/user.error'

export class UpdateProfileHandler implements ITransactionalCommandHandler<
  UpdateProfileCommand,
  any,
  AuthServiceRepos
> {
  readonly kind = 'transactional' as const

  async execute(command: UpdateProfileCommand, tx: AuthServiceRepos) {
    const { userId, ...profileData } = command

    const user = await tx.users.findById(userId)
    if (!user) {
      throw new UserNotFoundError()
    }

    let profile = user.profile
    if (!profile) {
      profile = UserProfile.create({
        userId,
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        displayName: profileData.displayName,
        avatarUrl: profileData.avatarUrl,
        phoneNumber: profileData.phoneNumber,
      })
      user.assignProfile(profile)
    } else {
      profile.update({
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        displayName: profileData.displayName,
        avatarUrl: profileData.avatarUrl,
        phoneNumber: profileData.phoneNumber,
      })
    }

    await tx.users.save(user)

    return { success: true }
  }
}
