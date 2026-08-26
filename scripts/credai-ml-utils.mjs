import { createHash } from "node:crypto"
import { mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"

export const ROOT = process.cwd()
export const DATASET_PATH = join(ROOT, "data/generated/credai-demo-v1.json")
export const FEATURES_PATH = join(ROOT, "data/generated/credai-demo-v1-features.csv")
export const ARTIFACT_JSON_PATH = join(ROOT, "data/generated/logistic-demo-v1.1.0.json")
export const ARTIFACT_TS_PATH = join(ROOT, "src/lib/scoring/model-artifact.ts")
export const SEED = "credai-demo-v1"
export const GENERATOR_VERSION = "synthetic-generator-v1.1.0"
export const MODEL_VERSION = "logistic-demo-v1.1.0"
export const CREATED_AT = "2026-08-26T09:00:00+05:00"
export const DEFAULT_PROFILE_COUNT = 2000
export const DEFAULT_MONTHS = 12
export const DEFAULT_NOISE = 0.12
export const THRESHOLD = 0.58

export const modelFeatureNames = [
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
]

export const sourceFeatureMap = {
  utility: ["utility_on_time_ratio", "utility_missed_payment_rate", "utility_amount_volatility", "utility_observation_months"],
  telecom: ["telecom_recharge_regularity", "telecom_account_tenure_months", "telecom_failed_payment_rate"],
  jazzcash: ["wallet_inflow_regularity", "wallet_failed_transaction_rate"],
  easypaisa: ["wallet_outflow_volatility", "wallet_balance_stability"],
  cashflow: ["bill_payment_consistency", "cash_flow_coverage", "income_stability", "expense_volatility", "negative_balance_days"],
  repayment: ["simulated_repayment_ratio", "simulated_days_late_average"],
}

export const sourceNames = Object.keys(sourceFeatureMap)

export function createSeededRandom(seed) {
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

export function round(value, decimals = 4) {
  const factor = 10 ** decimals
  return Math.round(value * factor) / factor
}

export function clamp(value, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value))
}

export function digest(value) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex")
}

export function ensureDir(path) {
  mkdirSync(dirname(path), { recursive: true })
}

function sourceAvailability(behavior, rand) {
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

function applyAvailability(features, availability) {
  const next = { ...features }
  for (const [source, names] of Object.entries(sourceFeatureMap)) {
    if (!availability[source]) {
      for (const name of names) next[name] = null
    }
  }
  const available = modelFeatureNames.filter((name) => next[name] !== null && next[name] !== undefined).length
  next.data_completeness = round(available / modelFeatureNames.length)
  return next
}

function makeBaseFeatures(index, behavior, months, noise) {
  const rand = createSeededRandom(`${SEED}-features-${index}-${behavior}`)
  const base = { steady: 0.82, building: 0.66, volatile: 0.5, thin_file: 0.58 }[behavior]
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

function makeEvents(profileId, months, features, availability) {
  const eventRows = []
  for (let month = 0; month < months; month += 1) {
    for (const source of sourceNames) {
      eventRows.push({
        id: `${profileId}-${source}-${String(month + 1).padStart(2, "0")}`,
        profileId,
        source,
        monthIndex: month + 1,
        available: availability[source],
        synthetic: true,
        quality: availability[source] ? round(Number(features.data_completeness ?? 0.5)) : null,
      })
    }
  }
  return eventRows
}

function makeLabel(features, index, noise) {
  const rand = createSeededRandom(`${SEED}-label-${index}`)
  const value = (name, fallback) => features[name] ?? fallback
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
  return { probability: round(probability), label: probability >= THRESHOLD ? 1 : 0 }
}

export function generateDataset({ count = DEFAULT_PROFILE_COUNT, months = DEFAULT_MONTHS, seed = SEED, noise = DEFAULT_NOISE } = {}) {
  const behaviorProfiles = ["steady", "building", "volatile", "thin_file"]
  const cities = ["Lahore", "Karachi", "Islamabad", "Rawalpindi", "Faisalabad", "Multan", "Peshawar", "Hyderabad"]
  const rows = []
  const events = []
  for (let index = 0; index < count; index += 1) {
    const behavior = behaviorProfiles[index % behaviorProfiles.length]
    const rand = createSeededRandom(`${seed}-availability-${index}`)
    const availability = sourceAvailability(behavior, rand)
    const features = applyAvailability(makeBaseFeatures(index, behavior, months, noise), availability)
    const label = makeLabel(features, index, noise)
    const row = {
      id: `synthetic-${String(index + 1).padStart(5, "0")}`,
      maskedCustomerId: `PK-DEMO-****-${String(4300 + index)}`,
      city: cities[index % cities.length],
      behaviorProfile: behavior,
      sourceAvailability: availability,
      synthetic_audit_group: `Synthetic Region Group ${String.fromCharCode(65 + (index % 4))}`,
      ...features,
      latent_repayment_probability: label.probability,
      simulated_repayment_success: label.label,
      synthetic: true,
    }
    rows.push(row)
    events.push(...makeEvents(row.id, months, features, availability))
  }
  const totalCells = rows.length * modelFeatureNames.length
  const missingCells = rows.reduce((sum, row) => sum + modelFeatureNames.filter((name) => row[name] === null || row[name] === undefined).length, 0)
  const metadata = {
    seed,
    generatorVersion: GENERATOR_VERSION,
    createdAt: CREATED_AT,
    profileCount: count,
    observationMonthCount: months,
    sourceList: sourceNames,
    actualRowCount: rows.length,
    actualEventCount: events.length,
    actualMissingness: round(missingCells / totalCells, 6),
    noiseConfiguration: { noiseLevel: noise, threshold: THRESHOLD },
    labelGenerationDescription: "Synthetic repayment success is generated from repayment discipline, utility consistency, wallet stability, cash-flow coverage, source completeness, days late, shortfall days, and controlled deterministic noise.",
    deterministicDigest: digest({ seed, count, months, noise, rows }),
  }
  return { metadata, rows, events }
}

export function writeDataset(dataset, datasetPath = DATASET_PATH, featuresPath = FEATURES_PATH) {
  ensureDir(datasetPath)
  writeFileSync(datasetPath, `${JSON.stringify(dataset, null, 2)}\n`)
  const headers = ["id", ...modelFeatureNames, "synthetic_audit_group", "simulated_repayment_success"]
  const csv = [headers.join(","), ...dataset.rows.map((row) => headers.map((key) => row[key] ?? "").join(","))].join("\n")
  writeFileSync(featuresPath, `${csv}\n`)
}

export function loadDataset(datasetPath = DATASET_PATH) {
  return JSON.parse(readFileSync(datasetPath, "utf8"))
}

export function deterministicSplit(rows, trainRatio = 0.8) {
  const ordered = [...rows].sort((a, b) => digest(a.id).localeCompare(digest(b.id)))
  const trainCount = Math.floor(ordered.length * trainRatio)
  return { train: ordered.slice(0, trainCount), test: ordered.slice(trainCount) }
}

export function sigmoid(value) {
  return 1 / (1 + Math.exp(-value))
}

export function fitNormalization(rows, featureNames = modelFeatureNames) {
  const means = {}
  const standardDeviations = {}
  const imputationValues = {}
  for (const name of featureNames) {
    const values = rows.map((row) => row[name]).filter((value) => typeof value === "number" && Number.isFinite(value))
    const mean = values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0
    const variance = values.length ? values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length : 1
    means[name] = round(mean, 8)
    standardDeviations[name] = round(Math.sqrt(variance) || 1, 8)
    imputationValues[name] = means[name]
  }
  return { means, standardDeviations, imputationValues }
}

export function vectorize(row, normalization, featureNames = modelFeatureNames) {
  return featureNames.map((name) => {
    const raw = typeof row[name] === "number" && Number.isFinite(row[name]) ? row[name] : normalization.imputationValues[name]
    return (raw - normalization.means[name]) / (normalization.standardDeviations[name] || 1)
  })
}

export function trainLogisticModel(trainRows, options = {}) {
  const featureNames = options.featureNames ?? modelFeatureNames
  const learningRate = options.learningRate ?? 0.08
  const iterations = options.iterations ?? 900
  const l2 = options.l2 ?? 0.001
  const normalization = fitNormalization(trainRows, featureNames)
  const weights = Array(featureNames.length).fill(0)
  let intercept = 0
  const n = trainRows.length
  for (let iteration = 0; iteration < iterations; iteration += 1) {
    const gradients = Array(featureNames.length).fill(0)
    let interceptGradient = 0
    for (const row of trainRows) {
      const x = vectorize(row, normalization, featureNames)
      const y = row.simulated_repayment_success
      const z = intercept + weights.reduce((sum, weight, index) => sum + weight * x[index], 0)
      const error = sigmoid(z) - y
      interceptGradient += error
      for (let index = 0; index < weights.length; index += 1) gradients[index] += error * x[index]
    }
    intercept -= learningRate * (interceptGradient / n)
    for (let index = 0; index < weights.length; index += 1) {
      weights[index] -= learningRate * ((gradients[index] / n) + l2 * weights[index])
    }
  }
  return {
    featureNames,
    means: normalization.means,
    standardDeviations: normalization.standardDeviations,
    imputationValues: normalization.imputationValues,
    coefficients: Object.fromEntries(featureNames.map((name, index) => [name, round(weights[index], 8)])),
    intercept: round(intercept, 8),
  }
}

export function predictProbability(row, artifact) {
  const normalization = { means: artifact.means, standardDeviations: artifact.standardDeviations, imputationValues: artifact.imputationValues ?? artifact.means }
  const x = vectorize(row, normalization, artifact.featureNames)
  const z = artifact.intercept + artifact.featureNames.reduce((sum, name, index) => sum + artifact.coefficients[name] * x[index], 0)
  return sigmoid(z)
}

function auc(scored) {
  const sorted = [...scored].sort((a, b) => a.probability - b.probability)
  let rankSum = 0
  let positives = 0
  let negatives = 0
  sorted.forEach((item, index) => {
    if (item.actual === 1) {
      positives += 1
      rankSum += index + 1
    } else {
      negatives += 1
    }
  })
  if (!positives || !negatives) return 0.5
  return (rankSum - (positives * (positives + 1)) / 2) / (positives * negatives)
}

export function evaluateRows(rows, artifact, threshold = THRESHOLD) {
  const scored = rows.map((row) => ({ row, actual: row.simulated_repayment_success, probability: predictProbability(row, artifact) }))
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
  const calibrationBins = [0, 0.2, 0.4, 0.6, 0.8].map((start) => {
    const end = start + 0.2
    const members = scored.filter((item) => item.probability >= start && item.probability < end + (end === 1 ? 0.000001 : 0))
    return {
      bin: `${start.toFixed(1)}-${end.toFixed(1)}`,
      predicted: round(members.length ? members.reduce((sum, item) => sum + item.probability, 0) / members.length : 0, 4),
      observed: round(members.length ? members.reduce((sum, item) => sum + item.actual, 0) / members.length : 0, 4),
      count: members.length,
    }
  })
  return {
    accuracy: round((truePositive + trueNegative) / total, 4),
    precision: round(precision, 4),
    recall: round(recall, 4),
    f1: round(f1, 4),
    rocAuc: round(auc(scored), 4),
    brier: round(brier / total, 4),
    positiveLabelRate: round(rows.reduce((sum, row) => sum + row.simulated_repayment_success, 0) / total, 4),
    confusionMatrix: { truePositive, falsePositive, trueNegative, falseNegative },
    calibrationBins,
    scored,
  }
}

export function fairnessDiagnostics(scored, threshold = THRESHOLD) {
  const groups = [...new Set(scored.map((item) => item.row.synthetic_audit_group))].sort()
  return groups.map((group) => {
    const members = scored.filter((item) => item.row.synthetic_audit_group === group)
    const selected = members.filter((item) => item.probability >= threshold)
    const positives = members.filter((item) => item.actual === 1)
    const negatives = members.filter((item) => item.actual === 0)
    const truePositive = selected.filter((item) => item.actual === 1).length
    const falsePositive = selected.filter((item) => item.actual === 0).length
    return {
      group,
      sampleSize: members.length,
      selectionRate: round(selected.length / members.length, 4),
      truePositiveRate: round(positives.length ? truePositive / positives.length : 0, 4),
      falsePositiveRate: round(negatives.length ? falsePositive / negatives.length : 0, 4),
      averageScore: Math.round(members.reduce((sum, item) => sum + (300 + item.probability * 550), 0) / members.length),
      missingDataRate: round(members.reduce((sum, item) => sum + modelFeatureNames.filter((name) => item.row[name] === null).length, 0) / (members.length * modelFeatureNames.length), 4),
    }
  })
}

export function artifactToTs(artifact) {
  return `import type { ModelArtifact } from "./types"\n\nexport const trainedModelArtifact: ModelArtifact = ${JSON.stringify(artifact, null, 2)}\n`
}
