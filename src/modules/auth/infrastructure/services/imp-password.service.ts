import argon2 from 'argon2'
import { type IPasswordService } from '@/modules/auth/domain/services/password.service'

export class ImpPasswordService implements IPasswordService {
  verify(plain: string, hash: string): Promise<boolean> {
    return argon2.verify(hash, plain)
  }

  hash(plain: string): Promise<string> {
    return argon2.hash(plain)
  }
}
