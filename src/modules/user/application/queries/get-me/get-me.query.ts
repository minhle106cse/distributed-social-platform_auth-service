import { IQuery } from '@distributed-social-platform/shared-kernel'

export class GetMeQuery implements IQuery {
  public readonly name = GetMeQuery.name
  constructor(public readonly userId: string) { }
}
