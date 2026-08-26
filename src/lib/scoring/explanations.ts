import type { FeatureContribution } from "./types"

export function contributionTone(contribution: FeatureContribution) {
  if (contribution.contribution > 0) return "positive"
  if (contribution.contribution < 0) return "negative"
  return "neutral"
}

export function formatContribution(contribution: FeatureContribution) {
  const sign = contribution.contribution > 0 ? "+" : ""
  return `${sign}${contribution.contribution} pts`
}

export function humanScoreDisclaimer() {
  return "CredAI is a synthetic-data prototype. It does not provide a real credit score, financial advice, loan approval, or credit decision."
}

export function humanReviewDisclaimer() {
  return "CredAI provides decision-support signals. A qualified human reviewer must make the final lending decision."
}
