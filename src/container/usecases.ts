import { LoginUseCase } from '../modules/auth/application/usecases/login.usecase'
import { type InfraDeps } from './infra'

export function buildUseCases(infra: InfraDeps) {
  return {
    auth: {
      loginLocal: new LoginUseCase(
        infra.userRepository,
        infra.refreshTokenRepository,
        infra.passwordService,
        infra.tokenService,
      ),
    },
  }
}

export type UseCases = ReturnType<typeof buildUseCases>
