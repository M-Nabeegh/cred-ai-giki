"use client"

import { useMemo } from "react"
import { evaluateApplication, type Decision, type Policy } from "@/lib/core/policy"
import type { Application, DecisionEntry } from "@/lib/data/types"
import type { CustomerCard, Portfolio, SlimReport } from "@/lib/data/service"
import { useDemo } from "@/lib/demo/store"

export type QueueRow = {
  application: Application
  customer: CustomerCard
  report: SlimReport
  decision: Decision
  final: DecisionEntry | null
  local: boolean
}

export function buildQueue(portfolio: Portfolio, submitted: Application[], decisions: Record<string, DecisionEntry>, policy: Policy): QueueRow[] {
  const customers = new Map(portfolio.customers.map((customer) => [customer.id, customer]))
  const server = portfolio.applications.map((application) => ({ application, seeded: application.seeded, local: false }))
  const local = submitted.filter((application) => portfolio.reports[application.customerId]).map((application) => ({ application, seeded: undefined, local: true }))
  return [...local, ...server].map(({ application, seeded, local: isLocal }) => {
    const report = portfolio.reports[application.customerId]
    const customer = customers.get(application.customerId)!
    return {
      application,
      customer,
      report,
      decision: evaluateApplication(report, application, policy, customer.declaredIncome),
      final: decisions[application.id] ?? seeded ?? null,
      local: isLocal,
    }
  })
}

export function useQueue(portfolio: Portfolio) {
  const demo = useDemo()
  const rows = useMemo(() => buildQueue(portfolio, demo.state.submitted, demo.state.decisions, demo.state.policy), [portfolio, demo.state.submitted, demo.state.decisions, demo.state.policy])
  return { rows, demo }
}

export function relativeTime(iso: string) {
  const hours = Math.round((Date.now() - Date.parse(iso)) / 3_600_000)
  if (hours < 1) return "just now"
  if (hours < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  return days === 1 ? "yesterday" : `${days}d ago`
}
