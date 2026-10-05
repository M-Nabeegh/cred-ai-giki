import { describe, expect, it } from "vitest"
import { scoreRecord, logitToScore, scoreToProbability } from "@/lib/core/scorecard"
import { DEFAULT_POLICY, evaluateApplication, monthlyInstallment } from "@/lib/core/policy"
import { artifact, evaluation } from "@/lib/model"
import { generateCustomer } from "@/lib/synthetic/generator"
import { syntheticPortfolio } from "@/lib/synthetic/portfolio"

describe("scorecard", () => {
  const customers = syntheticPortfolio().customers

  it("is exactly additive: base score + reason-code points = score", () => {
    for (const customer of customers.slice(0, 20)) {
      const report = scoreRecord(customer.record, artifact)
      const total = report.baseScore + report.contributions.reduce((sum, item) => sum + item.points, 0)
      if (report.score > 300 && report.score < 850) expect(Math.abs(total - report.score)).toBeLessThanOrEqual(2)
    }
  })

  it("keeps every score in range and grades consistent", () => {
    for (const customer of customers) {
      const report = scoreRecord(customer.record, artifact)
      expect(report.score).toBeGreaterThanOrEqual(300)
      expect(report.score).toBeLessThanOrEqual(850)
      expect(report.contributions).toHaveLength(artifact.features.length)
    }
  })

  it("round-trips score and probability", () => {
    expect(scoreToProbability(logitToScore(1.2, artifact), artifact)).toBeCloseTo(1 / (1 + Math.exp(-1.2)), 1)
  })

  it("scores a disciplined customer above a stretched one", () => {
    const sources = { utility: true, telecom: true, wallet: true, bank: true, credit: true }
    const good = generateCustomer({ index: 1, seed: "t", persona: "salaried", traits: { discipline: 0.95, stability: 0.9, liquidity: 0.8 }, sources })
    const poor = generateCustomer({ index: 1, seed: "t", persona: "salaried", traits: { discipline: 0.2, stability: 0.9, liquidity: 0.1 }, sources })
    expect(scoreRecord(good.record, artifact).score).toBeGreaterThan(scoreRecord(poor.record, artifact).score + 60)
  })

  it("revoking consent lowers coverage and zeroes that source's points", () => {
    const record = customers[0].record
    const before = scoreRecord(record, artifact)
    const after = scoreRecord({ ...record, consent: { ...record.consent, bank: false } }, artifact)
    expect(after.missingSources).toContain("bank")
    expect(after.contributions.filter((c) => c.source === "bank").every((c) => c.points === 0 && c.missing)).toBe(true)
    expect(after.features.data_coverage).toBeLessThan(before.features.data_coverage!)
  })

  it("ships an artifact whose evaluation clears a sane bar", () => {
    expect(evaluation.metrics.auc).toBeGreaterThan(0.75)
    const badRates = evaluation.gradeTable.filter((row) => row.count > 20).map((row) => row.badRate)
    expect([...badRates].sort((a, b) => a - b)).toEqual(badRates)
  })
})

describe("policy", () => {
  it("computes an amortised instalment", () => {
    expect(Math.round(monthlyInstallment(120000, 12, 0.28))).toBe(11581)
    expect(monthlyInstallment(12000, 12, 0)).toBe(1000)
  })

  it("routes large loans to human review even when they pass", () => {
    const report = scoreRecord(syntheticPortfolio().customers[3].record, artifact)
    const small = evaluateApplication(report, { amount: 50_000, tenureMonths: 12 })
    const large = evaluateApplication(report, { amount: DEFAULT_POLICY.instantLimit + 50_000, tenureMonths: 24 })
    expect(small.tier).toBe("instant")
    expect(large.tier).toBe("reviewed")
    expect(large.requiresHumanReview).toBe(true)
  })

  it("declines when the score is below the floor", () => {
    const report = scoreRecord(syntheticPortfolio().customers[0].record, artifact)
    const decision = evaluateApplication({ ...report, score: 400 }, { amount: 20_000, tenureMonths: 6 })
    expect(decision.recommendation).toBe("decline")
  })
})

describe("synthetic generator", () => {
  it("is deterministic for a given seed", () => {
    const a = generateCustomer({ index: 7, seed: "repeat" })
    const b = generateCustomer({ index: 7, seed: "repeat" })
    expect(JSON.stringify(a)).toBe(JSON.stringify(b))
  })
})
