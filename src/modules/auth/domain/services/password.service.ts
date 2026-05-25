export interface PasswordService {
  verify(plain: string, hash: string): Promise<boolean>
  hash(plain: string): Promise<string>
}
