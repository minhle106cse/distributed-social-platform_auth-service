import type { GetMeDto } from '../queries/get-me/get-me.dto'

export interface UserQueryRepository {
  getMe(userId: string): Promise<GetMeDto | null>
}
