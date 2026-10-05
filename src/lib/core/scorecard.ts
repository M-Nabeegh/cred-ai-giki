import { FEATURES, deriveFeatures, featureByKey, formatFeatureValue, type DerivedFeatures, type FeatureVector } from "./features"
import { SOURCE_KEYS, sourceMeta, type CustomerRecord, type SourceKey } from "./schema"
import { clamp, round, sigmoid } from "./stats"

export type ModelArtifact = {
  version: string
  trainedAt: string
  algorithm: "logistic_regression_l2"
  features: string[]
  means: Record<string, number>
  stds: Record<string, number>
  coefficients: Record<string, number>
  intercept: number
  scaling: { baseScore: number; baseOdds: number; pdo: number; min: number; max: number }
  training: { rows: number; testRows: number; positiveRate: number; seed: string; l2: number; iterations: number; asOf: string }
}

export type Grade = "A" | "B" | "C" | "D" | "E"

export const GRADES: Array<{ grade: Grade; min: number; label: string; tone: "pos" | "info" | "warn" | "neg" }> = [
  { grade: "A", min: 740, label: "Excellent", tone: "pos" },
  { grade: "B", min: 680, label: "Good", tone: "pos" },
  { grade: "C", min: 620, label: "Fair", tone: "info" },
  { grade: "D", min: 560, label: "Building", tone: "warn" },
  { grade: "E", min: 0, label: "High risk", tone: "neg" },
]

export function gradeFor(score: number) {
  return GRADES.find((entry) => score >= entry.min) ?? GRADES[GRADES.length - 1]
}

export type Contribution = {
  key: string
  label: string
  source: SourceKey | "profile"
  value: number | null
  display: string
  points: number
  missing: boolean
  reason: string
}

export type ScoreReport = {
  customerId: string
  displayName: string
  asOf: string
  modelVersion: string
  score: number
  grade: Grade
  gradeLabel: string
  /** Model probability of repaying as agreed over 12 months. */
  repaymentProbability: number
  /** Score of a population-average applicant; contributions explain the gap from here. */
  baseScore: number
  contributions: Contribution[]
  helping: Contribution[]
  hurting: Contribution[]
  sources: Record<SourceKey, boolean>
  missingSources: SourceKey[]
  confidence: "High" | "Medium" | "Low"
  features: FeatureVector
  facts: DerivedFeatures["facts"]
}

export function pointsFactor(artifact: ModelArtifact) {
  return artifact.scaling.pdo / Math.LN2
}

/** Map a log-odds value onto the 300–850 scale (points to double the odds). */
export function logitToScore(logit: number, artifact: ModelArtifact) {
  const { baseScore, baseOdds, min, max } = artifact.scaling
  return clamp(Math.round(baseScore + pointsFactor(artifact) * (logit - Math.log(baseOdds))), min, max)
}

export function scoreToProbability(score: number, artifact: ModelArtifact) {
  const { baseScore, baseOdds } = artifact.scaling
  return sigmoid((score - baseScore) / pointsFactor(artifact) + Math.log(baseOdds))
}

export function standardize(values: FeatureVector, artifact: ModelArtifact) {
  return artifact.features.map((key) => {
    const value = values[key]
    return value === null || value === undefined || Number.isNaN(value) ? 0 : (value - artifact.means[key]) / (artifact.stds[key] || 1)
  })
}

export function predictLogit(values: FeatureVector, artifact: ModelArtifact) {
  const z = standardize(values, artifact)
  return artifact.intercept + artifact.features.reduce((total, key, index) => total + artifact.coefficients[key] * z[index], 0)
}

export function scoreFeatures(derived: DerivedFeatures, record: Pick<CustomerRecord, "customerId" | "displayName" | "asOf">, artifact: ModelArtifact): ScoreReport {
  const factor = pointsFactor(artifact)
  const z = standardize(derived.values, artifact)
  const logit = artifact.intercept + artifact.features.reduce((total, key, index) => total + artifact.coefficients[key] * z[index], 0)
  const score = logitToScore(logit, artifact)
  const baseScore = logitToScore(artifact.intercept, artifact)

  const contributions: Contribution[] = artifact.features.map((key, index) => {
    const definition = featureByKey[key]
    const value = derived.values[key]
    const missing = value === null || value === undefined
    return {
      key,
      label: definition.label,
      source: definition.source,
      value: missing ? null : value,
      display: formatFeatureValue(key, missing ? null : value),
      points: missing ? 0 : round(factor * artifact.coefficients[key] * z[index], 1),
      missing,
      reason: missing ? `No ${sourceMeta[definition.source as SourceKey]?.label.toLowerCase() ?? "data"} connected — scored at the population average.` : definition.explain(derived.facts),
    }
  })
  contributions.sort((a, b) => Math.abs(b.points) - Math.abs(a.points))

  const missingSources = SOURCE_KEYS.filter((key) => !derived.sources[key])
  const grade = gradeFor(score)
  const coverage = SOURCE_KEYS.length - missingSources.length

  return {
    customerId: record.customerId,
    displayName: record.displayName,
    asOf: record.asOf,
    modelVersion: artifact.version,
    score,
    grade: grade.grade,
    gradeLabel: grade.label,
    repaymentProbability: round(sigmoid(logit), 4),
    baseScore,
    contributions,
    helping: contributions.filter((item) => item.points > 0.5).slice(0, 5),
    hurting: contributions.filter((item) => item.points < -0.5).sort((a, b) => a.points - b.points).slice(0, 5),
    sources: derived.sources,
    missingSources,
    confidence: coverage >= 4 ? "High" : coverage >= 3 ? "Medium" : "Low",
    features: derived.values,
    facts: derived.facts,
  }
}

export function scoreRecord(record: CustomerRecord, artifact: ModelArtifact) {
  return scoreFeatures(deriveFeatures(record), record, artifact)
}

export const featureCatalogue = FEATURES

/** Re-run the whole pipeline as of each of the last `count` month-ends. */
export function scoreHistory(record: CustomerRecord, artifact: ModelArtifact, count = 6) {
  const [year, month] = record.asOf.slice(0, 7).split("-").map(Number)
  return Array.from({ length: count }, (_, index) => {
    const end = new Date(Date.UTC(year, month - (count - 1 - index), 0))
    const asOf = index === count - 1 ? record.asOf.slice(0, 10) : end.toISOString().slice(0, 10)
    const report = scoreRecord({ ...record, asOf }, artifact)
    return { asOf, month: asOf.slice(0, 7), score: report.score }
  })
}

/** The report as exposed over the API: internal ledger aggregates are omitted. */
export function publicReport(report: ScoreReport) {
  return Object.fromEntries(Object.entries(report).filter(([key]) => key !== "facts")) as Omit<ScoreReport, "facts">
}
