import type { GetMeQuery } from './get-me.query'
import type { IQueryHandler } from '@/common/cqrs'
import type { UserQueryRepository } from '@/modules/auth/application/repositories/user.query-repository'
import { UserNotFoundError } from '@/common/errors/auth.error'

export class GetMeHandler implements IQueryHandler<GetMeQuery> {
  constructor(private readonly userQueryRepository: UserQueryRepository) {}

  async execute(query: GetMeQuery) {
    const user = await this.userQueryRepository.getMe(query.userId)
    
    if (!user) {
      throw new UserNotFoundError()
    }

    return user
  }
}
