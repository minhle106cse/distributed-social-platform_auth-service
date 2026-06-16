import type { ICommandHandler } from '@/common/cqrs';
import { UpdateProfileCommand } from './update-profile.command';
import { UserRepository } from '../../../domain/repositories/user.repository';
import { UserProfile } from '../../../domain/entities/user-profile.entity';
import { UserNotFoundError } from '@/common/errors/user.error';

export class UpdateProfileHandler implements ICommandHandler<UpdateProfileCommand> {
  constructor(
    private readonly userRepo: UserRepository,
  ) { }

  async execute(command: UpdateProfileCommand) {
    const { userId, ...profileData } = command;

    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new UserNotFoundError();
    }

    let profile = user.getProfile;
    if (!profile) {
      profile = UserProfile.create({ userId });
      user.assignProfile(profile);
    }

    profile.update({
      firstName: profileData.firstName,
      lastName: profileData.lastName,
      displayName: profileData.displayName,
      avatarUrl: profileData.avatarUrl,
      phoneNumber: profileData.phoneNumber,
    });

    await this.userRepo.save(user);

    return { success: true };
  }
}
