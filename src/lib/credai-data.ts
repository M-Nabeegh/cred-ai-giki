import { calculateBaselineScore } from "./scoring/baseline"
import { evaluationSnapshot } from "./scoring/evaluation-snapshot"
import { inferLogisticScore } from "./scoring/logistic"
import { activeModelArtifact, modelRegistry } from "./scoring/model-registry"
import type { Role } from "./permissions"
import type { FairnessGroupDiagnostics, ModelMetrics, ScoreResult } from "./scoring/types"

export const DEMO_SEED = "credai-demo-v1"
export const GENERATOR_VERSION = "synthetic-generator-v1.1.0"
export const DEMO_TIMESTAMP = "2026-08-26T09:00:00+05:00"

export type SourceKey = "utility" | "telecom" | "jazzcash" | "easypaisa" | "cashflow" | "repayment"
export type SourceConsentState = Record<SourceKey, boolean>

export const sourceFeatureMap: Record<SourceKey, string[]> = {
  utility: ["utility_on_time_ratio", "utility_missed_payment_rate", "utility_amount_volatility", "utility_observation_months"],
  telecom: ["telecom_recharge_regularity", "telecom_account_tenure_months", "telecom_failed_payment_rate"],
  jazzcash: ["wallet_inflow_regularity", "wallet_failed_transaction_rate"],
  easypaisa: ["wallet_outflow_volatility", "wallet_balance_stability"],
  cashflow: ["bill_payment_consistency", "cash_flow_coverage", "income_stability", "expense_volatility", "negative_balance_days"],
  repayment: ["simulated_repayment_ratio", "simulated_days_late_average"],
}

export const sourceLabels: Record<SourceKey, string> = {
  utility: "Simulated utility data",
  telecom: "Simulated telecom data",
  jazzcash: "Simulated JazzCash data",
  easypaisa: "Simulated Easypaisa data",
  cashflow: "Simulated bank-cashflow data",
  repayment: "Simulated repayment data",
}

export type DataSourceStatus = {
  source: SourceKey
  label: string
  connected: boolean
  coverage: number
  lastSynced: string
  contributes: string[]
}

export type FinancialObservation = {
  month: string
  utilityOnTimeRatio: number | null
  telecomContinuity: number | null
  walletInflowRegularity: number | null
  walletOutflowVolatility: number | null
  cashFlowCoverage: number | null
  repaymentRatio: number | null
}

export type SyntheticProfile = {
  id: string
  maskedCustomerId: string
  name: string
  role: Role
  city: string
  organizationId?: string
  monthlyIncomePkr: number
  observationMonths: number
  behaviorProfile: "steady" | "building" | "volatile" | "thin_file"
  features: Record<string, number | null>
  score: ScoreResult
  sources: DataSourceStatus[]
  observations: FinancialObservation[]
  recommendations: string[]
}

export type LoanApplication = {
  id: string
  customerId: string
  amountPkr: number
  tenureMonths: number
  purpose: string
  status: "submitted" | "in_review" | "approved_for_demo" | "referred" | "declined_for_demo"
  createdAt: string
  humanReviewRequired: boolean
}

export type DecisionRecord = {
  id: string
  applicationId: string
  reviewerRole: "bank_analyst" | "bank_manager"
  decision: "approve_for_demo" | "refer_for_manual_review" | "decline_for_demo"
  reason: string
  createdAt: string
}

export type AuditEvent = {
  id: string
  actorId: string
  organization: string
  role: Role
  action: string
  resource: string
  modelVersion: string
  timestamp: string
  result: "success" | "warning" | "blocked"
}

export type Organization = {
  id: string
  name: string
  type: "bank" | "platform"
  activeUsers: number
}

export type FairnessGroup = FairnessGroupDiagnostics

export type SyntheticDatasetSummary = {
  seed: string
  generatorVersion: string
  createdAt: string
  profileCount: number
  eventCount: number
  enabledSources: string[]
  missingDataRate: number
  noiseLevel: number
  labelGenerationMethod: string
  digest: string
  observationMonths: number
}

export function createSeededRandom(seed: string) {
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

function rounded(value: number, decimals = 2) {
  const factor = 10 ** decimals
  return Math.round(value * factor) / factor
}

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value))
}

function sourceStatus(source: SourceKey, connected: boolean, coverage: number): DataSourceStatus {
  return {
    source,
    label: sourceLabels[source],
    connected,
    coverage: connected ? Math.max(35, Math.min(100, coverage)) : 0,
    contributes: sourceFeatureMap[source],
    lastSynced: connected ? "2026-08-25T18:00:00+05:00" : "Not connected in demo",
  }
}

function baseFeatureValues(index: number, behaviorProfile: SyntheticProfile["behaviorProfile"]) {
  const rand = createSeededRandom(`${DEMO_SEED}-${index}-${behaviorProfile}`)
  const profileBase = { steady: 0.82, building: 0.66, volatile: 0.5, thin_file: 0.58 }[behaviorProfile]
  const jitter = (scale = 0.16) => (rand() - 0.5) * scale
  return {
    utility_on_time_ratio: clamp01(profileBase + jitter()),
    utility_missed_payment_rate: clamp01(0.18 - profileBase / 7 + jitter(0.08)),
    utility_amount_volatility: clamp01(0.54 - profileBase / 3 + jitter()),
    utility_observation_months: behaviorProfile === "thin_file" ? 7 : 12,
    telecom_recharge_regularity: clamp01(profileBase + jitter()),
    telecom_account_tenure_months: Math.round(18 + profileBase * 48 + rand() * 12),
    telecom_failed_payment_rate: clamp01(0.16 - profileBase / 8 + jitter(0.07)),
    wallet_inflow_regularity: clamp01(profileBase + jitter()),
    wallet_outflow_volatility: clamp01(0.55 - profileBase / 3 + jitter()),
    wallet_balance_stability: clamp01(profileBase + jitter()),
    wallet_failed_transaction_rate: clamp01(0.14 - profileBase / 9 + jitter(0.08)),
    bill_payment_consistency: clamp01(profileBase + jitter()),
    simulated_repayment_ratio: clamp01(profileBase + jitter()),
    simulated_days_late_average: Math.round(clamp01(0.75 - profileBase + jitter(0.2)) * 20),
    cash_flow_coverage: clamp01(profileBase + jitter()),
    income_stability: clamp01(profileBase + jitter()),
    expense_volatility: clamp01(0.55 - profileBase / 3 + jitter()),
    negative_balance_days: Math.round(clamp01(0.7 - profileBase + jitter(0.18)) * 18),
    account_age_months: Math.round(12 + profileBase * 60 + rand() * 10),
    data_completeness: 1,
  }
}

export function applySourceConsent(features: Record<string, number | null>, consent: SourceConsentState) {
  const next = { ...features }
  for (const source of Object.keys(sourceFeatureMap) as SourceKey[]) {
    if (!consent[source]) {
      for (const feature of sourceFeatureMap[source]) next[feature] = null
    }
  }
  const allFeatureNames = Object.values(sourceFeatureMap).flat()
  const available = allFeatureNames.filter((feature) => next[feature] !== null && next[feature] !== undefined).length
  next.data_completeness = rounded(available / allFeatureNames.length)
  return next
}

function consentForProfile(index: number, behaviorProfile: SyntheticProfile["behaviorProfile"]): SourceConsentState {
  const rand = createSeededRandom(`${DEMO_SEED}-consent-${index}`)
  const thin = behaviorProfile === "thin_file"
  return {
    utility: thin ? rand() > 0.18 : true,
    telecom: rand() > 0.03,
    jazzcash: thin ? false : rand() > 0.08,
    easypaisa: thin ? rand() > 0.3 : rand() > 0.06,
    cashflow: rand() > (thin ? 0.16 : 0.03),
    repayment: thin ? false : rand() > 0.1,
  }
}

function makeObservations(index: number, features: Record<string, number | null>): FinancialObservation[] {
  const months = ["Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"]
  const rand = createSeededRandom(`${DEMO_SEED}-timeline-${index}`)
  const withJitter = (value: number | null, min = 0.25, max = 1, scale = 0.12) => value === null ? null : rounded(Math.max(min, Math.min(max, value + (rand() - 0.5) * scale)))
  return months.map((month) => ({
    month,
    utilityOnTimeRatio: withJitter(features.utility_on_time_ratio),
    telecomContinuity: withJitter(features.telecom_recharge_regularity, 0.25, 1, 0.14),
    walletInflowRegularity: withJitter(features.wallet_inflow_regularity),
    walletOutflowVolatility: withJitter(features.wallet_outflow_volatility, 0.05, 0.9, 0.15),
    cashFlowCoverage: withJitter(features.cash_flow_coverage),
    repaymentRatio: withJitter(features.simulated_repayment_ratio, 0.25, 1, 0.11),
  }))
}

const names = ["Ayesha Khan", "Hassan Raza", "Fatima Noor", "Omar Siddiqui", "Mina Tariq", "Zain Ali", "Sara Ahmed", "Ahad Ali Khan", "Nabeegh Ahmed", "Maham Iqbal", "Danish Farooq", "Iqra Malik"]
const cities = ["Lahore", "Karachi", "Islamabad", "Rawalpindi", "Faisalabad", "Multan", "Peshawar", "Hyderabad"]
const profiles: SyntheticProfile["behaviorProfile"][] = ["steady", "building", "volatile", "thin_file"]

export function generateSyntheticProfiles(count = 24): SyntheticProfile[] {
  return Array.from({ length: count }, (_, index) => {
    const behaviorProfile = profiles[index % profiles.length]
    const rand = createSeededRandom(`${DEMO_SEED}-profile-${index}`)
    const consent = consentForProfile(index, behaviorProfile)
    const features = applySourceConsent(baseFeatureValues(index, behaviorProfile), consent)
    const score = inferLogisticScore(features, activeModelArtifact) ?? calculateBaselineScore(features)
    const dataCoverage = Math.round(Number(features.data_completeness) * 100)
    const sources = (Object.keys(sourceFeatureMap) as SourceKey[]).map((source) => sourceStatus(source, consent[source], dataCoverage))
    return {
      id: `synthetic-customer-${String(index + 1).padStart(4, "0")}`,
      maskedCustomerId: `PK-DEMO-****-${String(4300 + index)}`,
      name: names[index % names.length],
      role: "customer",
      city: cities[index % cities.length],
      organizationId: "org-meezan-demo",
      monthlyIncomePkr: Math.round(48000 + Number(features.income_stability ?? 0.55) * 95000 + rand() * 18000),
      observationMonths: behaviorProfile === "thin_file" ? 7 : 12,
      behaviorProfile,
      features,
      score: { ...score, dataCoverage, confidence: dataCoverage >= 85 ? "High coverage" : dataCoverage >= 65 ? "Medium coverage" : "Limited coverage" },
      sources,
      observations: makeObservations(index, features),
      recommendations: [
        "Keep simulated utility payments on or before due dates.",
        "Maintain regular wallet inflow regularity rather than focusing on high transaction volume.",
        "Reconnect or add missing simulated sources to improve score confidence.",
      ],
    }
  })
}

export const syntheticProfiles = generateSyntheticProfiles()

export const organizations: Organization[] = [
  { id: "org-meezan-demo", name: "Crescent Bank Demo Review Unit", type: "bank", activeUsers: 18 },
  { id: "org-platform", name: "CredAI Platform Admin", type: "platform", activeUsers: 4 },
]

export const loanApplications: LoanApplication[] = syntheticProfiles.slice(0, 10).map((profile, index) => ({
  id: `loan-demo-${String(index + 1).padStart(3, "0")}`,
  customerId: profile.id,
  amountPkr: [180000, 320000, 650000, 940000, 220000, 510000, 125000, 780000, 430000, 600000][index],
  tenureMonths: [6, 12, 18, 24, 9, 18, 6, 24, 12, 18][index],
  purpose: ["Working capital", "Education fees", "Inventory purchase", "Home repair", "Medical expense", "Motorbike finance", "Utility catch-up", "Shop expansion", "Equipment repair", "Rent advance"][index],
  status: ["submitted", "in_review", "referred", "in_review", "approved_for_demo", "in_review", "submitted", "declined_for_demo", "approved_for_demo", "referred"][index] as LoanApplication["status"],
  createdAt: `2026-08-${String(10 + index).padStart(2, "0")}T10:30:00+05:00`,
  humanReviewRequired: true,
}))

export const decisionRecords: DecisionRecord[] = [
  { id: "decision-001", applicationId: "loan-demo-005", reviewerRole: "bank_analyst", decision: "approve_for_demo", reason: "Stable simulated repayments and strong data coverage.", createdAt: "2026-08-20T14:15:00+05:00" },
  { id: "decision-002", applicationId: "loan-demo-008", reviewerRole: "bank_manager", decision: "decline_for_demo", reason: "Multiple cash-flow warning indicators require a declined demo outcome.", createdAt: "2026-08-21T11:05:00+05:00" },
  { id: "decision-003", applicationId: "loan-demo-010", reviewerRole: "bank_analyst", decision: "refer_for_manual_review", reason: "Thin source coverage; request additional synthetic verification.", createdAt: "2026-08-22T16:45:00+05:00" },
]

export const auditEvents: AuditEvent[] = [
  { id: "audit-001", actorId: "demo-customer-001", organization: "CredAI", role: "customer", action: "Profile generation", resource: "synthetic-customer-0001", modelVersion: activeModelArtifact.modelVersion, timestamp: "2026-08-19T09:15:00+05:00", result: "success" },
  { id: "audit-002", actorId: "demo-bank-analyst-001", organization: "Crescent Bank Demo Review Unit", role: "bank_analyst", action: "Score viewed by bank user", resource: "loan-demo-003", modelVersion: activeModelArtifact.modelVersion, timestamp: "2026-08-20T10:30:00+05:00", result: "success" },
  { id: "audit-003", actorId: "demo-bank-analyst-001", organization: "Crescent Bank Demo Review Unit", role: "bank_analyst", action: "Decision recorded", resource: "decision-001", modelVersion: activeModelArtifact.modelVersion, timestamp: "2026-08-20T14:15:00+05:00", result: "success" },
  { id: "audit-004", actorId: "demo-admin-001", organization: "CredAI Platform Admin", role: "admin", action: "Model evaluation", resource: activeModelArtifact.modelVersion, modelVersion: activeModelArtifact.modelVersion, timestamp: "2026-08-23T12:00:00+05:00", result: "success" },
  { id: "audit-005", actorId: "demo-customer-001", organization: "CredAI", role: "customer", action: "Consent revoked", resource: "simulated-jazzcash", modelVersion: activeModelArtifact.modelVersion, timestamp: "2026-08-24T15:25:00+05:00", result: "warning" },
]

// Computed by scripts/train-model.mjs from actual test-split predictions grouped by synthetic_audit_group.
export const fairnessDiagnostics: FairnessGroup[] = evaluationSnapshot.fairnessDiagnostics

// Measured values written by the generation/training pipeline; not hand-authored.
export const datasetSummary: SyntheticDatasetSummary = {
  seed: evaluationSnapshot.datasetSeed,
  generatorVersion: evaluationSnapshot.generatorVersion,
  createdAt: evaluationSnapshot.generatedAt,
  profileCount: evaluationSnapshot.datasetRowCount,
  eventCount: evaluationSnapshot.datasetEventCount,
  enabledSources: Object.keys(sourceFeatureMap),
  missingDataRate: evaluationSnapshot.datasetMissingness,
  noiseLevel: 0.12,
  labelGenerationMethod: "Latent repayment-success process using consistency, stability, tenure, coverage, and controlled noise.",
  digest: evaluationSnapshot.datasetDigest,
  observationMonths: Math.round(evaluationSnapshot.datasetEventCount / Math.max(1, evaluationSnapshot.datasetRowCount) / Object.keys(sourceFeatureMap).length),
}

export const modelMetrics: ModelMetrics = activeModelArtifact.metrics
export { modelRegistry }

export function getPrimaryCustomer() {
  return syntheticProfiles[0]
}

export function getApplicationById(id: string) {
  return loanApplications.find((application) => application.id === id)
}

export function getApplicantById(id: string) {
  return syntheticProfiles.find((profile) => profile.id === id)
}

export function requireApplicationById(id: string) {
  const application = getApplicationById(id)
  if (!application) throw new Error(`Unknown demo application ID: ${id}`)
  return application
}

export function requireApplicantById(id: string) {
  const applicant = getApplicantById(id)
  if (!applicant) throw new Error(`Unknown synthetic applicant ID: ${id}`)
  return applicant
}

export function formatPkr(amount: number) {
  return new Intl.NumberFormat("en-PK", { style: "currency", currency: "PKR", maximumFractionDigits: 0 }).format(amount)
}
