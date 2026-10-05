import { SOURCE_KEYS, type CustomerRecord, type SourceKey } from "./schema"
import { clamp, cv, daysBetween, mean, median, monthKey, monthsEnding, round, toDay } from "./stats"

export const WINDOW_MONTHS = 12

export type FeatureFormat = "pct" | "months" | "days" | "ratio"

export type FeatureDefinition = {
  key: string
  source: SourceKey | "profile"
  direction: 1 | -1
  label: string
  format: FeatureFormat
  description: string
  /** One factual sentence about the customer's own data. */
  explain: (facts: FeatureFacts) => string
}

export type FeatureFacts = {
  utility: { bills: number; onTime: number; late: number; unpaid: number; months: number; averageBill: number }
  telecom: { payments: number; failed: number; activeMonths: number; tenureMonths: number; operator?: string }
  wallet: { transactions: number; failed: number; activeMonths: number; averageBalance: number; averageMonthlyOut: number; provider?: string }
  bank: { monthlyIn: number[]; monthlyOut: number[]; medianIncome: number; negativeDaysPerMonth: number; bufferMonths: number; institution?: string }
  credit: { installments: number; onTime: number; averageDaysLate: number; activeInstallment: number; lender?: string }
  sourcesConnected: number
}

const pct = (value: number) => `${Math.round(value * 100)}%`
const pkr = (value: number) => `PKR ${Math.round(value).toLocaleString("en-US")}`

export const FEATURES: FeatureDefinition[] = [
  {
    key: "utility_on_time_ratio", source: "utility", direction: 1, format: "pct",
    label: "Utility bills paid on time",
    description: "Share of utility bills paid on or before the due date.",
    explain: (f) => `Paid ${f.utility.onTime} of ${f.utility.bills} utility bills on or before the due date.`,
  },
  {
    key: "utility_unpaid_ratio", source: "utility", direction: -1, format: "pct",
    label: "Utility bills left unpaid",
    description: "Share of bills still unpaid more than 30 days after the due date.",
    explain: (f) => f.utility.unpaid ? `${f.utility.unpaid} utility ${f.utility.unpaid === 1 ? "bill was" : "bills were"} left unpaid for over 30 days.` : "No utility bill was left unpaid past 30 days.",
  },
  {
    key: "utility_months_observed", source: "utility", direction: 1, format: "months",
    label: "Utility history length",
    description: "Months in the 12-month window with at least one bill.",
    explain: (f) => `${f.utility.months} months of utility billing history.`,
  },
  {
    key: "telecom_active_ratio", source: "telecom", direction: 1, format: "pct",
    label: "Mobile account activity",
    description: "Share of months with at least one successful top-up or bill payment.",
    explain: (f) => `Mobile account was topped up in ${f.telecom.activeMonths} of the last ${WINDOW_MONTHS} months.`,
  },
  {
    key: "telecom_tenure_months", source: "telecom", direction: 1, format: "months",
    label: "Mobile number age",
    description: "Months since the mobile account was opened.",
    explain: (f) => `Same mobile number for ${Math.floor(f.telecom.tenureMonths / 12)} years ${f.telecom.tenureMonths % 12} months.`,
  },
  {
    key: "telecom_failed_rate", source: "telecom", direction: -1, format: "pct",
    label: "Failed mobile payments",
    description: "Failed top-ups or bill payments as a share of all attempts.",
    explain: (f) => f.telecom.failed ? `${f.telecom.failed} of ${f.telecom.payments} mobile payments failed.` : "No failed mobile payments.",
  },
  {
    key: "wallet_active_ratio", source: "wallet", direction: 1, format: "pct",
    label: "Wallet income regularity",
    description: "Share of months with incoming wallet transfers.",
    explain: (f) => `Received money into the wallet in ${f.wallet.activeMonths} of ${WINDOW_MONTHS} months.`,
  },
  {
    key: "wallet_failed_rate", source: "wallet", direction: -1, format: "pct",
    label: "Failed wallet payments",
    description: "Failed wallet transactions, usually from insufficient balance.",
    explain: (f) => f.wallet.failed ? `${f.wallet.failed} wallet payments failed, mostly for insufficient balance.` : "No failed wallet payments.",
  },
  {
    key: "wallet_buffer_ratio", source: "wallet", direction: 1, format: "ratio",
    label: "Wallet balance cushion",
    description: "Average month-end wallet balance relative to monthly wallet spending.",
    explain: (f) => `Average wallet balance of ${pkr(f.wallet.averageBalance)} against ${pkr(f.wallet.averageMonthlyOut)} monthly wallet spend.`,
  },
  {
    key: "income_regularity", source: "bank", direction: 1, format: "pct",
    label: "Income regularity",
    description: "1 − coefficient of variation of monthly account inflows.",
    explain: (f) => `Typical monthly income of ${pkr(f.bank.medianIncome)}, ${f.bank.monthlyIn.filter((v) => v > 0).length} of ${WINDOW_MONTHS} months with deposits.`,
  },
  {
    key: "cash_flow_coverage", source: "bank", direction: 1, format: "ratio",
    label: "Income covers spending",
    description: "Total inflows divided by total outflows over the window.",
    explain: (f) => {
      const ratio = f.bank.monthlyOut.reduce((a, b) => a + b, 0) ? f.bank.monthlyIn.reduce((a, b) => a + b, 0) / f.bank.monthlyOut.reduce((a, b) => a + b, 0) : 0
      return ratio >= 1 ? `Income exceeded spending by ${pct(ratio - 1)} over the year.` : `Spending exceeded income by ${pct(1 - ratio)} over the year.`
    },
  },
  {
    key: "expense_volatility", source: "bank", direction: -1, format: "pct",
    label: "Spending volatility",
    description: "Coefficient of variation of monthly outflows.",
    explain: (f) => `Monthly spending ranged from ${pkr(Math.min(...f.bank.monthlyOut))} to ${pkr(Math.max(...f.bank.monthlyOut))}.`,
  },
  {
    key: "negative_balance_days", source: "bank", direction: -1, format: "days",
    label: "Overdrawn days",
    description: "Average days per month the account closed below zero.",
    explain: (f) => f.bank.negativeDaysPerMonth > 0.05 ? `Account was overdrawn about ${f.bank.negativeDaysPerMonth.toFixed(1)} days a month.` : "Account never went overdrawn.",
  },
  {
    key: "buffer_months", source: "bank", direction: 1, format: "months",
    label: "Savings buffer",
    description: "Average month-end balance divided by average monthly spending.",
    explain: (f) => `Balance typically covers ${f.bank.bufferMonths.toFixed(1)} months of spending.`,
  },
  {
    key: "repayment_on_time_ratio", source: "credit", direction: 1, format: "pct",
    label: "Instalments paid on time",
    description: "Share of previous loan instalments paid by the due date.",
    explain: (f) => `Paid ${f.credit.onTime} of ${f.credit.installments} previous loan instalments on time.`,
  },
  {
    key: "repayment_avg_days_late", source: "credit", direction: -1, format: "days",
    label: "Days late on instalments",
    description: "Average days late across previous instalments (0 when on time).",
    explain: (f) => f.credit.averageDaysLate > 0.05 ? `Instalments were paid ${f.credit.averageDaysLate.toFixed(1)} days late on average.` : "Every previous instalment was paid on time.",
  },
  {
    key: "data_coverage", source: "profile", direction: 1, format: "pct",
    label: "Data sources connected",
    description: "Share of the five supported sources the customer has connected.",
    explain: (f) => `${f.sourcesConnected} of ${SOURCE_KEYS.length} data sources connected.`,
  },
]

export const FEATURE_KEYS = FEATURES.map((feature) => feature.key)
export const featureByKey: Record<string, FeatureDefinition> = Object.fromEntries(FEATURES.map((feature) => [feature.key, feature]))

export type FeatureVector = Record<string, number | null>

export type DerivedFeatures = {
  values: FeatureVector
  facts: FeatureFacts
  sources: Record<SourceKey, boolean>
  window: { from: string; to: string; months: string[] }
}

function inWindow(date: string, months: Set<string>, asOf: string) {
  return months.has(monthKey(date)) && date.slice(0, 10) <= asOf
}

/** Month-end balances carried forward from a chronologically sorted ledger. */
function monthEndBalances(rows: Array<{ date: string; balanceAfter?: number }>, months: string[]) {
  const sorted = rows.filter((row) => row.balanceAfter !== undefined).sort((a, b) => a.date.localeCompare(b.date))
  const result: number[] = []
  let cursor = 0
  let last: number | null = null
  for (const month of months) {
    while (cursor < sorted.length && monthKey(sorted[cursor].date) <= month) {
      last = sorted[cursor].balanceAfter!
      cursor += 1
    }
    if (last !== null) result.push(last)
  }
  return result
}

function negativeDays(rows: Array<{ date: string; balanceAfter: number }>, from: string, asOf: string) {
  const sorted = [...rows].sort((a, b) => a.date.localeCompare(b.date))
  const start = toDay(from)
  const end = toDay(asOf) + 1
  let total = 0
  for (let index = 0; index < sorted.length; index += 1) {
    if (sorted[index].balanceAfter >= 0) continue
    const spanStart = Math.max(start, toDay(sorted[index].date))
    const spanEnd = Math.min(end, index + 1 < sorted.length ? toDay(sorted[index + 1].date) : end)
    if (spanEnd > spanStart) total += spanEnd - spanStart
  }
  return total
}

export function deriveFeatures(record: CustomerRecord): DerivedFeatures {
  const asOf = record.asOf.slice(0, 10)
  const months = monthsEnding(asOf, WINDOW_MONTHS)
  const monthSet = new Set(months)
  const from = `${months[0]}-01`
  const consent = record.consent

  const utilityBills = consent.utility ? (record.utility?.bills ?? []).filter((bill) => inWindow(bill.dueDate, monthSet, asOf)) : []
  const telecomPayments = consent.telecom ? (record.telecom?.payments ?? []).filter((payment) => inWindow(payment.date, monthSet, asOf)) : []
  const walletRows = consent.wallet ? (record.wallet?.transactions ?? []).filter((row) => inWindow(row.date, monthSet, asOf)) : []
  const bankRows = consent.bank ? (record.bank?.transactions ?? []).filter((row) => inWindow(row.date, monthSet, asOf)) : []
  const installments = consent.credit ? (record.credit?.installments ?? []).filter((row) => row.dueDate.slice(0, 10) <= asOf) : []

  const sources: Record<SourceKey, boolean> = {
    utility: utilityBills.length > 0,
    telecom: consent.telecom && Boolean(record.telecom?.accountOpenedAt) && telecomPayments.length > 0,
    wallet: walletRows.length > 0,
    bank: bankRows.length > 0,
    credit: installments.length > 0,
  }

  // Utility
  const daysLate = (due: string, paid: string | null) => (paid ? daysBetween(due, paid) : daysBetween(due, asOf))
  const onTimeBills = utilityBills.filter((bill) => bill.paidAt && daysBetween(bill.dueDate, bill.paidAt) <= 0).length
  const unpaidBills = utilityBills.filter((bill) => !bill.paidAt && daysLate(bill.dueDate, null) > 30).length
  const utilityMonths = new Set(utilityBills.map((bill) => monthKey(bill.dueDate))).size

  // Telecom
  const okTelecom = telecomPayments.filter((payment) => payment.status === "success")
  const telecomActiveMonths = new Set(okTelecom.map((payment) => monthKey(payment.date))).size
  const telecomTenure = record.telecom?.accountOpenedAt ? Math.max(0, Math.floor(daysBetween(record.telecom.accountOpenedAt, asOf) / 30.44)) : 0

  // Wallet
  const okWallet = walletRows.filter((row) => row.status === "success")
  const walletInMonths = new Set(okWallet.filter((row) => row.direction === "in").map((row) => monthKey(row.date))).size
  const walletMonthlyOut = months.map((month) => okWallet.filter((row) => row.direction === "out" && monthKey(row.date) === month).reduce((total, row) => total + row.amount, 0))
  const walletBalances = monthEndBalances(okWallet, months)
  const walletAvgBalance = mean(walletBalances)
  const walletAvgOut = mean(walletMonthlyOut)

  // Bank
  const monthlyIn = months.map((month) => bankRows.filter((row) => row.direction === "in" && monthKey(row.date) === month).reduce((total, row) => total + row.amount, 0))
  const monthlyOut = months.map((month) => bankRows.filter((row) => row.direction === "out" && monthKey(row.date) === month).reduce((total, row) => total + row.amount, 0))
  const totalIn = monthlyIn.reduce((a, b) => a + b, 0)
  const totalOut = monthlyOut.reduce((a, b) => a + b, 0)
  const bankBalances = monthEndBalances(bankRows, months)
  const bankMonthsObserved = Math.max(1, new Set(bankRows.map((row) => monthKey(row.date))).size)
  const negDays = sources.bank ? negativeDays(bankRows, from, asOf) / bankMonthsObserved : 0
  const bufferMonths = mean(monthlyOut) > 0 ? Math.max(0, mean(bankBalances)) / mean(monthlyOut) : 0

  // Credit
  const instOnTime = installments.filter((row) => row.paidAt && daysBetween(row.dueDate, row.paidAt) <= 0).length
  const instLate = installments.map((row) => Math.max(0, daysLate(row.dueDate, row.paidAt)))
  const latestDue = installments.reduce<typeof installments[number] | null>((latest, row) => (!latest || row.dueDate > latest.dueDate ? row : latest), null)
  // A loan with an instalment due in the last ~35 days is treated as still running.
  const activeInstallment = latestDue && daysBetween(latestDue.dueDate, asOf) <= 35 ? latestDue.amount : 0

  const sourcesConnected = SOURCE_KEYS.filter((key) => sources[key]).length

  const facts: FeatureFacts = {
    utility: { bills: utilityBills.length, onTime: onTimeBills, late: utilityBills.length - onTimeBills - unpaidBills, unpaid: unpaidBills, months: utilityMonths, averageBill: mean(utilityBills.map((bill) => bill.amount)) },
    telecom: { payments: telecomPayments.length, failed: telecomPayments.length - okTelecom.length, activeMonths: telecomActiveMonths, tenureMonths: telecomTenure, operator: record.telecom?.operator },
    wallet: { transactions: walletRows.length, failed: walletRows.length - okWallet.length, activeMonths: walletInMonths, averageBalance: walletAvgBalance, averageMonthlyOut: walletAvgOut, provider: record.wallet?.provider },
    bank: { monthlyIn, monthlyOut, medianIncome: median(monthlyIn.filter((value) => value > 0)), negativeDaysPerMonth: negDays, bufferMonths, institution: record.bank?.institution },
    credit: { installments: installments.length, onTime: instOnTime, averageDaysLate: mean(instLate), activeInstallment, lender: record.credit?.lender },
    sourcesConnected,
  }

  const when = (present: boolean, value: () => number) => (present ? round(value()) : null)

  const values: FeatureVector = {
    utility_on_time_ratio: when(sources.utility, () => onTimeBills / utilityBills.length),
    utility_unpaid_ratio: when(sources.utility, () => unpaidBills / utilityBills.length),
    utility_months_observed: when(sources.utility, () => utilityMonths),
    telecom_active_ratio: when(sources.telecom, () => telecomActiveMonths / WINDOW_MONTHS),
    telecom_tenure_months: when(sources.telecom, () => Math.min(120, telecomTenure)),
    telecom_failed_rate: when(sources.telecom, () => (telecomPayments.length - okTelecom.length) / telecomPayments.length),
    wallet_active_ratio: when(sources.wallet, () => walletInMonths / WINDOW_MONTHS),
    wallet_failed_rate: when(sources.wallet, () => (walletRows.length - okWallet.length) / walletRows.length),
    wallet_buffer_ratio: when(sources.wallet, () => (walletAvgOut > 0 ? clamp(Math.max(0, walletAvgBalance) / walletAvgOut, 0, 3) : 0)),
    income_regularity: when(sources.bank, () => clamp(1 - cv(monthlyIn), 0, 1)),
    cash_flow_coverage: when(sources.bank, () => (totalOut > 0 ? clamp(totalIn / totalOut, 0, 2) : 2)),
    expense_volatility: when(sources.bank, () => clamp(cv(monthlyOut), 0, 1.5)),
    negative_balance_days: when(sources.bank, () => clamp(negDays, 0, 31)),
    buffer_months: when(sources.bank, () => clamp(bufferMonths, 0, 6)),
    repayment_on_time_ratio: when(sources.credit, () => instOnTime / installments.length),
    repayment_avg_days_late: when(sources.credit, () => clamp(mean(instLate), 0, 90)),
    data_coverage: round(sourcesConnected / SOURCE_KEYS.length),
  }

  return { values, facts, sources, window: { from, to: asOf, months } }
}

export function formatFeatureValue(key: string, value: number | null) {
  if (value === null) return "Not connected"
  const format = featureByKey[key]?.format
  if (format === "pct") return pct(value)
  if (format === "months") return `${value.toFixed(value % 1 ? 1 : 0)} mo`
  if (format === "days") return `${value.toFixed(1)} days`
  return `${value.toFixed(2)}×`
}
