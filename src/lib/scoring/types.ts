export type FeatureDirection = "positive" | "negative"
export type FeatureSource = "utility" | "telecom" | "jazzcash" | "easypaisa" | "cashflow" | "repayment" | "profile"

export type ScoreBand = "Strong demo profile" | "Stable demo profile" | "Building profile" | "Needs review"
export type ConfidenceLabel = "High coverage" | "Medium coverage" | "Limited coverage"

export type FeatureDefinition = {
  name: string
  type: "ratio" | "count" | "months" | "index"
  description: string
  source: FeatureSource
  direction: FeatureDirection
  range: [number, number]
  missingDataBehavior: string
  appearsInCustomerExplanation: boolean
  usedByModel: boolean
  category: "repayment" | "utility" | "wallet" | "telecom" | "financial" | "tenure" | "coverage"
}

export type FeatureValue = {
  name: string
  value: number | null
  normalized: number
  missing: boolean
}

export type FeatureContribution = {
  name: string
  label: string
  source: FeatureSource
  direction: FeatureDirection
  value: number | null
  contribution: number
  explanation: string
}

export type ScoreResult = {
  score: number
  band: ScoreBand
  confidence: ConfidenceLabel
  dataCoverage: number
  modelVersion: string
  modelType: "baseline" | "logistic"
  probability?: number
  featureContributions: FeatureContribution[]
  positiveFactors: FeatureContribution[]
  negativeFactors: FeatureContribution[]
  reasonCodes: string[]
  missingDataWarnings: string[]
}

export type ModelArtifact = {
  modelVersion: string
  modelType?: "Logistic regression" | "Rule-based weighted scorecard"
  featureNames: string[]
  featureDirections: Record<string, FeatureDirection>
  means: Record<string, number>
  standardDeviations: Record<string, number>
  imputationValues?: Record<string, number>
  coefficients: Record<string, number>
  intercept: number
  threshold?: number
  trainingRowCount: number
  testRowCount: number
  trainingPositiveRate?: number
  testPositiveRate?: number
  seed: string
  trainingTimestamp: string
  metrics: ModelMetrics
  labelDefinition: string
  generatorVersion: string
  leakageSafeguards?: string[]
  artifactDigest?: string
}

export type ModelMetrics = {
  accuracy: number
  precision: number
  recall: number
  f1: number
  rocAuc: number
  brier: number
  positiveLabelRate: number
  confusionMatrix: {
    truePositive: number
    falsePositive: number
    trueNegative: number
    falseNegative: number
  }
  calibrationBins: Array<{ bin: string; predicted: number; observed: number; count: number }>
}

export type FairnessGroupDiagnostics = {
  group: string
  sampleSize: number
  selectionRate: number
  truePositiveRate: number
  falsePositiveRate: number
  averageScore: number
  missingDataRate: number
}

export type EvaluationSnapshot = {
  generatedAt: string
  modelVersion: string
  datasetSeed: string
  generatorVersion: string
  datasetRowCount: number
  datasetEventCount: number
  datasetMissingness: number
  datasetDigest: string
  threshold: number
  testRowCount: number
  fairnessDiagnostics: FairnessGroupDiagnostics[]
  consistencyChecks: {
    accuracyMatchesConfusionMatrix: boolean
    calibrationCountMatchesTestRows: boolean
  }
  disclaimer: string
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

export function scoreBand(score: number): ScoreBand {
  if (score >= 750) return "Strong demo profile"
  if (score >= 650) return "Stable demo profile"
  if (score >= 550) return "Building profile"
  return "Needs review"
}

export function confidenceFromCoverage(coverage: number): ConfidenceLabel {
  if (coverage >= 85) return "High coverage"
  if (coverage >= 65) return "Medium coverage"
  return "Limited coverage"
}
