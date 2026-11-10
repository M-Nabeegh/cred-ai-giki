import { FEATURE_KEYS, type FeatureVector } from "../core/features"
import { mean, round, sigmoid } from "../core/stats"

/**
 * The challenger: gradient-boosted shallow trees on the same features as the scorecard.
 *
 * It is never used to score anyone. It exists to answer one question on the model card:
 * how much accuracy does the scorecard give up in exchange for reason codes that add up?
 * A flexible model that can find interactions and thresholds is the standard way to ask.
 */

export type Tree = { feature: number; threshold: number; left: Tree; right: Tree } | { value: number }

export type BoostedModel = {
  algorithm: "gradient_boosted_trees"
  features: string[]
  /** Missing values are replaced with the training mean before a tree sees them. */
  fill: number[]
  base: number
  learningRate: number
  depth: number
  trees: Tree[]
}

export type BoostOptions = { trees?: number; depth?: number; learningRate?: number; minLeaf?: number; lambda?: number; bins?: number }

type Sample = { values: FeatureVector; outcome: 0 | 1 }

export function fitBoostedTrees(train: Sample[], options: BoostOptions = {}): BoostedModel {
  const rounds = options.trees ?? 120
  const depth = options.depth ?? 3
  const learningRate = options.learningRate ?? 0.08
  const minLeaf = options.minLeaf ?? 25
  const lambda = options.lambda ?? 1
  const bins = options.bins ?? 24

  const fill = FEATURE_KEYS.map((key) => mean(train.map((row) => row.values[key]).filter((value): value is number => value !== null && value !== undefined)))
  const X = train.map((row) => toVector(row.values, fill))
  const y = train.map((row) => row.outcome)
  const n = X.length

  // Candidate thresholds are quantiles of each feature, computed once.
  const thresholds = FEATURE_KEYS.map((_, j) => {
    const sorted = X.map((row) => row[j]).sort((a, b) => a - b)
    const cuts = new Set<number>()
    for (let b = 1; b < bins; b += 1) cuts.add(sorted[Math.min(n - 1, Math.floor((b * n) / bins))])
    return [...cuts].sort((a, b) => a - b)
  })

  const positiveRate = Math.min(0.999, Math.max(0.001, mean(y)))
  const base = Math.log(positiveRate / (1 - positiveRate))
  const margin = new Array<number>(n).fill(base)
  const trees: Tree[] = []

  for (let round_ = 0; round_ < rounds; round_ += 1) {
    const gradient = new Array<number>(n)
    const hessian = new Array<number>(n)
    for (let i = 0; i < n; i += 1) {
      const p = sigmoid(margin[i])
      gradient[i] = p - y[i]
      hessian[i] = Math.max(p * (1 - p), 1e-6)
    }

    const grow = (members: number[], level: number): Tree => {
      let G = 0
      let H = 0
      for (const i of members) {
        G += gradient[i]
        H += hessian[i]
      }
      const leaf: Tree = { value: (-G / (H + lambda)) * learningRate }
      if (level >= depth || members.length < 2 * minLeaf) return leaf

      const parent = (G * G) / (H + lambda)
      let best: { gain: number; feature: number; threshold: number } | null = null
      for (let j = 0; j < FEATURE_KEYS.length; j += 1) {
        for (const threshold of thresholds[j]) {
          let GL = 0
          let HL = 0
          let countLeft = 0
          for (const i of members) {
            if (X[i][j] <= threshold) {
              GL += gradient[i]
              HL += hessian[i]
              countLeft += 1
            }
          }
          if (countLeft < minLeaf || members.length - countLeft < minLeaf) continue
          const GR = G - GL
          const HR = H - HL
          const gain = (GL * GL) / (HL + lambda) + (GR * GR) / (HR + lambda) - parent
          if (gain > 1e-9 && (!best || gain > best.gain)) best = { gain, feature: j, threshold }
        }
      }
      if (!best) return leaf
      const { feature, threshold } = best
      return {
        feature,
        threshold,
        left: grow(members.filter((i) => X[i][feature] <= threshold), level + 1),
        right: grow(members.filter((i) => X[i][feature] > threshold), level + 1),
      }
    }

    const tree = grow(X.map((_, i) => i), 0)
    trees.push(tree)
    for (let i = 0; i < n; i += 1) margin[i] += walk(tree, X[i])
  }

  return { algorithm: "gradient_boosted_trees", features: FEATURE_KEYS, fill, base, learningRate, depth, trees }
}

export function predictBoosted(values: FeatureVector, model: BoostedModel) {
  const vector = toVector(values, model.fill)
  let margin = model.base
  for (const tree of model.trees) margin += walk(tree, vector)
  return sigmoid(margin)
}

function toVector(values: FeatureVector, fill: number[]) {
  return FEATURE_KEYS.map((key, j) => {
    const value = values[key]
    return value === null || value === undefined ? fill[j] : value
  })
}

function walk(tree: Tree, vector: number[]): number {
  let node = tree
  while (!("value" in node)) node = vector[node.feature] <= node.threshold ? node.left : node.right
  return node.value
}

export type ModelComparison = {
  algorithm: string
  label: string
  auc: number
  gini: number
  ks: number
  brier: number
  logLoss: number
  /** Default rate among the best-ranked applicants, taking as many as the scorecard approves. */
  badRateAtApproval: number
}

/** Ranking and calibration metrics for any model that outputs a probability of repaying. */
export function compareOn(probabilities: number[], labels: number[], approvalRate: number, aucOf: (scores: number[], labels: number[]) => number) {
  const order = probabilities.map((p, i) => ({ p, y: labels[i] })).sort((a, b) => b.p - a.p)
  const positives = labels.filter((label) => label === 1).length
  const negatives = labels.length - positives
  let tp = 0
  let fp = 0
  let ks = 0
  for (let i = 0; i < order.length; i += 1) {
    if (order[i].y === 1) tp += 1
    else fp += 1
    // Only compare at a boundary between distinct probabilities.
    if (i === order.length - 1 || order[i + 1].p !== order[i].p) ks = Math.max(ks, Math.abs(tp / Math.max(1, positives) - fp / Math.max(1, negatives)))
  }
  const approved = order.slice(0, Math.max(1, Math.round(approvalRate * order.length)))
  const area = aucOf(probabilities, labels)
  return {
    auc: round(area, 4),
    gini: round(2 * area - 1, 4),
    ks: round(ks, 4),
    brier: round(mean(probabilities.map((p, i) => (p - labels[i]) ** 2)), 4),
    logLoss: round(-mean(probabilities.map((p, i) => labels[i] * Math.log(Math.max(p, 1e-9)) + (1 - labels[i]) * Math.log(Math.max(1 - p, 1e-9)))), 4),
    badRateAtApproval: round(approved.filter((row) => row.y === 0).length / approved.length, 4),
  }
}
