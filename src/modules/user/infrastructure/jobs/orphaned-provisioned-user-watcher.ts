import { Gauge } from 'prom-client'
import { LogContext, type ILogger } from '@distributed-social-platform/shared-kernel'

// Matches the idempotency record TTL (resilience_patterns.md §1.1 /
// provision-user.handler.ts's IDEMPOTENCY_TTL_MS) — by the time a key expires,
// any legitimate retry window has long closed.
const ORPHAN_AGE_MS = 24 * 60 * 60 * 1000
const DEFAULT_CHECK_INTERVAL_MS = 60 * 60 * 1000 // hourly

export const orphanedProvisionedUserGauge = new Gauge({
  name: 'auth_orphaned_provisioned_users',
  help:
    'Users provisioned via the cross-service org-provisioning saga, still unverified 24h later — ' +
    'possible orphans from a saga whose response was lost before compensation could register. ' +
    'Observability ONLY: this service has no reliable "org creation confirmed" signal to safely ' +
    'auto-remediate on (review of ADR-0001, 2026-07-30) — a non-zero value needs a human.',
})

interface WatchedPrisma {
  client: {
    user: {
      count(args: {
        where: { provisionedViaSaga: boolean; emailVerified: boolean; createdAt: { lt: Date } }
      }): Promise<number>
    }
  }
}

/**
 * Periodic, READ-ONLY check for orphaned saga-provisioned users — deliberately
 * NOT an auto-delete reconciliation job. auth-service cannot tell "org creation
 * later succeeded" from "still pending" (no verification flow exists yet, so
 * `emailVerified` stays false for both outcomes) — automating deletion on a
 * heuristic that can't distinguish those two would risk removing a real,
 * working owner account. Alert first; automate remediation only once real
 * frequency data justifies the risk (same reasoning already applied to
 * P2028 retry in resilience_patterns.md §3).
 *
 * Plain `setInterval`, not `@Cron` — auth-service has no NestJS DI (see
 * container/application.ts), so this follows the same "no framework, do it by
 * hand" convention as the rest of the composition root.
 */
export function startOrphanedProvisionedUserWatcher(
  prisma: WatchedPrisma,
  logger: ILogger,
  intervalMs: number = DEFAULT_CHECK_INTERVAL_MS,
): { stop(): void } {
  let running = false

  async function check(): Promise<void> {
    if (running) return
    running = true

    try {
      const cutoff = new Date(Date.now() - ORPHAN_AGE_MS)
      const count = await prisma.client.user.count({
        where: { provisionedViaSaga: true, emailVerified: false, createdAt: { lt: cutoff } },
      })

      orphanedProvisionedUserGauge.set(count)

      if (count > 0) {
        logger.warn(
          { context: LogContext.LIFECYCLE, count },
          `${count} user(s) provisioned via the org-provisioning saga are still unverified after ` +
            `24h — possible orphan(s) from a saga whose response was lost before compensation could ` +
            `register (review of ADR-0001, 2026-07-30). Needs manual triage, not auto-remediated.`,
        )
      }
    } catch (err) {
      logger.error(
        { context: LogContext.LIFECYCLE, err },
        'Orphaned-provisioned-user watcher check failed',
      )
    } finally {
      running = false
    }
  }

  const timer = setInterval(() => void check(), intervalMs)
  timer.unref() // don't keep the process alive for this alone

  return {
    stop: () => clearInterval(timer),
  }
}
