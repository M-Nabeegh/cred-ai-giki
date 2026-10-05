import { Code } from "@/components/code"
import { REPO_URL, SiteFooter, SiteHeader } from "@/components/site/chrome"
import { Badge, ButtonLink } from "@/components/ui"
import type { CustomerRecord } from "@/lib/core/schema"
import { publicReport, scoreRecord } from "@/lib/core/scorecard"
import { evaluateApplication } from "@/lib/core/policy"
import { artifact } from "@/lib/model"
import { syntheticPortfolio } from "@/lib/synthetic/portfolio"

export const metadata = { title: "API reference" }

const endpoints = [
  { method: "POST", path: "/api/v1/score", body: "Score raw customer records. Stateless — send a CustomerRecord, or { customer, loan, policy } to also get a decision. Nothing is stored." },
  { method: "GET", path: "/api/v1/customers", body: "Customers from the configured data provider, each with score, grade and coverage." },
  { method: "GET", path: "/api/v1/customers/{id}?amount=&tenureMonths=", body: "Full score report for one customer; add a loan amount to get the policy decision too." },
  { method: "GET", path: "/api/v1/model", body: "Model artifact (coefficients, scaling, digest), held-out metrics and the fairness audit." },
  { method: "GET", path: "/api/v1/health", body: "Data-provider connectivity, validated record count, latency and model version. 503 when the upstream is down." },
  { method: "GET", path: "/api/v1/openapi.json", body: "OpenAPI 3.1 document generated from the same Zod schemas that validate requests." },
]

function trimmed(record: CustomerRecord): CustomerRecord {
  return {
    ...record,
    utility: record.utility && { ...record.utility, bills: record.utility.bills.slice(-2) },
    telecom: record.telecom && { ...record.telecom, payments: record.telecom.payments.slice(-2) },
    wallet: record.wallet && { ...record.wallet, transactions: record.wallet.transactions.slice(-2) },
    bank: record.bank && { ...record.bank, transactions: record.bank.transactions.slice(-2) },
    credit: record.credit && { ...record.credit, installments: record.credit.installments.slice(-2) },
  }
}

export default function DevelopersPage() {
  const customer = syntheticPortfolio().customers[0].record
  const sample = trimmed(customer)
  const report = scoreRecord(customer, artifact)
  const decision = evaluateApplication(report, { amount: 150_000, tenureMonths: 12 }, undefined, customer.declaredMonthlyIncome)
  const { contributions, ...summary } = publicReport(report)
  const response = { report: { ...summary, contributions: contributions.slice(0, 2), helping: summary.helping.slice(0, 1), hurting: summary.hurting.slice(0, 1) }, decision: { recommendation: decision.recommendation, tier: decision.tier, requiresHumanReview: decision.requiresHumanReview, checks: decision.checks.slice(0, 2), affordability: decision.affordability }, meta: { model: artifact.version, digest: artifact.digest } }

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
        <div className="flex flex-wrap items-center gap-2"><Badge>v1</Badge><Badge>OpenAPI 3.1</Badge><Badge>{artifact.version}</Badge></div>
        <h1 className="mt-4 text-[34px] leading-tight font-semibold tracking-[-0.03em]">API reference</h1>
        <p className="mt-3 max-w-2xl text-ink-2">Score anyone from raw alternative data with one request, or connect CredAI to your own data service and use the lender console on top of it.</p>
        <div className="mt-6 flex gap-2"><ButtonLink href="/api/v1/openapi.json" variant="secondary">openapi.json</ButtonLink><ButtonLink href={REPO_URL} variant="ghost">Source on GitHub</ButtonLink></div>

        <h2 className="mt-14 text-xl font-semibold tracking-[-0.02em]">Endpoints</h2>
        <ul className="mt-4 divide-y divide-line rounded-xl border border-line bg-surface">
          {endpoints.map((endpoint) => (
            <li key={endpoint.path} className="grid gap-2 px-5 py-4 sm:grid-cols-[70px_1fr]">
              <span><Badge tone={endpoint.method === "POST" ? "info" : "neutral"} className="font-mono">{endpoint.method}</Badge></span>
              <div><code className="font-mono text-[13px] font-medium">{endpoint.path}</code><p className="mt-1 text-sm text-ink-2">{endpoint.body}</p></div>
            </li>
          ))}
        </ul>

        <h2 className="mt-14 text-xl font-semibold tracking-[-0.02em]">Score a customer</h2>
        <p className="mt-2 text-sm text-ink-2">A <code className="font-mono">CustomerRecord</code> holds whatever raw history the customer agreed to share. Every source is optional; missing ones lower confidence rather than failing the request. Arrays are trimmed here — a full, valid example lives in <code className="font-mono">examples/customer-record.json</code>.</p>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <Code title="Request · POST /api/v1/score">{JSON.stringify({ customer: sample, loan: { amount: 150000, tenureMonths: 12, purpose: "Laptop" } }, null, 2)}</Code>
          <Code title="Response · 200">{JSON.stringify(response, null, 2)}</Code>
        </div>
        <Code className="mt-4" title="Validation error · 422">{JSON.stringify({ error: "invalid_customer_record", issues: [{ path: "customer.utility.bills.3.dueDate", message: "Expected an ISO-8601 date (YYYY-MM-DD…)" }] }, null, 2)}</Code>

        <h2 className="mt-14 text-xl font-semibold tracking-[-0.02em]">Connect your data</h2>
        <p className="mt-2 text-sm text-ink-2">Implement three read endpoints that return the same contract, then point CredAI at them. The lender console, customer app and model card switch over with no code changes.</p>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <Code title="Your service">{`GET /customers        → CustomerRecord[] | { data: CustomerRecord[] }
GET /customers/{id}   → CustomerRecord
GET /applications     → Application[]   (optional, 404 = none)

Authorization: Bearer <CREDAI_DATA_API_KEY>`}</Code>
          <Code title=".env.local">{`CREDAI_DATA_PROVIDER=http
CREDAI_DATA_API_URL=https://data.your-bank.example/v1
CREDAI_DATA_API_KEY=...
CREDAI_DATA_REVALIDATE=60   # seconds to cache upstream reads`}</Code>
        </div>
        <Code className="mt-4" title="Try it locally with the bundled mock partner API">{`npm run mock:api          # serves 40 different customers on :4010
CREDAI_DATA_PROVIDER=http CREDAI_DATA_API_URL=http://localhost:4010 CREDAI_DATA_API_KEY=dev-key npm run dev`}</Code>

        <h2 className="mt-14 text-xl font-semibold tracking-[-0.02em]">Retrain on real outcomes</h2>
        <p className="mt-2 text-sm text-ink-2">The training script runs the production feature engine over raw records and writes the artifact the app loads. Replace the synthetic generator with your labelled history and rerun it.</p>
        <Code className="mt-4">{`npm run model:train            # writes src/lib/model/artifact.json + evaluation.json
npm test                       # feature, scoring, policy and provider tests`}</Code>
      </main>
      <SiteFooter />
    </>
  )
}
