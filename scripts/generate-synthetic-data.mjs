const SEED = "credai-demo-v1"
const COUNT = Number(process.argv[2] ?? 2000)

function createSeededRandom(seed) {
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

function round(value, decimals = 4) {
  const factor = 10 ** decimals
  return Math.round(value * factor) / factor
}

function clamp01(value) {
  return Math.max(0, Math.min(1, value))
}

function makeRow(index) {
  const rand = createSeededRandom(`${SEED}-${index}`)
  const profiles = [0.82, 0.66, 0.5, 0.58]
  const base = profiles[index % profiles.length]
  const jitter = (scale = 0.16) => (rand() - 0.5) * scale
  const utilityOnTime = clamp01(base + jitter())
  const repaymentRatio = clamp01(base + jitter())
  const cashFlowCoverage = clamp01(base + jitter())
  const walletStability = clamp01(base + jitter())
  const daysLate = Math.round(clamp01(0.75 - base + jitter(0.2)) * 20)
  const dataCompleteness = clamp01(0.9 + jitter(0.1) - (index % 4 === 3 ? 0.16 : 0))
  const latent = 1.5 * repaymentRatio + 1.1 * utilityOnTime + 0.9 * cashFlowCoverage + 0.7 * walletStability + 0.4 * dataCompleteness - 0.04 * daysLate - 2.1 + (rand() - 0.5) * 0.35
  const probability = 1 / (1 + Math.exp(-latent))
  return {
    id: `synthetic-${String(index + 1).padStart(5, "0")}`,
    utility_on_time_ratio: round(utilityOnTime),
    utility_missed_payment_rate: round(clamp01(0.18 - base / 7 + jitter(0.08))),
    utility_amount_volatility: round(clamp01(0.54 - base / 3 + jitter())),
    utility_observation_months: index % 4 === 3 ? 7 : 12,
    telecom_recharge_regularity: round(clamp01(base + jitter())),
    telecom_account_tenure_months: Math.round(18 + base * 48 + rand() * 12),
    telecom_failed_payment_rate: round(clamp01(0.16 - base / 8 + jitter(0.07))),
    wallet_inflow_regularity: round(clamp01(base + jitter())),
    wallet_outflow_volatility: round(clamp01(0.55 - base / 3 + jitter())),
    wallet_balance_stability: round(walletStability),
    wallet_failed_transaction_rate: round(clamp01(0.14 - base / 9 + jitter(0.08))),
    bill_payment_consistency: round(clamp01(base + jitter())),
    simulated_repayment_ratio: round(repaymentRatio),
    simulated_days_late_average: daysLate,
    cash_flow_coverage: round(cashFlowCoverage),
    income_stability: round(clamp01(base + jitter())),
    expense_volatility: round(clamp01(0.55 - base / 3 + jitter())),
    negative_balance_days: Math.round(clamp01(0.7 - base + jitter(0.18)) * 18),
    account_age_months: Math.round(12 + base * 60 + rand() * 10),
    data_completeness: round(dataCompleteness),
    synthetic_audit_group: `Group ${String.fromCharCode(65 + (index % 4))}`,
    simulated_repayment_success: probability >= 0.58 ? 1 : 0,
  }
}

const rows = Array.from({ length: COUNT }, (_, index) => makeRow(index))
const digest = rows.reduce((sum, row) => sum + row.simulated_repayment_success + Math.round(row.utility_on_time_ratio * 1000), 0)
console.log(JSON.stringify({
  seed: SEED,
  generatorVersion: "synthetic-generator-v1.0.0",
  createdAt: "2026-08-26T09:00:00+05:00",
  profileCount: rows.length,
  eventCount: rows.length * 12 * 6,
  enabledSources: ["utility", "telecom", "jazzcash", "easypaisa", "cashflow", "repayment"],
  missingDataRate: 0.08,
  noiseLevel: 0.12,
  labelGenerationMethod: "Latent repayment-success process using consistency, stability, tenure, coverage, and controlled noise.",
  deterministicDigest: digest,
  preview: rows.slice(0, 3),
}, null, 2))
