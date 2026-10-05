import { AuditLog } from "@/components/platform/audit-log"
import { getPortfolio } from "@/lib/data/service"

export const metadata = { title: "Audit log" }

export default async function AuditPage() {
  return <AuditLog portfolio={await getPortfolio()} />
}
