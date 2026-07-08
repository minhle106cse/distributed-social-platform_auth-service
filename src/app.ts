import type { ILogger } from '@distributed-social-platform/shared-kernel'
import type { Application } from './container/application'
import { buildServer } from './bootstrap/server'

// Takes an already-built Application (single composition root) instead of
// building its own — callers (main.ts, main.lambda.ts) each build exactly
// ONE Application per process and share it across every transport (HTTP,
// gRPC...), rather than each transport wiring up its own independent copy of
// the same handlers/repositories.
export async function createApp(application: Application, logger: ILogger) {
  return await buildServer(application, logger)
}
