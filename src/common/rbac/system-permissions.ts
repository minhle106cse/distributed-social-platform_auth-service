// ── System Role Catalog ───────────────────────────────────────────────────────
// Role code là identifier cho nhóm quyền hệ thống. Gán cho internal team, không phải end user.
export const SystemRole = {
  SUPER_ADMIN:        'SUPER_ADMIN',         // toàn quyền hệ thống
  SUPPORT_AGENT:      'SUPPORT_AGENT',       // xử lý report, đọc thông tin cross-org
  CONTENT_MODERATOR:  'CONTENT_MODERATOR',   // duyệt/gỡ nội dung, xử lý report
  SYSTEM_ENGINEER:    'SYSTEM_ENGINEER',     // monitor + quản lý tài nguyên hệ thống
  BILLING_ADMIN:      'BILLING_ADMIN',       // quản lý subscription và billing
} as const

export type SystemRoleValue = typeof SystemRole[keyof typeof SystemRole]

// ── System Permission Catalog ─────────────────────────────────────────────────
// Format: 'resource:action' (lowercase) — đồng nhất với OrgPermission bên core-api.
// Mỗi permission gắn với 1 hành động cụ thể trên resource hệ thống.
export const SystemPermission = {
  // Report management
  REPORT_READ:    'report:read',    // xem danh sách / chi tiết abuse report
  REPORT_RESOLVE: 'report:resolve', // xử lý report (ban user, gỡ content, v.v.)
  REPORT_DISMISS: 'report:dismiss', // từ chối report (không vi phạm)

  // System monitoring — read-only, không thay đổi state
  SYSTEM_MONITOR: 'system:monitor', // xem health, metrics, resource usage

  // System resource management
  SYSTEM_RESOURCE_MANAGE: 'system:resource_manage', // điều chỉnh tài nguyên khi có yêu cầu

  // User management (cross-org)
  USER_READ:  'user:read',  // xem profile bất kỳ user
  USER_BAN:   'user:ban',   // ban / deactivate user
  USER_UNBAN: 'user:unban', // restore user bị ban

  // Org management (cross-org)
  ORG_READ:    'org:read',    // xem thông tin bất kỳ org
  ORG_SUSPEND: 'org:suspend', // tạm ngưng hoạt động org
  ORG_RESTORE: 'org:restore', // khôi phục org bị suspend

  // Billing (platform-wide)
  BILLING_READ:   'billing:read',   // xem subscription, invoice
  BILLING_MANAGE: 'billing:manage', // đổi plan, áp credit, hoàn tiền

  // RBAC management (quản lý roles/permissions của hệ thống)
  RBAC_ALL: 'rbac:*', // wildcard — toàn quyền quản lý RBAC
} as const

export type SystemPermissionValue = typeof SystemPermission[keyof typeof SystemPermission]

export const ALL_SYSTEM_PERMISSIONS: SystemPermissionValue[] = Object.values(SystemPermission)

export function isValidSystemPermission(value: string): value is SystemPermissionValue {
  return (ALL_SYSTEM_PERMISSIONS as string[]).includes(value)
}

// ── Default Role → Permission Mapping (SEED only) ────────────────────────────
// Dùng để seed DB lần đầu. Runtime đọc từ DB (role_permissions table).
// SUPER_ADMIN không có ở đây — guard cấp implicit-all giống OWNER bên org RBAC.
export const DEFAULT_SYSTEM_ROLE_PERMISSIONS: Record<Exclude<SystemRoleValue, 'SUPER_ADMIN'>, SystemPermissionValue[]> = {
  SUPPORT_AGENT: [
    SystemPermission.REPORT_READ,
    SystemPermission.REPORT_RESOLVE,
    SystemPermission.REPORT_DISMISS,
    SystemPermission.SYSTEM_MONITOR,
    SystemPermission.USER_READ,
    SystemPermission.ORG_READ,
  ],
  CONTENT_MODERATOR: [
    SystemPermission.REPORT_READ,
    SystemPermission.REPORT_RESOLVE,
    SystemPermission.REPORT_DISMISS,
    SystemPermission.USER_READ,
  ],
  SYSTEM_ENGINEER: [
    SystemPermission.SYSTEM_MONITOR,
    SystemPermission.SYSTEM_RESOURCE_MANAGE,
  ],
  BILLING_ADMIN: [
    SystemPermission.BILLING_READ,
    SystemPermission.BILLING_MANAGE,
    SystemPermission.ORG_READ,
  ],
}
