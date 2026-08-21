import type { GetMeDto } from '../queries/user.dto'

export interface IUserQueryRepository {
  getMe(userId: string): Promise<GetMeDto | null>
}
