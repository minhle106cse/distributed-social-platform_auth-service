export interface IPasswordService {
  verify(plain: string, hash: string): Promise<boolean>
  hash(plain: string): Promise<string>
}
