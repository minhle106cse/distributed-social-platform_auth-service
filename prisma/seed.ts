import argon2 from 'argon2'
import { prismaService, prisma } from '@/infrastructure/database/prisma/prisma.client'
import { SystemRole, DEFAULT_SYSTEM_ROLE_PERMISSIONS } from '@/common/rbac/system-rbac'

// First-boot seed for auth-service: system role catalog + their default
// permission mapping (permission codes are a fixed catalog in code —
// SystemPermission, shared-kernel — not a seeded DB entity), and one
// SUPER_ADMIN account to break the chicken-and-egg (POST /roles/assign
// itself requires RBAC_ALL). Idempotent — safe to re-run (upsert everywhere).

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? 'admin@cortex.local'
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? 'ChangeMe123!'

async function main() {
  // 1. Role catalog (SUPER_ADMIN + the 4 roles that have a default mapping)
  // — permissions seeded straight onto the role, SUPER_ADMIN excluded on
  // purpose: guard grants it implicit-all (system-rbac.ts), same pattern as
  // OWNER in org RBAC.
  const roleIdByCode = new Map<string, string>()
  for (const code of Object.values(SystemRole)) {
    const permissions = (DEFAULT_SYSTEM_ROLE_PERMISSIONS as Record<string, string[]>)[code] ?? []
    const role = await prisma.role.upsert({
      where: { code },
      update: {},
      create: { code, name: code, permissions },
    })
    roleIdByCode.set(code, role.id)
  }

  // 2. First SUPER_ADMIN user
  const passwordHash = await argon2.hash(ADMIN_PASSWORD)
  const user = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: {},
    create: {
      email: ADMIN_EMAIL,
      emailVerified: true,
      authIdentities: { create: { provider: 'LOCAL', passwordHash } },
    },
  })

  const superAdminRoleId = roleIdByCode.get(SystemRole.SUPER_ADMIN)!
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: user.id, roleId: superAdminRoleId } },
    update: {},
    create: { userId: user.id, roleId: superAdminRoleId },
  })

  console.log(`Seeded system RBAC catalog. SUPER_ADMIN login: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`)
}

main()
  .catch((err) => {
    console.error(err)
    process.exitCode = 1
  })
  .finally(async () => {
    await prismaService.disconnect()
  })
