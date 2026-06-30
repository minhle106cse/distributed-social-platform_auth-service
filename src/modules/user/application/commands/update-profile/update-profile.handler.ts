import type { ICommandHandler } from '@distributed-social-platform/shared-kernel'
import type { UserRepository } from '../../../domain/repositories/user.repository'
import { UserProfile } from '../../../domain/entities/user-profile.entity'
import type { UpdateProfileCommand } from './update-profile.command'
import { UserNotFoundError } from '@/common/errors/user.error'

export class UpdateProfileHandler implements ICommandHandler<UpdateProfileCommand> {
  constructor(private readonly userRepo: UserRepository) {}

  async execute(command: UpdateProfileCommand) {
    const { userId, ...profileData } = command

    const user = await this.userRepo.findById(userId)
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

    await this.userRepo.save(user)

    return { success: true }
  }
}
