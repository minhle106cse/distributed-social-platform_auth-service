import { LoginHandler } from '../modules/auth/application/commands/login/login.handler'
import { RegisterHandler } from '../modules/auth/application/commands/register/register.handler'
import { type InfraDeps } from './infra'

export function buildUseCases(infra: InfraDeps) {
  return {
    auth: {
      login: new LoginHandler(
        infra.userRepository,
        infra.refreshTokenRepository,
        infra.passwordService,
        infra.tokenService,
      ),
      register: new RegisterHandler(infra.userRepository, infra.passwordService),
    },
  }
}

export type UseCases = ReturnType<typeof buildUseCases>
