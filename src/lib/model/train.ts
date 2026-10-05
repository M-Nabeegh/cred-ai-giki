import { FEATURE_KEYS, deriveFeatures, featureByKey, type FeatureVector } from "../core/features"
import { DEFAULT_POLICY } from "../core/policy"
import { SOURCE_KEYS, type SourceKey } from "../core/schema"
import { logitToScore, predictLogit, type ModelArtifact } from "../core/scorecard"
import { mean, round, seededRandom, sigmoid, std } from "../core/stats"
import { AUDIT_GROUPS, PERSONAS, generateCustomers, type GeneratedCustomer, type PersonaKey } from "../synthetic/generator"

export type Row = { id: string; values: FeatureVector; outcome: 0 | 1; group: string; persona: PersonaKey; sources: Record<SourceKey, boolean> }

export type Evaluation = {
  modelVersion: string
  dataset: {
    seed: string
    asOf: string
    rows: number
    trainRows: number
    testRows: number
    positiveRate: number
    personaMix: Array<{ persona: PersonaKey; label: string; share: number; repaidRate: number }>
    sourceAvailability: Record<SourceKey, number>
    transactions: number
  }
  metrics: { auc: number; gini: number; ks: number; brier: number; logLoss: number; accuracy: number; precision: number; recall: number; approvalRate: number; badRateApproved: number; badRateDeclined: number }
  threshold: { score: number; probability: number }
  confusion: { approvedRepaid: number; approvedDefaulted: number; declinedRepaid: number; declinedDefaulted: number }
  roc: Array<{ fpr: number; tpr: number }>
  calibration: Array<{ bin: string; predicted: number; observed: number; count: number }>
  scoreDistribution: Array<{ bucket: number; repaid: number; defaulted: number }>
  /** Approval rate and default rate among approvals for each score cut-off (held-out set). */
  cutoffs: Array<{ score: number; approvalRate: number; badRate: number }>
  gradeTable: Array<{ grade: string; count: number; badRate: number }>
  fairness: Array<{ group: string; count: number; approvalRate: number; averageScore: number; tpr: number; fpr: number; adverseImpactRatio: number; thinFileShare: number }>
  ablation: Array<{ source: SourceKey; aucWithout: number; aucDrop: number }>
  coefficients: Array<{ key: string; label: string; source: string; weight: number }>
}

export function toRows(customers: GeneratedCustomer[]): Row[] {
  return customers.map((customer) => {
    const derived = deriveFeatures(customer.record)
    return { id: customer.record.customerId, values: derived.values, outcome: customer.outcome, group: customer.auditGroup, persona: customer.persona, sources: derived.sources }
  })
}

/** Stable split by hashed id, so adding rows never reshuffles existing ones. */
export function splitRows(rows: Row[], testShare = 0.2) {
  const bucket = (id: string) => seededRandom(`split:${id}`)()
  return { train: rows.filter((row) => bucket(row.id) >= testShare), test: rows.filter((row) => bucket(row.id) < testShare) }
}

export function fitLogistic(train: Row[], options: { l2?: number; iterations?: number; learningRate?: number; version: string; seed: string; asOf: string; trainedAt: string; testRows: number }): ModelArtifact {
  const l2 = options.l2 ?? 0.02
  const iterations = options.iterations ?? 2500
  const lr = options.learningRate ?? 0.4
  const means: Record<string, number> = {}
  const stds: Record<string, number> = {}
  for (const key of FEATURE_KEYS) {
    const present = train.map((row) => row.values[key]).filter((value): value is number => value !== null && value !== undefined)
    means[key] = round(mean(present), 6)
    stds[key] = round(std(present) || 1, 6)
  }
  const X = train.map((row) => FEATURE_KEYS.map((key) => (row.values[key] === null || row.values[key] === undefined ? 0 : (row.values[key]! - means[key]) / stds[key])))
  const y = train.map((row) => row.outcome)
  const weights = new Array(FEATURE_KEYS.length).fill(0)
  let bias = Math.log(mean(y) / (1 - mean(y)))
  const n = X.length
  for (let iteration = 0; iteration < iterations; iteration += 1) {
    const grad = new Array(weights.length).fill(0)
    let gradBias = 0
    for (let i = 0; i < n; i += 1) {
      let z = bias
      for (let j = 0; j < weights.length; j += 1) z += weights[j] * X[i][j]
      const error = sigmoid(z) - y[i]
      gradBias += error
      for (let j = 0; j < weights.length; j += 1) grad[j] += error * X[i][j]
    }
    bias -= (lr * gradBias) / n
    for (let j = 0; j < weights.length; j += 1) {
      weights[j] -= lr * (grad[j] / n + l2 * weights[j])
      // Sign constraint (projected gradient): a weight may never contradict the feature's
      // business direction — e.g. more failed payments can't raise a score. Standard in scorecards.
      if (weights[j] * featureByKey[FEATURE_KEYS[j]].direction < 0) weights[j] = 0
    }
  }
  return {
    version: options.version,
    trainedAt: options.trainedAt,
    algorithm: "logistic_regression_l2",
    features: FEATURE_KEYS,
    means,
    stds,
    coefficients: Object.fromEntries(FEATURE_KEYS.map((key, j) => [key, round(weights[j], 6)])),
    intercept: round(bias, 6),
    scaling: { baseScore: 650, baseOdds: 3, pdo: 50, min: 300, max: 850 },
    training: { rows: n, testRows: options.testRows, positiveRate: round(mean(y), 4), seed: options.seed, l2, iterations, asOf: options.asOf },
  }
}

export function auc(scores: number[], labels: number[]) {
  const pairs = scores.map((score, index) => ({ score, label: labels[index] })).sort((a, b) => a.score - b.score)
  let rankSum = 0
  let index = 0
  while (index < pairs.length) {
    let end = index
    while (end + 1 < pairs.length && pairs[end + 1].score === pairs[index].score) end += 1
    const rank = (index + end + 2) / 2
    for (let k = index; k <= end; k += 1) if (pairs[k].label === 1) rankSum += rank
    index = end + 1
  }
  const positives = labels.filter((label) => label === 1).length
  const negatives = labels.length - positives
  return (rankSum - (positives * (positives + 1)) / 2) / (positives * negatives)
}

export function evaluate(artifact: ModelArtifact, test: Row[], all: Row[], customers: GeneratedCustomer[]): Evaluation {
  const probs = test.map((row) => sigmoid(predictLogit(row.values, artifact)))
  const scores = test.map((row) => logitToScore(predictLogit(row.values, artifact), artifact))
  const labels = test.map((row) => row.outcome)
  const cut = DEFAULT_POLICY.approveMinScore
  const approved = scores.map((score) => score >= cut)

  const confusion = { approvedRepaid: 0, approvedDefaulted: 0, declinedRepaid: 0, declinedDefaulted: 0 }
  labels.forEach((label, i) => {
    if (approved[i] && label) confusion.approvedRepaid += 1
    else if (approved[i]) confusion.approvedDefaulted += 1
    else if (label) confusion.declinedRepaid += 1
    else confusion.declinedDefaulted += 1
  })
  const approvedCount = confusion.approvedRepaid + confusion.approvedDefaulted
  const declinedCount = test.length - approvedCount

  const rocPoints: Array<{ fpr: number; tpr: number }> = []
  const positives = labels.filter(Boolean).length
  const negatives = labels.length - positives
  let ks = 0
  for (let s = 300; s <= 850; s += 10) {
    const tp = scores.filter((score, i) => score >= s && labels[i] === 1).length
    const fp = scores.filter((score, i) => score >= s && labels[i] === 0).length
    const tpr = tp / positives
    const fpr = fp / negatives
    ks = Math.max(ks, Math.abs(tpr - fpr))
    rocPoints.push({ fpr: round(fpr, 4), tpr: round(tpr, 4) })
  }
  rocPoints.sort((a, b) => a.fpr - b.fpr || a.tpr - b.tpr)

  const calibration = Array.from({ length: 10 }, (_, bin) => {
    const members = probs.map((p, i) => ({ p, y: labels[i] })).filter(({ p }) => (bin === 9 ? p >= bin / 10 : p >= bin / 10 && p < (bin + 1) / 10))
    return { bin: `${bin * 10}–${bin * 10 + 10}%`, predicted: round(mean(members.map((m) => m.p)), 3), observed: round(mean(members.map((m) => m.y)), 3), count: members.length }
  }).filter((bin) => bin.count > 0)

  const scoreDistribution = Array.from({ length: 12 }, (_, i) => 300 + i * 50).map((bucket) => ({
    bucket,
    repaid: scores.filter((score, i) => score >= bucket && score < bucket + 50 && labels[i] === 1).length,
    defaulted: scores.filter((score, i) => score >= bucket && score < bucket + 50 && labels[i] === 0).length,
  })).filter((row) => row.repaid + row.defaulted > 0 || row.bucket <= 800)

  const cutoffs = Array.from({ length: 36 }, (_, i) => 480 + i * 10).map((score) => {
    const members = scores.map((value, i) => ({ value, y: labels[i] })).filter(({ value }) => value >= score)
    return { score, approvalRate: round(members.length / scores.length, 4), badRate: round(members.length ? members.filter((m) => !m.y).length / members.length : 0, 4) }
  })

  const gradeCuts: Array<[string, number, number]> = [["A", 740, 851], ["B", 680, 740], ["C", 620, 680], ["D", 560, 620], ["E", 0, 560]]
  const gradeTable = gradeCuts.map(([grade, lo, hi]) => {
    const members = scores.map((score, i) => ({ score, y: labels[i] })).filter(({ score }) => score >= lo && score < hi)
    return { grade, count: members.length, badRate: round(members.length ? members.filter((m) => !m.y).length / members.length : 0, 3) }
  })

  const fairnessRaw = AUDIT_GROUPS.map((group) => {
    const idx = test.map((row, i) => (row.group === group ? i : -1)).filter((i) => i >= 0)
    const groupApproved = idx.filter((i) => approved[i])
    const pos = idx.filter((i) => labels[i] === 1)
    const neg = idx.filter((i) => labels[i] === 0)
    return {
      group,
      count: idx.length,
      approvalRate: round(groupApproved.length / Math.max(1, idx.length), 3),
      averageScore: Math.round(mean(idx.map((i) => scores[i]))),
      tpr: round(pos.filter((i) => approved[i]).length / Math.max(1, pos.length), 3),
      fpr: round(neg.filter((i) => approved[i]).length / Math.max(1, neg.length), 3),
      thinFileShare: round(idx.filter((i) => SOURCE_KEYS.filter((k) => test[i].sources[k]).length <= 2).length / Math.max(1, idx.length), 3),
    }
  })
  const best = Math.max(...fairnessRaw.map((row) => row.approvalRate))
  const fairness = fairnessRaw.map((row) => ({ ...row, adverseImpactRatio: round(best ? row.approvalRate / best : 1, 3) }))

  const baseAuc = auc(probs, labels)
  const ablation = SOURCE_KEYS.map((source) => {
    const masked = test.map((row) => {
      const values = { ...row.values }
      for (const key of FEATURE_KEYS) if (featureByKey[key].source === source) values[key] = null
      const connected = SOURCE_KEYS.filter((k) => k !== source && row.sources[k]).length
      values.data_coverage = connected / SOURCE_KEYS.length
      return sigmoid(predictLogit(values, artifact))
    })
    const without = auc(masked, labels)
    return { source, aucWithout: round(without, 4), aucDrop: round(baseAuc - without, 4) }
  })

  const personaKeys = Object.keys(PERSONAS) as PersonaKey[]
  const transactions = customers.reduce((total, c) => total + (c.record.bank?.transactions.length ?? 0) + (c.record.wallet?.transactions.length ?? 0) + (c.record.utility?.bills.length ?? 0) + (c.record.telecom?.payments.length ?? 0) + (c.record.credit?.installments.length ?? 0), 0)

  return {
    modelVersion: artifact.version,
    dataset: {
      seed: artifact.training.seed,
      asOf: artifact.training.asOf,
      rows: all.length,
      trainRows: artifact.training.rows,
      testRows: test.length,
      positiveRate: round(mean(all.map((row) => row.outcome)), 4),
      personaMix: personaKeys.map((persona) => {
        const members = all.filter((row) => row.persona === persona)
        return { persona, label: PERSONAS[persona].label, share: round(members.length / all.length, 3), repaidRate: round(mean(members.map((m) => m.outcome)), 3) }
      }),
      sourceAvailability: Object.fromEntries(SOURCE_KEYS.map((key) => [key, round(all.filter((row) => row.sources[key]).length / all.length, 3)])) as Record<SourceKey, number>,
      transactions,
    },
    metrics: {
      auc: round(baseAuc, 4),
      gini: round(2 * baseAuc - 1, 4),
      ks: round(ks, 4),
      brier: round(mean(probs.map((p, i) => (p - labels[i]) ** 2)), 4),
      logLoss: round(-mean(probs.map((p, i) => labels[i] * Math.log(Math.max(p, 1e-9)) + (1 - labels[i]) * Math.log(Math.max(1 - p, 1e-9)))), 4),
      accuracy: round((confusion.approvedRepaid + confusion.declinedDefaulted) / test.length, 4),
      precision: round(confusion.approvedRepaid / Math.max(1, approvedCount), 4),
      recall: round(confusion.approvedRepaid / Math.max(1, positives), 4),
      approvalRate: round(approvedCount / test.length, 4),
      badRateApproved: round(confusion.approvedDefaulted / Math.max(1, approvedCount), 4),
      badRateDeclined: round(confusion.declinedDefaulted / Math.max(1, declinedCount), 4),
    },
    threshold: { score: cut, probability: round(sigmoid((cut - artifact.scaling.baseScore) / (artifact.scaling.pdo / Math.LN2) + Math.log(artifact.scaling.baseOdds)), 4) },
    confusion,
    roc: [{ fpr: 0, tpr: 0 }, ...rocPoints, { fpr: 1, tpr: 1 }],
    calibration,
    scoreDistribution,
    cutoffs,
    gradeTable,
    fairness,
    ablation,
    coefficients: FEATURE_KEYS.map((key) => ({ key, label: featureByKey[key].label, source: featureByKey[key].source, weight: artifact.coefficients[key] })).sort((a, b) => Math.abs(b.weight) - Math.abs(a.weight)),
  }
}

export function trainPipeline(options: { count: number; seed: string; asOf: string; version: string; trainedAt: string; iterations?: number }) {
  const customers = generateCustomers(options.count, options.seed, options.asOf)
  const rows = toRows(customers)
  const { train, test } = splitRows(rows)
  const artifact = fitLogistic(train, { version: options.version, seed: options.seed, asOf: options.asOf, trainedAt: options.trainedAt, testRows: test.length, iterations: options.iterations })
  const evaluation = evaluate(artifact, test, rows, customers)
  return { artifact, evaluation, rows, customers }
}
