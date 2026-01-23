import argon2 from 'argon2';
import { type PasswordService } from '../../domain/services/password.service';

export class ImplPasswordService implements PasswordService {
  verify(plain: string, hash: string): Promise<boolean> {
    return argon2.verify(hash, plain);
  }
}