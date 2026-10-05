import Link from "next/link"
import { ArrowRight, Building2, ShieldCheck, Smartphone } from "lucide-react"
import { Code } from "@/components/code"
import { RecommendationBadge, ScoreGauge, sourceIcons } from "@/components/credit"
import { Sandbox } from "@/components/site/sandbox"
import { REPO_URL, SiteFooter, SiteHeader } from "@/components/site/chrome"
import { Avatar, ButtonLink, Card } from "@/components/ui"
import { evaluateApplication } from "@/lib/core/policy"
import { SOURCE_KEYS, sourceMeta } from "@/lib/core/schema"
import { scoreRecord } from "@/lib/core/scorecard"
import { FEATURES } from "@/lib/core/features"
import { pkr } from "@/lib/format"
import { artifact, evaluation } from "@/lib/model"
import { syntheticPortfolio } from "@/lib/synthetic/portfolio"

function HeroPreview() {
  const customer = syntheticPortfolio().customers[1]
  const report = scoreRecord(customer.record, artifact)
  const decision = evaluateApplication(report, { amount: 80_000, tenureMonths: 9 }, undefined, customer.record.declaredMonthlyIncome)
  return (
    <Card className="overflow-hidden shadow-[0_24px_60px_-20px_rgba(0,0,0,0.18)]">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <div className="flex items-center gap-2.5">
          <Avatar name={customer.record.displayName} />
          <div>
            <div className="text-sm font-semibold">{customer.record.displayName}</div>
            <div className="text-xs text-ink-3">{customer.record.segment} · no bank account</div>
          </div>
        </div>
        <RecommendationBadge value={decision.recommendation} />
      </div>
      <div className="grid gap-4 p-4 sm:grid-cols-[200px_1fr]">
        <div className="flex flex-col items-center justify-center">
          <ScoreGauge score={report.score} grade={report.grade} gradeLabel={report.gradeLabel} size={190} />
          <div className="mt-1 text-xs text-ink-3">{pkr(80_000)} · 9 months</div>
        </div>
        <ul className="space-y-2.5">
          {report.helping.slice(0, 3).map((item) => {
            const Icon = sourceIcons[item.source]
            return (
              <li key={item.key} className="flex gap-2.5 text-[13px]">
                <Icon className="mt-0.5 h-4 w-4 shrink-0 text-ink-3" />
                <span className="flex-1 text-ink-2">{item.reason}</span>
                <span className="font-semibold tnum">+{Math.round(item.points)}</span>
              </li>
            )
          })}
          <li className="flex gap-2.5 border-t border-line pt-2.5 text-[13px] text-ink-3">{decision.summary}</li>
        </ul>
      </div>
    </Card>
  )
}

/** Rendered from the real model so the sample response can never drift from the API. */
function apiExample() {
  const customer = syntheticPortfolio().customers[1].record
  const report = scoreRecord(customer, artifact)
  const decision = evaluateApplication(report, { amount: 80_000, tenureMonths: 9 }, undefined, customer.declaredMonthlyIncome)
  const top = report.helping[0]
  return `curl -X POST https://<your-deployment>/api/v1/score \\
  -H 'content-type: application/json' \\
  -d @examples/customer-record.json

{
  "report": {
    "score": ${report.score}, "grade": "${report.grade}", "gradeLabel": "${report.gradeLabel}",
    "repaymentProbability": ${report.repaymentProbability.toFixed(2)},
    "helping": [{ "label": "${top.label}",
                  "points": ${top.points},
                  "reason": "${top.reason}" }, …],
    "missingSources": ${JSON.stringify(report.missingSources)}
  },
  "decision": { "recommendation": "${decision.recommendation}", "tier": "${decision.tier}", … }
}`
}

const steps = [
  { title: "Connect", body: "The customer consents to share utility bills, mobile top-ups, wallet, bank and repayment history — whatever they have. Any source can be switched off later." },
  { title: "Engineer", body: `${FEATURES.length} behavioural features computed from raw records: on-time ratios, income regularity, overdrawn days, savings buffer. One feature engine for training and production.` },
  { title: "Score", body: "A logistic scorecard on the familiar 300–850 scale. Each feature contributes points, and the points add up exactly — so every score explains itself." },
  { title: "Decide", body: "Affordability, coverage and score checks produce a recommendation. Small loans can clear instantly; larger ones go to an analyst. Everything is audited." },
]

const workspaces = [
  { icon: Smartphone, title: "Customer app", body: "See your score, what moves it, and the exact data used. Switch sources off and watch it recalculate. Apply with a live affordability check.", href: "/customer" },
  { icon: Building2, title: "Lender console", body: "A review queue with scores, reason codes, cash-flow charts and policy checks. Approve, refer or decline with a recorded reason. Tune the policy live.", href: "/lender" },
  { icon: ShieldCheck, title: "Platform", body: "Model card with ROC, calibration and a fairness audit; a data-source health check; and a complete audit trail of every decision.", href: "/platform" },
]

export default function Home() {
  const m = evaluation.metrics
  return (
    <>
      <SiteHeader />
      <main>
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 pt-14 pb-16 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:pt-20">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-[13px] text-ink-2">
              <span className="h-1.5 w-1.5 rounded-full bg-good" />Open source · runs on synthetic data, ready for yours
            </div>
            <h1 className="mt-5 text-[40px] leading-[1.08] font-semibold tracking-[-0.035em] sm:text-[52px]">Credit scores for people banks can&apos;t see yet.</h1>
            <p className="mt-5 max-w-xl text-[17px] leading-relaxed text-ink-2">Most adults in Pakistan don&apos;t have a bank account, let alone a credit file — but they pay electricity bills, top up phones and move money through wallets every month. CredAI turns that history into an explainable score and a lending decision a human can stand behind.</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <ButtonLink href="/demo" size="lg">Open the live demo <ArrowRight className="h-4 w-4" /></ButtonLink>
              <ButtonLink href="#try" size="lg" variant="secondary">Try the model</ButtonLink>
            </div>
            <dl className="mt-10 grid max-w-lg grid-cols-3 gap-6 border-t border-line pt-6">
              <div><dt className="text-[13px] text-ink-3">Held-out AUC</dt><dd className="mt-1 text-2xl font-semibold tracking-[-0.02em] tnum">{m.auc.toFixed(2)}</dd></div>
              <div><dt className="text-[13px] text-ink-3">Default rate cut</dt><dd className="mt-1 text-2xl font-semibold tracking-[-0.02em] tnum">{((1 - evaluation.dataset.positiveRate) * 100).toFixed(0)}% → {(m.badRateApproved * 100).toFixed(1)}%</dd></div>
              <div><dt className="text-[13px] text-ink-3">To plug in real data</dt><dd className="mt-1 text-2xl font-semibold tracking-[-0.02em]">1 env var</dd></div>
            </dl>
          </div>
          <HeroPreview />
        </section>

        <section className="border-y border-line bg-surface">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-5 text-[13px] text-ink-3 sm:px-6">
            <span>Built for data from</span>
            {SOURCE_KEYS.map((key) => {
              const Icon = sourceIcons[key]
              return <span key={key} className="flex items-center gap-2 text-ink-2"><Icon className="h-4 w-4" />{sourceMeta[key].examples}</span>
            })}
          </div>
        </section>

        <section id="how" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20 sm:px-6">
          <h2 className="max-w-2xl text-[30px] leading-tight font-semibold tracking-[-0.03em]">From raw payments to a decision in four steps</h2>
          <p className="mt-3 max-w-2xl text-ink-2">No black box. Every step is code you can read, and every score comes with the reasons behind it.</p>
          <ol className="mt-10 grid gap-px overflow-hidden rounded-xl border border-line bg-line md:grid-cols-4">
            {steps.map((step, index) => (
              <li key={step.title} className="bg-surface p-5">
                <div className="text-[13px] font-medium text-ink-3 tnum">0{index + 1}</div>
                <div className="mt-3 text-[17px] font-semibold tracking-[-0.01em]">{step.title}</div>
                <p className="mt-2 text-sm leading-relaxed text-ink-2">{step.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section id="try" className="scroll-mt-20 border-t border-line bg-surface-2/50">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
            <h2 className="text-[30px] leading-tight font-semibold tracking-[-0.03em]">Try the model</h2>
            <p className="mt-3 max-w-2xl text-ink-2">Shape a customer&apos;s behaviour and choose what they share. The score, the reasons and the lending recommendation update instantly — the same code the lender console runs.</p>
            <div className="mt-8"><Sandbox /></div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <h2 className="text-[30px] leading-tight font-semibold tracking-[-0.03em]">One engine, three workspaces</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {workspaces.map((item) => (
              <Link key={item.title} href={item.href} className="group rounded-xl border border-line bg-surface p-5 transition-colors hover:border-line-strong">
                <item.icon className="h-5 w-5 text-ink-2" />
                <div className="mt-4 flex items-center gap-1.5 text-[17px] font-semibold tracking-[-0.01em]">{item.title}<ArrowRight className="h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100" /></div>
                <p className="mt-2 text-sm leading-relaxed text-ink-2">{item.body}</p>
              </Link>
            ))}
          </div>
        </section>

        <section className="border-t border-line">
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[1fr_1.2fr]">
            <div>
              <h2 className="text-[30px] leading-tight font-semibold tracking-[-0.03em]">Bring your own data</h2>
              <p className="mt-3 text-ink-2">The demo runs on a simulated population of customers with realistic transaction histories. Swapping in a real source means implementing one JSON contract — then setting an environment variable.</p>
              <ul className="mt-5 space-y-2 text-sm text-ink-2">
                <li>— Stateless <code className="font-mono text-[13px]">POST /api/v1/score</code> for any raw record</li>
                <li>— Schema-validated: bad records are rejected with a path to the problem</li>
                <li>— OpenAPI 3.1 spec, health checks and a mock partner API included</li>
              </ul>
              <div className="mt-6 flex gap-3"><ButtonLink href="/developers" variant="secondary">API reference</ButtonLink><ButtonLink href={REPO_URL} variant="ghost">View source</ButtonLink></div>
            </div>
            <Code title="Score a customer from raw records">{apiExample()}</Code>
          </div>
        </section>

        <section className="border-t border-line bg-ink text-bg">
          <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-4 py-14 sm:flex-row sm:items-center sm:px-6">
            <div>
              <div className="text-[26px] font-semibold tracking-[-0.03em]">See it end to end in three minutes.</div>
              <p className="mt-1 text-bg/60">Apply as a customer, decide as a lender, audit as the platform team.</p>
            </div>
            <Link href="/demo" className="inline-flex h-11 items-center gap-2 rounded-lg bg-bg px-5 text-[15px] font-medium text-ink hover:bg-bg/90">Start the guided demo <ArrowRight className="h-4 w-4" /></Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  )
}
