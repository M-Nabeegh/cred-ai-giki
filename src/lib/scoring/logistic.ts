import { featureByName } from "./features"
import { clamp, confidenceFromCoverage, scoreBand, type FeatureContribution, type ModelArtifact, type ScoreResult } from "./types"

function sigmoid(value: number) {
  return 1 / (1 + Math.exp(-value))
}

export function probabilityToScore(probability: number) {
  return clamp(Math.round(300 + 550 * probability), 300, 850)
}

export function inferLogisticScore(features: Record<string, number | null>, artifact?: ModelArtifact): ScoreResult | null {
  if (!artifact) return null

  let linear = artifact.intercept
  const contributions: FeatureContribution[] = []
  let missingCount = 0

  for (const featureName of artifact.featureNames) {
    const definition = featureByName[featureName]
    const raw = features[featureName]
    const missing = raw === null || raw === undefined || Number.isNaN(raw)
    if (missing) missingCount += 1

    const value = missing ? artifact.means[featureName] : raw
    const standardDeviation = artifact.standardDeviations[featureName] || 1
    const normalized = (value - artifact.means[featureName]) / standardDeviation
    const weighted = normalized * artifact.coefficients[featureName]
    linear += weighted

    contributions.push({
      name: featureName,
      label: definition.description.replace(/\.$/, ""),
      source: definition.source,
      direction: definition.direction,
      value: missing ? null : value,
      contribution: Math.round(weighted * 42),
      explanation: weighted >= 0
        ? `${definition.description} This supports the synthetic repayment-success estimate.`
        : `${definition.description} This lowers the synthetic repayment-success estimate.`,
    })
  }

  const probability = sigmoid(linear)
  const score = probabilityToScore(probability)
  const dataCoverage = Math.round(((artifact.featureNames.length - missingCount) / artifact.featureNames.length) * 100)
  const positiveFactors = contributions.filter((factor) => factor.contribution > 0).sort((a, b) => b.contribution - a.contribution).slice(0, 5)
  const negativeFactors = contributions.filter((factor) => factor.contribution < 0).sort((a, b) => a.contribution - b.contribution).slice(0, 5)

  return {
    score,
    band: scoreBand(score),
    confidence: confidenceFromCoverage(dataCoverage),
    dataCoverage,
    modelVersion: artifact.modelVersion,
    modelType: "logistic",
    probability: Math.round(probability * 100) / 100,
    featureContributions: contributions,
    positiveFactors,
    negativeFactors,
    reasonCodes: [...positiveFactors, ...negativeFactors].map((factor) => factor.explanation),
    missingDataWarnings: contributions.filter((factor) => factor.value === null).map((factor) => `${factor.name} is missing and was imputed from training data.`),
  }
}
