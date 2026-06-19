import type { GetMeQuery } from './get-me.query'
import type { IQueryHandler } from '@distributed-social-platform/shared-kernel'
import type { UserQueryRepository } from '@/modules/user/application/repositories/user.query-repository'
import { UserNotFoundError, UserCannotLoginError } from '@/common/errors/user.error'

export class GetMeHandler implements IQueryHandler<GetMeQuery> {
  constructor(private readonly userQueryRepository: UserQueryRepository) {}

  async execute(query: GetMeQuery) {
    const user = await this.userQueryRepository.getMe(query.userId)
    
    if (!user) {
      throw new UserNotFoundError()
    }

    if (!user.isActive) {
      throw new UserCannotLoginError()
    }

    return user
  }
}
