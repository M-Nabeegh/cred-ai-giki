// Browser port of the deterministic CredAI pipeline (scripts/credai-ml-utils.mjs).
// Used for local demo actions in the admin portal: dataset generation, mini
// training runs, and evaluation recalculation. The CLI commands remain the
// authoritative path for the checked-in dataset and artifact.

import type { FairnessGroupDiagnostics, ModelArtifact, ModelMetrics } from "./types"

export const browserFeatureNames = [
  "utility_on_time_ratio",
  "utility_missed_payment_rate",
  "utility_amount_volatility",
  "utility_observation_months",
  "telecom_recharge_regularity",
  "telecom_account_tenure_months",
  "telecom_failed_payment_rate",
  "wallet_inflow_regularity",
  "wallet_outflow_volatility",
  "wallet_balance_stability",
  "wallet_failed_transaction_rate",
  "bill_payment_consistency",
  "simulated_repayment_ratio",
  "simulated_days_late_average",
  "cash_flow_coverage",
  "income_stability",
  "expense_volatility",
  "negative_balance_days",
  "account_age_months",
  "data_completeness",
] as const

export const browserSourceFeatureMap: Record<string, string[]> = {
  utility: ["utility_on_time_ratio", "utility_missed_payment_rate", "utility_amount_volatility", "utility_observation_months"],
  telecom: ["telecom_recharge_regularity", "telecom_account_tenure_months", "telecom_failed_payment_rate"],
  jazzcash: ["wallet_inflow_regularity", "wallet_failed_transaction_rate"],
  easypaisa: ["wallet_outflow_volatility", "wallet_balance_stability"],
  cashflow: ["bill_payment_consistency", "cash_flow_coverage", "income_stability", "expense_volatility", "negative_balance_days"],
  repayment: ["simulated_repayment_ratio", "simulated_days_late_average"],
}

export const browserSourceNames = Object.keys(browserSourceFeatureMap)
export const BROWSER_THRESHOLD = 0.58

export type BrowserRow = Record<string, number | string | boolean | null>

export type BrowserDataset = {
  metadata: {
    seed: string
    generatorVersion: string
    createdAt: string
    profileCount: number
    observationMonthCount: number
    sourceList: string[]
    actualRowCount: number
    actualMissingness: number
    noiseConfiguration: { noiseLevel: number; threshold: number }
    labelGenerationDescription: string
  }
  rows: BrowserRow[]
}

function seededRandom(seed: string) {
  let hash = 2166136261
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return () => {
    hash += 0x6d2b79f5
    let value = hash
    value = Math.imul(value ^ (value >>> 15), value | 1)
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61)
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296
  }
}

function round(value: number, decimals = 4) {
  const factor = 10 ** decimals
  return Math.round(value * factor) / factor
}

function clamp(value: number, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value))
}

function sigmoid(value: number) {
  return 1 / (1 + Math.exp(-value))
}

// Synchronous FNV-style hash used only for deterministic split ordering in the browser.
function orderHash(text: string) {
  let hash = 2166136261
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0).toString(16).padStart(8, "0")
}

export async function sha256Hex(value: unknown) {
  const bytes = new TextEncoder().encode(JSON.stringify(value))
  const digest = await crypto.subtle.digest("SHA-256", bytes)
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("")
}

function sourceAvailability(behavior: string, rand: () => number) {
  const thin = behavior === "thin_file"
  return {
    utility: thin ? rand() > 0.18 : true,
    telecom: rand() > 0.03,
    jazzcash: thin ? rand() > 0.62 : rand() > 0.08,
    easypaisa: thin ? rand() > 0.3 : rand() > 0.06,
    cashflow: rand() > (thin ? 0.16 : 0.03),
    repayment: thin ? rand() > 0.55 : rand() > 0.1,
  }
}

function applyAvailability(features: Record<string, number | null>, availability: Record<string, boolean>) {
  const next = { ...features }
  for (const [source, names] of Object.entries(browserSourceFeatureMap)) {
    if (!availability[source]) {
      for (const name of names) next[name] = null
    }
  }
  const available = browserFeatureNames.filter((name) => next[name] !== null && next[name] !== undefined).length
  next.data_completeness = round(available / browserFeatureNames.length)
  return next
}

function makeBaseFeatures(index: number, behavior: string, months: number, noise: number, seed: string) {
  const rand = seededRandom(`${seed}-features-${index}-${behavior}`)
  const base = ({ steady: 0.82, building: 0.66, volatile: 0.5, thin_file: 0.58 } as Record<string, number>)[behavior]
  const jitter = (scale = noise) => (rand() - 0.5) * scale * 1.35
  return {
    utility_on_time_ratio: round(clamp(base + jitter())),
    utility_missed_payment_rate: round(clamp(0.18 - base / 7 + jitter(0.08))),
    utility_amount_volatility: round(clamp(0.54 - base / 3 + jitter())),
    utility_observation_months: behavior === "thin_file" ? Math.max(4, months - 5) : months,
    telecom_recharge_regularity: round(clamp(base + jitter())),
    telecom_account_tenure_months: Math.round(18 + base * 48 + rand() * 12),
    telecom_failed_payment_rate: round(clamp(0.16 - base / 8 + jitter(0.07))),
    wallet_inflow_regularity: round(clamp(base + jitter())),
    wallet_outflow_volatility: round(clamp(0.55 - base / 3 + jitter())),
    wallet_balance_stability: round(clamp(base + jitter())),
    wallet_failed_transaction_rate: round(clamp(0.14 - base / 9 + jitter(0.08))),
    bill_payment_consistency: round(clamp(base + jitter())),
    simulated_repayment_ratio: round(clamp(base + jitter())),
    simulated_days_late_average: Math.round(clamp(0.75 - base + jitter(0.2)) * 20),
    cash_flow_coverage: round(clamp(base + jitter())),
    income_stability: round(clamp(base + jitter())),
    expense_volatility: round(clamp(0.55 - base / 3 + jitter())),
    negative_balance_days: Math.round(clamp(0.7 - base + jitter(0.18)) * 18),
    account_age_months: Math.round(12 + base * 60 + rand() * 10),
    data_completeness: 1,
  }
}

function makeLabel(features: Record<string, number | null>, index: number, noise: number, seed: string) {
  const rand = seededRandom(`${seed}-label-${index}`)
  const value = (name: string, fallback: number) => {
    const raw = features[name]
    return typeof raw === "number" && Number.isFinite(raw) ? raw : fallback
  }
  const latent =
    1.55 * value("simulated_repayment_ratio", 0.5) +
    1.1 * value("utility_on_time_ratio", 0.5) +
    0.95 * value("cash_flow_coverage", 0.5) +
    0.75 * value("wallet_balance_stability", 0.5) +
    0.55 * value("data_completeness", 0.5) -
    0.055 * value("simulated_days_late_average", 8) -
    0.045 * value("negative_balance_days", 6) -
    2.05 +
    (rand() - 0.5) * noise * 2.8
  const probability = sigmoid(latent)
  return { probability: round(probability), label: probability >= BROWSER_THRESHOLD ? 1 : 0 }
}

const behaviorProfiles = ["steady", "building", "volatile", "thin_file"]
const cities = ["Lahore", "Karachi", "Islamabad", "Rawalpindi", "Faisalabad", "Multan", "Peshawar", "Hyderabad"]
const labelGenerationDescription = "Synthetic repayment success is generated from repayment discipline, utility consistency, wallet stability, cash-flow coverage, source completeness, days late, shortfall days, and controlled deterministic noise."

export function generateBrowserDataset({ count, months, seed, noise = 0.12 }: { count: number; months: number; seed: string; noise?: number }): BrowserDataset {
  const rows: BrowserRow[] = []
  for (let index = 0; index < count; index += 1) {
    const behavior = behaviorProfiles[index % behaviorProfiles.length]
    const rand = seededRandom(`${seed}-availability-${index}`)
    const availability = sourceAvailability(behavior, rand)
    const features = applyAvailability(makeBaseFeatures(index, behavior, months, noise, seed), availability)
    const label = makeLabel(features, index, noise, seed)
    rows.push({
      id: `browser-${String(index + 1).padStart(5, "0")}`,
      maskedCustomerId: `PK-DEMO-****-${String(4300 + index)}`,
      city: cities[index % cities.length],
      behaviorProfile: behavior,
      synthetic_audit_group: `Synthetic Region Group ${String.fromCharCode(65 + (index % 4))}`,
      ...features,
      latent_repayment_probability: label.probability,
      simulated_repayment_success: label.label,
      synthetic: true,
    })
  }
  const totalCells = rows.length * browserFeatureNames.length
  const missingCells = rows.reduce((sum, row) => sum + browserFeatureNames.filter((name) => row[name] === null || row[name] === undefined).length, 0)
  return {
    metadata: {
      seed,
      generatorVersion: "synthetic-generator-v1.1.0",
      createdAt: new Date().toISOString(),
      profileCount: count,
      observationMonthCount: months,
      sourceList: browserSourceNames,
      actualRowCount: rows.length,
      actualMissingness: round(missingCells / totalCells, 6),
      noiseConfiguration: { noiseLevel: noise, threshold: BROWSER_THRESHOLD },
      labelGenerationDescription,
    },
    rows,
  }
}

export function deterministicSplit(rows: BrowserRow[], trainRatio = 0.8) {
  const ordered = [...rows].sort((a, b) => orderHash(String(a.id)).localeCompare(orderHash(String(b.id))))
  const trainCount = Math.floor(ordered.length * trainRatio)
  return { train: ordered.slice(0, trainCount), test: ordered.slice(trainCount) }
}

type Normalization = { means: Record<string, number>; standardDeviations: Record<string, number>; imputationValues: Record<string, number> }

function fitNormalization(rows: BrowserRow[]): Normalization {
  const means: Record<string, number> = {}
  const standardDeviations: Record<string, number> = {}
  const imputationValues: Record<string, number> = {}
  for (const name of browserFeatureNames) {
    const values = rows.map((row) => row[name]).filter((value): value is number => typeof value === "number" && Number.isFinite(value))
    const mean = values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0
    const variance = values.length ? values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length : 1
    means[name] = round(mean, 8)
    standardDeviations[name] = round(Math.sqrt(variance) || 1, 8)
    imputationValues[name] = means[name]
  }
  return { means, standardDeviations, imputationValues }
}

function vectorize(row: BrowserRow, normalization: Normalization) {
  return browserFeatureNames.map((name) => {
    const raw = typeof row[name] === "number" && Number.isFinite(row[name] as number) ? (row[name] as number) : normalization.imputationValues[name]
    return (raw - normalization.means[name]) / (normalization.standardDeviations[name] || 1)
  })
}

export type BrowserModelFit = Normalization & { coefficients: Record<string, number>; intercept: number }

export function trainBrowserLogisticModel(trainRows: BrowserRow[], iterations = 400): BrowserModelFit {
  const learningRate = 0.08
  const l2 = 0.001
  const normalization = fitNormalization(trainRows)
  const weights = Array(browserFeatureNames.length).fill(0)
  let intercept = 0
  const n = trainRows.length
  for (let iteration = 0; iteration < iterations; iteration += 1) {
    const gradients = Array(browserFeatureNames.length).fill(0)
    let interceptGradient = 0
    for (const row of trainRows) {
      const x = vectorize(row, normalization)
      const y = row.simulated_repayment_success === 1 ? 1 : 0
      const z = intercept + weights.reduce((sum, weight, index) => sum + weight * x[index], 0)
      const error = sigmoid(z) - y
      interceptGradient += error
      for (let index = 0; index < weights.length; index += 1) gradients[index] += error * x[index]
    }
    intercept -= learningRate * (interceptGradient / n)
    for (let index = 0; index < weights.length; index += 1) {
      weights[index] -= learningRate * (gradients[index] / n + l2 * weights[index])
    }
  }
  return {
    ...normalization,
    coefficients: Object.fromEntries(browserFeatureNames.map((name, index) => [name, round(weights[index], 8)])),
    intercept: round(intercept, 8),
  }
}

export function predictProbability(row: BrowserRow, fit: { means: Record<string, number>; standardDeviations: Record<string, number>; imputationValues?: Record<string, number>; coefficients: Record<string, number>; intercept: number; featureNames?: readonly string[] }) {
  const imputationValues = fit.imputationValues ?? fit.means
  const names = fit.featureNames ?? browserFeatureNames
  const x = names.map((name) => {
    const raw = typeof row[name] === "number" && Number.isFinite(row[name] as number) ? (row[name] as number) : imputationValues[name]
    return (raw - fit.means[name]) / (fit.standardDeviations[name] || 1)
  })
  const z = fit.intercept + names.reduce((sum, name, index) => sum + fit.coefficients[name] * x[index], 0)
  return sigmoid(z)
}

export function evaluateBrowserRows(rows: BrowserRow[], fit: Parameters<typeof predictProbability>[1], threshold = BROWSER_THRESHOLD) {
  const scored = rows.map((row) => ({ row, actual: row.simulated_repayment_success === 1 ? 1 : 0, probability: predictProbability(row, fit) }))
  let truePositive = 0, falsePositive = 0, trueNegative = 0, falseNegative = 0
  let brier = 0
  for (const item of scored) {
    const predicted = item.probability >= threshold ? 1 : 0
    if (predicted === 1 && item.actual === 1) truePositive += 1
    if (predicted === 1 && item.actual === 0) falsePositive += 1
    if (predicted === 0 && item.actual === 0) trueNegative += 1
    if (predicted === 0 && item.actual === 1) falseNegative += 1
    brier += (item.probability - item.actual) ** 2
  }
  const total = rows.length
  const precision = truePositive + falsePositive ? truePositive / (truePositive + falsePositive) : 0
  const recall = truePositive + falseNegative ? truePositive / (truePositive + falseNegative) : 0
  const f1 = precision + recall ? (2 * precision * recall) / (precision + recall) : 0
  const sorted = [...scored].sort((a, b) => a.probability - b.probability)
  let rankSum = 0, positives = 0, negatives = 0
  sorted.forEach((item, index) => {
    if (item.actual === 1) { positives += 1; rankSum += index + 1 } else { negatives += 1 }
  })
  const rocAuc = positives && negatives ? (rankSum - (positives * (positives + 1)) / 2) / (positives * negatives) : 0.5
  const calibrationBins = [0, 0.2, 0.4, 0.6, 0.8].map((start) => {
    const end = start + 0.2
    const members = scored.filter((item) => item.probability >= start && item.probability < end + (end === 1 ? 0.000001 : 0))
    return {
      bin: `${start.toFixed(1)}-${end.toFixed(1)}`,
      predicted: round(members.length ? members.reduce((sum, item) => sum + item.probability, 0) / members.length : 0),
      observed: round(members.length ? members.reduce((sum, item) => sum + item.actual, 0) / members.length : 0),
      count: members.length,
    }
  })
  const metrics: ModelMetrics = {
    accuracy: round((truePositive + trueNegative) / total),
    precision: round(precision),
    recall: round(recall),
    f1: round(f1),
    rocAuc: round(rocAuc),
    brier: round(brier / total),
    positiveLabelRate: round(rows.reduce((sum, row) => sum + (row.simulated_repayment_success === 1 ? 1 : 0), 0) / total),
    confusionMatrix: { truePositive, falsePositive, trueNegative, falseNegative },
    calibrationBins,
  }
  return { metrics, scored }
}

export function browserFairnessDiagnostics(scored: Array<{ row: BrowserRow; actual: number; probability: number }>, threshold = BROWSER_THRESHOLD): FairnessGroupDiagnostics[] {
  const groups = [...new Set(scored.map((item) => String(item.row.synthetic_audit_group)))].sort()
  return groups.map((group) => {
    const members = scored.filter((item) => String(item.row.synthetic_audit_group) === group)
    const selected = members.filter((item) => item.probability >= threshold)
    const positives = members.filter((item) => item.actual === 1)
    const negatives = members.filter((item) => item.actual === 0)
    const truePositive = selected.filter((item) => item.actual === 1).length
    const falsePositive = selected.filter((item) => item.actual === 0).length
    return {
      group,
      sampleSize: members.length,
      selectionRate: round(selected.length / members.length),
      truePositiveRate: round(positives.length ? truePositive / positives.length : 0),
      falsePositiveRate: round(negatives.length ? falsePositive / negatives.length : 0),
      averageScore: Math.round(members.reduce((sum, item) => sum + (300 + item.probability * 550), 0) / members.length),
      missingDataRate: round(members.reduce((sum, item) => sum + browserFeatureNames.filter((name) => item.row[name] === null).length, 0) / (members.length * browserFeatureNames.length)),
    }
  })
}

export type BrowserTrainingResult = {
  datasetDigest: string
  artifactDigest: string
  trainingRowCount: number
  testRowCount: number
  trainingPositiveRate: number
  testPositiveRate: number
  metrics: ModelMetrics
  fairness: FairnessGroupDiagnostics[]
  leakageSafeguards: string[]
  threshold: number
}

export async function runBrowserTraining({ count, months, seed }: { count: number; months: number; seed: string }): Promise<BrowserTrainingResult> {
  const dataset = generateBrowserDataset({ count, months, seed })
  const datasetDigest = await sha256Hex(dataset.rows)
  const { train, test } = deterministicSplit(dataset.rows)
  const fit = trainBrowserLogisticModel(train)
  const { metrics, scored } = evaluateBrowserRows(test, fit)
  const fairness = browserFairnessDiagnostics(scored)
  const artifactLike = { modelVersion: "browser-mini-run", seed, ...fit, threshold: BROWSER_THRESHOLD, metrics }
  const artifactDigest = await sha256Hex(artifactLike)
  return {
    datasetDigest,
    artifactDigest,
    trainingRowCount: train.length,
    testRowCount: test.length,
    trainingPositiveRate: round(train.reduce((sum, row) => sum + (row.simulated_repayment_success === 1 ? 1 : 0), 0) / train.length),
    testPositiveRate: round(test.reduce((sum, row) => sum + (row.simulated_repayment_success === 1 ? 1 : 0), 0) / test.length),
    metrics,
    fairness,
    leakageSafeguards: [
      "simulated_repayment_success is used only as the training label.",
      "synthetic_audit_group is excluded from model features and used only for diagnostics.",
      "Normalization and imputation statistics are fit on the training split only.",
    ],
    threshold: BROWSER_THRESHOLD,
  }
}

export async function recomputeEvaluationOnCheckedArtifact(artifact: ModelArtifact, { count, months, seed }: { count: number; months: number; seed: string }) {
  const dataset = generateBrowserDataset({ count, months, seed })
  const { test } = deterministicSplit(dataset.rows)
  const { metrics, scored } = evaluateBrowserRows(test, {
    means: artifact.means,
    standardDeviations: artifact.standardDeviations,
    imputationValues: artifact.imputationValues ?? artifact.means,
    coefficients: artifact.coefficients,
    intercept: artifact.intercept,
    featureNames: artifact.featureNames,
  }, artifact.threshold ?? BROWSER_THRESHOLD)
  const fairness = browserFairnessDiagnostics(scored, artifact.threshold ?? BROWSER_THRESHOLD)
  const digest = await sha256Hex({ metrics, fairness })
  return {
    metrics,
    fairness,
    testRowCount: test.length,
    evaluationDigest: digest,
    consistencyChecks: {
      accuracyMatchesConfusionMatrix: metrics.accuracy === Number(((metrics.confusionMatrix.truePositive + metrics.confusionMatrix.trueNegative) / test.length).toFixed(4)),
      calibrationCountMatchesTestRows: metrics.calibrationBins.reduce((sum, bin) => sum + bin.count, 0) === test.length,
    },
  }
}
