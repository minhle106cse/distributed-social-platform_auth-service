import { buildInfra } from './container/infra';
import { buildUseCases } from './container/usecases';
import { buildServer } from './server';

export function createApp() {
  const infra = buildInfra();
  const useCases = buildUseCases(infra);

  return buildServer(useCases);
}