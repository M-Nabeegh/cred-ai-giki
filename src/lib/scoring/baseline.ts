import { featureDefinitions } from "./features"
import { clamp, confidenceFromCoverage, scoreBand, type FeatureContribution, type FeatureValue, type ScoreResult } from "./types"

export const baselineModelVersion = "baseline-demo-v1.0.0"

export const baselineCategoryWeights = {
  repayment: 0.3,
  utility: 0.15,
  wallet: 0.2,
  telecom: 0.1,
  financial: 0.15,
  tenure: 0.05,
  coverage: 0.05,
} as const

const positiveTemplates: Record<string, string> = {
  utility_on_time_ratio: "Utility bills show consistent on-time simulated payments.",
  telecom_recharge_regularity: "Telecom activity appears continuous across the observation window.",
  wallet_inflow_regularity: "Wallet inflows are regular without relying on high volume as a signal.",
  wallet_balance_stability: "Wallet balances show stable behavior over time.",
  bill_payment_consistency: "Bill-payment behavior is consistent across simulated sources.",
  simulated_repayment_ratio: "Simulated repayments are mostly completed successfully.",
  cash_flow_coverage: "Recurring inflows appear sufficient for committed outflows.",
  income_stability: "Income timing is steady in the synthetic profile.",
  data_completeness: "The profile has broad simulated data coverage.",
}

const negativeTemplates: Record<string, string> = {
  utility_missed_payment_rate: "Missed utility payments reduce the demo score.",
  utility_amount_volatility: "Utility amounts are volatile, reducing confidence in regularity.",
  telecom_failed_payment_rate: "Failed telecom payments weaken the simulated payment pattern.",
  wallet_outflow_volatility: "Wallet outflows are volatile in the observation window.",
  wallet_failed_transaction_rate: "Failed wallet transactions reduce the stability signal.",
  simulated_days_late_average: "Late simulated repayments reduce the repayment behavior contribution.",
  expense_volatility: "Expense volatility makes cash-flow behavior less predictable.",
  negative_balance_days: "Cash-flow shortfall days reduce the financial stability contribution.",
}

export function normalizeFeature(name: string, value: number | null): FeatureValue {
  const definition = featureDefinitions.find((feature) => feature.name === name)
  if (!definition) throw new Error(`Unknown feature: ${name}`)
  const [min, max] = definition.range
  const missing = value === null || Number.isNaN(value)
  const raw = missing ? (min + max) / 2 : clamp(value, min, max)
  const scaled = max === min ? 0.5 : (raw - min) / (max - min)
  const normalized = definition.direction === "negative" ? 1 - scaled : scaled
  return { name, value, normalized: clamp(normalized, 0, 1), missing }
}

export function calculateBaselineScore(features: Record<string, number | null>): ScoreResult {
  const normalized = featureDefinitions.map((definition) => normalizeFeature(definition.name, features[definition.name] ?? null))
  const byCategory = new Map<string, FeatureValue[]>()

  for (const value of normalized) {
    const definition = featureDefinitions.find((feature) => feature.name === value.name)!
    const group = byCategory.get(definition.category) ?? []
    group.push(value)
    byCategory.set(definition.category, group)
  }

  let weightedScore = 0
  for (const [category, weight] of Object.entries(baselineCategoryWeights)) {
    const values = byCategory.get(category) ?? []
    const categoryAverage = values.length ? values.reduce((sum, value) => sum + value.normalized, 0) / values.length : 0.5
    weightedScore += categoryAverage * weight
  }

  const missingCount = normalized.filter((feature) => feature.missing).length
  const dataCoverage = Math.round(((normalized.length - missingCount) / normalized.length) * 100)
  const rawScore = 300 + 550 * weightedScore
  const score = clamp(Math.round(rawScore), 300, 850)

  const featureContributions: FeatureContribution[] = normalized.map((value) => {
    const definition = featureDefinitions.find((feature) => feature.name === value.name)!
    const categoryWeight = baselineCategoryWeights[definition.category]
    const categorySize = byCategory.get(definition.category)?.length ?? 1
    const contribution = Math.round(((value.normalized - 0.5) * categoryWeight * 550) / categorySize)
    const label = definition.description.replace(/\.$/, "")
    const explanation = contribution >= 0
      ? positiveTemplates[value.name] ?? `${label} contributes positively to the demo score.`
      : negativeTemplates[value.name] ?? `${label} reduces the demo score.`

    return {
      name: value.name,
      label,
      source: definition.source,
      direction: definition.direction,
      value: value.value,
      contribution,
      explanation,
    }
  })

  const positiveFactors = featureContributions
    .filter((factor) => factor.contribution > 0 && featureDefinitions.find((feature) => feature.name === factor.name)?.appearsInCustomerExplanation)
    .sort((a, b) => b.contribution - a.contribution)
    .slice(0, 5)
  const negativeFactors = featureContributions
    .filter((factor) => factor.contribution < 0 && featureDefinitions.find((feature) => feature.name === factor.name)?.appearsInCustomerExplanation)
    .sort((a, b) => a.contribution - b.contribution)
    .slice(0, 5)

  const missingDataWarnings = normalized
    .filter((feature) => feature.missing)
    .map((feature) => `${feature.name} is missing and was handled with neutral demo imputation.`)

  return {
    score,
    band: scoreBand(score),
    confidence: confidenceFromCoverage(dataCoverage),
    dataCoverage,
    modelVersion: baselineModelVersion,
    modelType: "baseline",
    featureContributions,
    positiveFactors,
    negativeFactors,
    reasonCodes: [...positiveFactors, ...negativeFactors].map((factor) => factor.explanation),
    missingDataWarnings,
  }
}
