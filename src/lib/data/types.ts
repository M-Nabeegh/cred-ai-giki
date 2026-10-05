import type { CustomerRecord } from "../core/schema"

export type Application = {
  id: string
  customerId: string
  amount: number
  tenureMonths: number
  purpose: string
  channel: "app" | "agent" | "branch"
  createdAt: string
  /** Whether the upstream system already holds a final decision for this application. */
  status: "pending" | "decided"
}

export type ProviderHealth = { ok: boolean; provider: string; detail: string; latencyMs: number; customers: number; rejected: number }

export interface DataProvider {
  readonly kind: "synthetic" | "http"
  readonly label: string
  listCustomers(): Promise<CustomerRecord[]>
  getCustomer(id: string): Promise<CustomerRecord | null>
  listApplications(): Promise<Application[]>
  health(): Promise<ProviderHealth>
}

export type DecisionOutcome = "approved" | "declined" | "referred"
export type DecisionEntry = { outcome: DecisionOutcome; note: string; by: string; at: string }
