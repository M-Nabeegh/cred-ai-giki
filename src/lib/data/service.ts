import "server-only"
import { evaluateApplication } from "../core/policy"
import { scoreHistory, scoreRecord, type ScoreReport } from "../core/scorecard"
import type { CustomerRecord } from "../core/schema"
import { artifact } from "../model"
import { getProvider } from "./provider"
import type { Application, DecisionEntry } from "./types"

export type SlimReport = Pick<ScoreReport, "score" | "grade" | "gradeLabel" | "repaymentProbability" | "sources" | "missingSources" | "confidence" | "facts" | "baseScore">
export type CustomerCard = { id: string; name: string; city?: string; segment?: string; declaredIncome?: number }
export type QueueApplication = Application & { seeded?: DecisionEntry }

export function slim(report: ScoreReport): SlimReport {
  const { score, grade, gradeLabel, repaymentProbability, sources, missingSources, confidence, facts, baseScore } = report
  return { score, grade, gradeLabel, repaymentProbability, sources, missingSources, confidence, facts, baseScore }
}

export const customerCard = (record: CustomerRecord): CustomerCard => ({ id: record.customerId, name: record.displayName, city: record.city, segment: record.segment, declaredIncome: record.declaredMonthlyIncome })

/** Applications the upstream system marks as decided get a plausible historical decision. */
function seededDecision(application: Application, report: ScoreReport, declared?: number): DecisionEntry | undefined {
  if (application.status !== "decided") return undefined
  const decision = evaluateApplication(report, application, undefined, declared)
  const outcome = decision.recommendation === "approve" || (decision.recommendation === "refer" && report.score >= 640) ? "approved" : "declined"
  const at = new Date(new Date(application.createdAt).getTime() + 26 * 3_600_000).toISOString()
  const note = outcome === "approved"
    ? decision.recommendation === "approve" ? "Clean file, affordable instalment. Approved per policy." : "Borderline score but stable income and on-time utilities. Approved with standard terms."
    : decision.recommendation === "decline" ? "Score below policy floor." : "Affordability does not hold at the requested amount. Declined; customer invited to reapply for a smaller loan."
  return { outcome, note, by: "Imran Javed", at }
}

export async function getPortfolio() {
  const provider = getProvider()
  const [records, applications] = await Promise.all([provider.listCustomers(), provider.listApplications()])
  const reports = new Map(records.map((record) => [record.customerId, scoreRecord(record, artifact)]))
  const byId = new Map(records.map((record) => [record.customerId, record]))
  return {
    provider: { kind: provider.kind, label: provider.label },
    customers: records.map(customerCard),
    reports: Object.fromEntries([...reports].map(([id, report]) => [id, slim(report)])) as Record<string, SlimReport>,
    applications: applications
      .filter((application) => reports.has(application.customerId))
      .map((application): QueueApplication => ({ ...application, seeded: seededDecision(application, reports.get(application.customerId)!, byId.get(application.customerId)?.declaredMonthlyIncome) }))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  }
}

export type Portfolio = Awaited<ReturnType<typeof getPortfolio>>

export async function getCustomerBundle(id: string) {
  const provider = getProvider()
  const record = await provider.getCustomer(id)
  if (!record) return null
  const report = scoreRecord(record, artifact)
  const applications = (await provider.listApplications()).filter((application) => application.customerId === id)
  return { record, report, applications }
}

/** The customer the demo's customer app is signed in as: the first record the provider returns. */
export async function getDemoCustomer() {
  const provider = getProvider()
  const [first] = await provider.listCustomers()
  return first ? getCustomerBundle(first.customerId) : null
}

export async function getApplicationBundle(id: string, customerHint?: string) {
  const provider = getProvider()
  const application = (await provider.listApplications()).find((item) => item.id === id) ?? null
  const customerId = application?.customerId ?? customerHint
  if (!customerId) return null
  const record = await provider.getCustomer(customerId)
  if (!record) return null
  const report = scoreRecord(record, artifact)
  return {
    application: application ? { ...application, seeded: seededDecision(application, report, record.declaredMonthlyIncome) } : null,
    customer: customerCard(record),
    report,
    history: scoreHistory(record, artifact),
    window: monthsOf(record),
  }
}

function monthsOf(record: CustomerRecord) {
  const [year, month] = record.asOf.slice(0, 7).split("-").map(Number)
  return Array.from({ length: 12 }, (_, i) => {
    const d = new Date(Date.UTC(year, month - 12 + i, 1))
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`
  })
}
