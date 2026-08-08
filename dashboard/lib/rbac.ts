export type UserRole = "admin" | "staff";

export type Permission =
  // User management
  | "user:create"
  | "user:read"
  | "user:edit"
  | "user:delete"
  | "user:toggle"
  // Home management
  | "home:create"
  | "home:read"
  | "home:edit"
  | "home:delete"
  // Monitoring
  | "monitor:read"
  | "alert:read"
  | "analytics:read"
  | "reports:read"
  // System
  | "settings:read"
  | "settings:write"
  | "data:export"
  | "audit:read";

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    "user:create", "user:read", "user:edit", "user:delete", "user:toggle",
    "home:create", "home:read", "home:edit", "home:delete",
    "monitor:read", "alert:read", "analytics:read", "reports:read",
    "settings:read", "settings:write", "data:export", "audit:read",
  ],
  staff: [
    "home:create", "home:read",
    "monitor:read", "alert:read", "analytics:read",
  ],
};

export function hasPermission(role: UserRole | null | undefined, permission: Permission): boolean {
  if (!role) return false;
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

// Sidebar nav items each role can see
export const ADMIN_NAV_ITEMS = [
  "Dashboard",
  "Live Monitoring",
  "Register Home",
  "Registered Homes",
  "Staff Management",
  "Alert History",
  "Analytics",
  "Reports",
  "Settings",
];

export const STAFF_NAV_ITEMS = [
  "Dashboard",
  "Live Monitoring",
  "Register Home",
  "Registered Homes",
  "Alert History",
  "Analytics",
];
