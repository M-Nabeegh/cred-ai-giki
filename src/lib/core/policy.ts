import type { LoanRequest } from "./schema"
import type { ScoreReport } from "./scorecard"

/** The parts of a score report the policy needs — a slim report from the API is enough. */
export type PolicyInput = Pick<ScoreReport, "score" | "sources" | "facts" | "missingSources">
import { round } from "./stats"

export type Policy = {
  /** Scores at or above this are recommended for approval. */
  approveMinScore: number
  /** Scores below this are recommended for decline. Between the two: refer to an analyst. */
  declineBelowScore: number
  /** Maximum share of monthly income all instalments may take. */
  maxDebtToIncome: number
  /** Minimum number of connected data sources (of five). */
  minSources: number
  /** Loans at or under this amount can be approved instantly; larger ones always need review (two-tier model). */
  instantLimit: number
  /** Annual percentage rate used for instalment estimates. */
  apr: number
}

export const DEFAULT_POLICY: Policy = {
  approveMinScore: 660,
  declineBelowScore: 560,
  maxDebtToIncome: 0.4,
  minSources: 3,
  instantLimit: 100_000,
  apr: 0.28,
}

export type CheckStatus = "pass" | "warn" | "fail"
export type PolicyCheck = { id: string; label: string; status: CheckStatus; detail: string }
export type Recommendation = "approve" | "refer" | "decline"

export type Affordability = {
  monthlyIncome: number | null
  incomeSource: "bank" | "wallet" | "declared" | "none"
  existingObligations: number
  installment: number
  debtToIncome: number | null
  maxAffordableAmount: number | null
}

export type Decision = {
  recommendation: Recommendation
  tier: "instant" | "reviewed"
  requiresHumanReview: boolean
  checks: PolicyCheck[]
  affordability: Affordability
  summary: string
}

export function monthlyInstallment(principal: number, tenureMonths: number, apr: number) {
  const r = apr / 12
  if (r === 0) return principal / tenureMonths
  return (principal * r) / (1 - (1 + r) ** -tenureMonths)
}

/** Largest principal whose instalment fits in `budget` per month. */
export function principalForInstallment(budget: number, tenureMonths: number, apr: number) {
  const r = apr / 12
  if (budget <= 0) return 0
  return r === 0 ? budget * tenureMonths : (budget * (1 - (1 + r) ** -tenureMonths)) / r
}

export function estimateIncome(report: PolicyInput, declared?: number): Pick<Affordability, "monthlyIncome" | "incomeSource"> {
  if (report.sources.bank && report.facts.bank.medianIncome > 0) return { monthlyIncome: Math.round(report.facts.bank.medianIncome), incomeSource: "bank" }
  if (report.sources.wallet && report.facts.wallet.averageMonthlyOut > 0) return { monthlyIncome: Math.round(report.facts.wallet.averageMonthlyOut * 1.05), incomeSource: "wallet" }
  if (declared) return { monthlyIncome: Math.round(declared * 0.8), incomeSource: "declared" }
  return { monthlyIncome: null, incomeSource: "none" }
}

export function evaluateApplication(report: PolicyInput, loan: LoanRequest, policy: Policy = DEFAULT_POLICY, declaredIncome?: number): Decision {
  const income = estimateIncome(report, declaredIncome)
  const existing = report.facts.credit.activeInstallment
  const installment = Math.round(monthlyInstallment(loan.amount, loan.tenureMonths, policy.apr))
  const dti = income.monthlyIncome ? round((installment + existing) / income.monthlyIncome, 3) : null
  const budget = income.monthlyIncome ? income.monthlyIncome * policy.maxDebtToIncome - existing : null
  const maxAffordableAmount = budget !== null ? Math.max(0, Math.floor(principalForInstallment(budget, loan.tenureMonths, policy.apr) / 1000) * 1000) : null
  const connected = 5 - report.missingSources.length
  const tier = loan.amount <= policy.instantLimit ? "instant" : "reviewed"

  const checks: PolicyCheck[] = [
    {
      id: "score",
      label: "Credit score",
      status: report.score >= policy.approveMinScore ? "pass" : report.score >= policy.declineBelowScore ? "warn" : "fail",
      detail: `${report.score} vs approve ≥ ${policy.approveMinScore}, decline < ${policy.declineBelowScore}`,
    },
    {
      id: "affordability",
      label: "Debt-to-income",
      status: dti === null ? "warn" : dti <= policy.maxDebtToIncome ? "pass" : dti <= policy.maxDebtToIncome * 1.25 ? "warn" : "fail",
      detail: dti === null ? "No verifiable income source connected" : `${Math.round(dti * 100)}% of income vs ${Math.round(policy.maxDebtToIncome * 100)}% limit`,
    },
    {
      id: "coverage",
      label: "Data coverage",
      status: connected >= policy.minSources ? "pass" : connected >= policy.minSources - 1 ? "warn" : "fail",
      detail: `${connected} of 5 sources connected (minimum ${policy.minSources})`,
    },
    {
      id: "tier",
      label: "Loan tier",
      status: tier === "instant" ? "pass" : "warn",
      detail: tier === "instant" ? `At or under the PKR ${policy.instantLimit.toLocaleString("en-US")} instant limit` : `Above PKR ${policy.instantLimit.toLocaleString("en-US")} — analyst review and documents required`,
    },
  ]

  if (report.sources.bank && report.facts.bank.negativeDaysPerMonth > 3) {
    checks.push({ id: "overdraft", label: "Overdraft pattern", status: "warn", detail: `Overdrawn ~${report.facts.bank.negativeDaysPerMonth.toFixed(1)} days a month` })
  }
  if (report.sources.utility && report.facts.utility.unpaid > 1) {
    checks.push({ id: "arrears", label: "Utility arrears", status: "warn", detail: `${report.facts.utility.unpaid} bills unpaid past 30 days` })
  }

  // Score and core checks drive the recommendation; tier and flags only decide who signs off.
  const status = (id: string) => checks.find((check) => check.id === id)!.status
  const core = ["score", "affordability", "coverage"].map(status)
  const recommendation: Recommendation = status("score") === "fail" ? "decline" : core.every((s) => s === "pass") ? "approve" : "refer"

  const requiresHumanReview = tier === "reviewed" || recommendation !== "approve"
  const summary = recommendation === "approve"
    ? tier === "instant" ? "Meets every policy check. Eligible for instant approval." : "Meets policy. Above the instant limit, so an analyst confirms."
    : recommendation === "refer"
      ? "Borderline on one or more checks. Route to an analyst."
      : "Fails a hard policy check. Recommend decline with reasons."

  return {
    recommendation,
    tier,
    requiresHumanReview,
    checks,
    affordability: { ...income, existingObligations: existing, installment, debtToIncome: dti, maxAffordableAmount },
    summary,
  }
}
