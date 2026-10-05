import type { DataProvider } from "./types"
import { syntheticPortfolio } from "../synthetic/portfolio"

export class SyntheticProvider implements DataProvider {
  readonly kind = "synthetic" as const
  readonly label = "Synthetic generator"

  async listCustomers() {
    return syntheticPortfolio().customers.map((customer) => customer.record)
  }

  async getCustomer(id: string) {
    return syntheticPortfolio().customers.find((customer) => customer.record.customerId === id)?.record ?? null
  }

  async listApplications() {
    return syntheticPortfolio().applications
  }

  async health() {
    const started = performance.now()
    const count = syntheticPortfolio().customers.length
    return { ok: true, provider: this.label, detail: "In-process generator, seeded and deterministic.", latencyMs: Math.round(performance.now() - started), customers: count, rejected: 0 }
  }
}
