"use client"

import { useMemo, useState } from "react"
import type { Portfolio } from "@/lib/data/service"
import { useDemo, type AuditEntry } from "@/lib/demo/store"
import { cn } from "@/lib/utils"
import { PageHeader } from "../shell/app-shell"
import { Badge, Card, Empty, Segmented } from "../ui"

const roleTone = { customer: "info", analyst: "warn", admin: "neutral", system: "neutral" } as const

export function AuditLog({ portfolio }: { portfolio: Portfolio }) {
  const { state } = useDemo()
  const [role, setRole] = useState<"all" | AuditEntry["role"]>("all")
  const names = new Map(portfolio.customers.map((customer) => [customer.id, customer.name]))
  const entries = useMemo(() => {
    const seeded: AuditEntry[] = portfolio.applications.flatMap((application) => [
      { id: `${application.id}-received`, at: application.createdAt, actor: names.get(application.customerId) ?? application.customerId, role: "customer" as const, action: "Submitted application", target: application.id, detail: `PKR ${application.amount.toLocaleString("en-US")} over ${application.tenureMonths} months via ${application.channel}` },
      { id: `${application.id}-scored`, at: application.createdAt, actor: "Scoring service", role: "system" as const, action: "Scored application", target: application.id, detail: `Score ${portfolio.reports[application.customerId]?.score} · ${portfolio.reports[application.customerId]?.confidence} confidence` },
      ...(application.seeded ? [{ id: `${application.id}-decided`, at: application.seeded.at, actor: application.seeded.by, role: "analyst" as const, action: `Marked ${application.seeded.outcome}`, target: application.id, detail: application.seeded.note }] : []),
    ])
    return [...state.audit, ...seeded].sort((a, b) => b.at.localeCompare(a.at)).filter((entry) => role === "all" || entry.role === role)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.audit, portfolio, role])

  return (
    <>
      <PageHeader title="Audit log" description="Every score, consent change, policy edit and decision, with who did it and why. Your actions in this demo appear at the top." />
      <Segmented value={role} onChange={setRole} className="mb-3" options={[{ value: "all", label: "All" }, { value: "customer", label: "Customers" }, { value: "analyst", label: "Analysts" }, { value: "system", label: "System" }]} />
      <Card className="overflow-hidden">
        {entries.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="border-b border-line text-left text-[13px] text-ink-3"><tr><th className="px-5 py-2.5 font-medium">Time</th><th className="px-3 py-2.5 font-medium">Actor</th><th className="px-3 py-2.5 font-medium">Action</th><th className="px-3 py-2.5 font-medium">Target</th><th className="px-5 py-2.5 font-medium">Detail</th></tr></thead>
              <tbody className="divide-y divide-line">
                {entries.slice(0, 150).map((entry) => (
                  <tr key={entry.id} className={cn(state.audit.some((item) => item.id === entry.id) && "bg-accent-soft/40")}>
                    <td className="whitespace-nowrap px-5 py-2.5 text-[13px] text-ink-3 tnum">{new Date(entry.at).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</td>
                    <td className="px-3 py-2.5"><div className="font-medium">{entry.actor}</div><Badge tone={roleTone[entry.role]} className="mt-0.5">{entry.role}</Badge></td>
                    <td className="px-3 py-2.5">{entry.action}</td>
                    <td className="px-3 py-2.5 font-mono text-xs text-ink-2">{entry.target}</td>
                    <td className="max-w-sm px-5 py-2.5 text-[13px] text-ink-2">{entry.detail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <div className="p-5"><Empty title="No events">Nothing matches this filter yet.</Empty></div>}
      </Card>
    </>
  )
}
