import { describe, expect, it } from "vitest"
import { deriveFeatures } from "@/lib/core/features"
import { customerRecordSchema, type CustomerRecord } from "@/lib/core/schema"

const base = customerRecordSchema.parse({
  customerId: "c1",
  displayName: "Test Customer",
  asOf: "2026-09-30",
  utility: {
    bills: [
      { issuedAt: "2026-07-04", dueDate: "2026-07-18", paidAt: "2026-07-15", amount: 4000 },
      { issuedAt: "2026-08-04", dueDate: "2026-08-18", paidAt: "2026-08-25", amount: 5200 },
      { issuedAt: "2026-06-04", dueDate: "2026-06-18", paidAt: null, amount: 3900 },
      { issuedAt: "2026-09-04", dueDate: "2026-09-18", paidAt: "2026-09-18", amount: 4100 },
    ],
  },
  bank: {
    transactions: [
      { date: "2026-08-01", amount: 100000, direction: "in", balanceAfter: 120000 },
      { date: "2026-08-10", amount: 80000, direction: "out", balanceAfter: 40000 },
      { date: "2026-09-01", amount: 100000, direction: "in", balanceAfter: 140000 },
      { date: "2026-09-05", amount: 150000, direction: "out", balanceAfter: -10000 },
      { date: "2026-09-15", amount: 20000, direction: "in", balanceAfter: 10000 },
    ],
  },
})

describe("deriveFeatures", () => {
  it("computes utility ratios from due and paid dates", () => {
    const { values, facts } = deriveFeatures(base)
    expect(facts.utility).toMatchObject({ bills: 4, onTime: 2, unpaid: 1 })
    expect(values.utility_on_time_ratio).toBe(0.5)
    expect(values.utility_unpaid_ratio).toBe(0.25)
    expect(values.utility_months_observed).toBe(4)
  })

  it("counts overdrawn days from the running balance", () => {
    const { facts } = deriveFeatures(base)
    // 10 days below zero (Sep 5 → Sep 15) across 2 observed months
    expect(facts.bank.negativeDaysPerMonth).toBe(5)
  })

  it("nulls every feature of a source the customer has not consented to", () => {
    const revoked: CustomerRecord = { ...base, consent: { ...base.consent, utility: false } }
    const { values, sources } = deriveFeatures(revoked)
    expect(sources.utility).toBe(false)
    expect(values.utility_on_time_ratio).toBeNull()
    expect(values.data_coverage).toBe(0.2)
  })

  it("ignores records after the as-of date", () => {
    const future = { ...base, asOf: "2026-08-31" }
    expect(deriveFeatures(future).facts.utility.bills).toBe(3)
  })
})

describe("customerRecordSchema", () => {
  it("rejects malformed records with a path to the problem", () => {
    const result = customerRecordSchema.safeParse({ customerId: "x", displayName: "X", asOf: "yesterday" })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].path).toEqual(["asOf"])
  })
})
