import type { GetMeDto } from './user.dto'

export interface IUserQueryRepository {
  getMe(userId: string): Promise<GetMeDto | null>
}
