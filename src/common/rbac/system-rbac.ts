import { SystemPermission, type SystemPermissionValue } from '@distributed-social-platform/shared-kernel'

// ── System Role Catalog ───────────────────────────────────────────────────────
// Role code là identifier cho nhóm quyền hệ thống. Gán cho internal team, không phải end user.
// (Chỉ auth-service cần biết TÊN role — service khác chỉ verify permission qua JWT
// claim, nên SystemRole ở lại đây thay vì shared-kernel; SystemPermission thì
// dùng chung nên đã chuyển sang packages/shared-kernel/src/auth/system-permissions.ts.)
export const SystemRole = {
  SUPER_ADMIN: 'SUPER_ADMIN', // toàn quyền hệ thống
  SUPPORT_AGENT: 'SUPPORT_AGENT', // xử lý report, đọc thông tin cross-org
  CONTENT_MODERATOR: 'CONTENT_MODERATOR', // duyệt/gỡ nội dung, xử lý report
  SYSTEM_ENGINEER: 'SYSTEM_ENGINEER', // monitor + quản lý tài nguyên hệ thống
  BILLING_ADMIN: 'BILLING_ADMIN', // quản lý subscription và billing
} as const

export type SystemRoleValue = (typeof SystemRole)[keyof typeof SystemRole]

// Re-export so existing auth-service imports of `SystemPermission` from this
// path keep working without touching every call site.
export { SystemPermission, type SystemPermissionValue }

// ── Default Role → Permission Mapping (SEED only) ────────────────────────────
// Dùng để seed DB lần đầu. Runtime đọc từ DB (role_permissions table).
// SUPER_ADMIN không có ở đây — guard cấp implicit-all giống OWNER bên org RBAC.
export const DEFAULT_SYSTEM_ROLE_PERMISSIONS: Record<
  Exclude<SystemRoleValue, 'SUPER_ADMIN'>,
  SystemPermissionValue[]
> = {
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
  SYSTEM_ENGINEER: [SystemPermission.SYSTEM_MONITOR, SystemPermission.SYSTEM_RESOURCE_MANAGE],
  BILLING_ADMIN: [
    SystemPermission.BILLING_READ,
    SystemPermission.BILLING_MANAGE,
    SystemPermission.ORG_READ,
  ],
}
