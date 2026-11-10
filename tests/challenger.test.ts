import { describe, expect, it } from "vitest"
import { FEATURE_KEYS, type FeatureVector } from "@/lib/core/features"
import { seededRandom } from "@/lib/core/stats"
import { evaluation } from "@/lib/model"
import { compareOn, fitBoostedTrees, predictBoosted } from "@/lib/model/challenger"
import { auc, trainPipeline } from "@/lib/model/train"

/** Repayment depends on an interaction no single feature reveals: XOR of two features. */
function xorSamples(count: number, seed: string) {
  const rng = seededRandom(seed)
  return Array.from({ length: count }, () => {
    const values: FeatureVector = Object.fromEntries(FEATURE_KEYS.map((key) => [key, rng()]))
    const a = values[FEATURE_KEYS[0]]! > 0.5
    const b = values[FEATURE_KEYS[1]]! > 0.5
    return { values, outcome: (a !== b ? 1 : 0) as 0 | 1 }
  })
}

describe("boosted-trees challenger", () => {
  it("learns an interaction a linear model cannot", () => {
    const model = fitBoostedTrees(xorSamples(1200, "xor-train"), { trees: 60, depth: 3, minLeaf: 10 })
    const test = xorSamples(400, "xor-test")
    const area = auc(test.map((row) => predictBoosted(row.values, model)), test.map((row) => row.outcome))
    expect(area).toBeGreaterThan(0.95)
  })

  it("is deterministic and fills missing values with the training mean", () => {
    const train = xorSamples(300, "repeat")
    const first = fitBoostedTrees(train, { trees: 10 })
    const second = fitBoostedTrees(train, { trees: 10 })
    expect(second).toEqual(first)

    const empty: FeatureVector = Object.fromEntries(FEATURE_KEYS.map((key) => [key, null]))
    const filled: FeatureVector = Object.fromEntries(FEATURE_KEYS.map((key, j) => [key, first.fill[j]]))
    expect(predictBoosted(empty, first)).toBe(predictBoosted(filled, first))
    expect(predictBoosted(empty, first)).toBeGreaterThan(0)
    expect(predictBoosted(empty, first)).toBeLessThan(1)
  })

  it("scores a perfect ranking as AUC 1 with no defaults among approvals", () => {
    const labels = [1, 1, 1, 0, 0, 0]
    const result = compareOn([0.9, 0.8, 0.7, 0.3, 0.2, 0.1], labels, 0.5, auc)
    expect(result).toMatchObject({ auc: 1, gini: 1, ks: 1, badRateAtApproval: 0 })
    const reversed = compareOn([0.1, 0.2, 0.3, 0.7, 0.8, 0.9], labels, 0.5, auc)
    expect(reversed).toMatchObject({ auc: 0, badRateAtApproval: 1 })
  })
})

describe("scorecard vs challenger on the model card", () => {
  it("compares both models on the same held-out set at the same approval rate", () => {
    const challenger = evaluation.challenger!
    expect(challenger.models.map((row) => row.algorithm)).toEqual(["logistic_regression_l2", "gradient_boosted_trees"])
    expect(challenger.approvalRate).toBe(evaluation.metrics.approvalRate)
    expect(challenger.models[0].auc).toBe(evaluation.metrics.auc)
    expect(challenger.models[0].brier).toBe(evaluation.metrics.brier)
    expect(challenger.models[0].badRateAtApproval).toBeCloseTo(evaluation.metrics.badRateApproved, 2)
    expect(challenger.aucGap).toBeCloseTo(challenger.models[1].auc - challenger.models[0].auc, 4)
    for (const row of challenger.models) {
      expect(row.auc).toBeGreaterThan(0.6)
      expect(row.auc).toBeLessThan(0.95)
    }
  })

  it("is produced by the training pipeline", () => {
    const { evaluation: small } = trainPipeline({
      count: 300, seed: "challenger-test", asOf: evaluation.dataset.asOf, version: "test", trainedAt: "2026-01-01",
      iterations: 200, challenger: { trees: 15 },
    })
    expect(small.challenger?.settings.trees).toBe(15)
    expect(small.challenger?.models).toHaveLength(2)
  })
})
