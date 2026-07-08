import type { GetMeDto } from './user.dto'

export interface UserQueryRepository {
  getMe(userId: string): Promise<GetMeDto | null>
}
