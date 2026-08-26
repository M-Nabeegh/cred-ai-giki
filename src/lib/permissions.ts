export type Role = "customer" | "bank_analyst" | "bank_manager" | "admin"

export type Permission =
  | "profile:view_own"
  | "profile:generate_own"
  | "score:view_own"
  | "data:view_own"
  | "data:reset_own"
  | "loan:submit_own"
  | "applicant:view_assigned"
  | "score:view_applicant"
  | "loan:simulate"
  | "decision:record"
  | "review_note:create"
  | "portfolio:view_bank"
  | "model:view_aggregate"
  | "decision:review"
  | "audit:view_org"
  | "users:manage_demo"
  | "synthetic_data:manage"
  | "model:train_demo"
  | "model:view_registry"
  | "fairness:run_audit"
  | "audit:view_platform"
  | "model:publish_demo"

export const roleLabels: Record<Role, string> = {
  customer: "Customer",
  bank_analyst: "Bank analyst",
  bank_manager: "Bank manager",
  admin: "Administrator",
}

export const permissionMap: Record<Role, Permission[]> = {
  customer: [
    "profile:view_own",
    "profile:generate_own",
    "score:view_own",
    "data:view_own",
    "data:reset_own",
    "loan:submit_own",
  ],
  bank_analyst: [
    "applicant:view_assigned",
    "score:view_applicant",
    "loan:simulate",
    "decision:record",
    "review_note:create",
  ],
  bank_manager: [
    "portfolio:view_bank",
    "model:view_aggregate",
    "decision:review",
    "audit:view_org",
    "applicant:view_assigned",
    "score:view_applicant",
  ],
  admin: [
    "users:manage_demo",
    "synthetic_data:manage",
    "model:train_demo",
    "model:view_registry",
    "fairness:run_audit",
    "audit:view_platform",
    "model:publish_demo",
    "portfolio:view_bank",
    "model:view_aggregate",
  ],
}

export const demoAccounts = [
  { id: "demo-customer-001", role: "customer" as const, name: "Ayesha Khan", login: "customer", password: "demo1234", landingRoute: "/customer/dashboard" },
  { id: "demo-bank-analyst-001", role: "bank_analyst" as const, name: "Bilal Siddiqui", login: "analyst", password: "demo1234", landingRoute: "/bank/dashboard" },
  { id: "demo-bank-manager-001", role: "bank_manager" as const, name: "Sana Malik", login: "manager", password: "demo1234", landingRoute: "/bank/dashboard" },
  { id: "demo-admin-001", role: "admin" as const, name: "Admin", login: "admin", password: "123456", landingRoute: "/admin/dashboard" },
  { id: "legacy-nabeegh", role: "customer" as const, name: "Nabeegh", login: "03001234567", password: "12345678", landingRoute: "/customer/dashboard" },
  { id: "legacy-ahad", role: "customer" as const, name: "Ahad", login: "03007654321", password: "12345678", landingRoute: "/customer/dashboard" },
]

export function hasPermission(role: Role, permission: Permission) {
  return permissionMap[role].includes(permission)
}

export function canAccessWorkspace(role: Role, workspace: "customer" | "bank" | "admin") {
  if (workspace === "customer") return role === "customer"
  if (workspace === "bank") return role === "bank_analyst" || role === "bank_manager" || role === "admin"
  return role === "admin"
}

export function authenticateDemoAccount(login: string, password: string) {
  const normalizedLogin = login.trim().toLowerCase()
  return demoAccounts.find(
    (account) => account.login.toLowerCase() === normalizedLogin && account.password === password,
  )
}
