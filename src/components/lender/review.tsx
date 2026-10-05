"use client"

import Link from "next/link"
import { useState } from "react"
import { ArrowLeft, Check, CircleAlert, X } from "lucide-react"
import { evaluateApplication } from "@/lib/core/policy"
import { SOURCE_KEYS, sourceMeta } from "@/lib/core/schema"
import type { ScoreReport } from "@/lib/core/scorecard"
import type { CustomerCard } from "@/lib/data/service"
import type { Application, DecisionEntry, DecisionOutcome } from "@/lib/data/types"
import { useDemo } from "@/lib/demo/store"
import { dateLabel, pkr } from "@/lib/format"
import { cn } from "@/lib/utils"
import { CashflowChart, ScoreHistoryChart } from "../charts"
import { FactorBars, PolicyChecks, RecommendationBadge, ScoreGauge, sourceIcons } from "../credit"
import { Avatar, Badge, Button, Card, CardHeader, Empty } from "../ui"

type Props = {
  applicationId: string
  application: (Application & { seeded?: DecisionEntry }) | null
  customer: CustomerCard
  report: ScoreReport
  history: Array<{ month: string; score: number }>
  window: string[]
}

const outcomeMeta: Record<DecisionOutcome, { label: string; tone: "good" | "warn" | "bad" }> = {
  approved: { label: "Approved", tone: "good" },
  referred: { label: "Referred", tone: "warn" },
  declined: { label: "Declined", tone: "bad" },
}

export function ApplicationReview({ applicationId, application: serverApplication, customer, report, history, window }: Props) {
  const { state, actions } = useDemo()
  const application = serverApplication ?? state.submitted.find((item) => item.id === applicationId) ?? null
  const [note, setNote] = useState("")
  const [showAll, setShowAll] = useState(false)

  if (!application) {
    return <Empty title="Application not found">{applicationId} isn&apos;t in this queue. Applications submitted in the demo live in this browser only.</Empty>
  }

  const decision = evaluateApplication(report, application, state.policy, customer.declaredIncome)
  const final = state.decisions[application.id] ?? serverApplication?.seeded ?? null
  const cashflow = window.map((month, index) => ({ month, inflow: Math.round(report.facts.bank.monthlyIn[index] ?? 0), outflow: Math.round(report.facts.bank.monthlyOut[index] ?? 0) }))
  const decide = (outcome: DecisionOutcome) => actions.decide(application.id, { outcome, note: note.trim() })
  const noteOk = note.trim().length >= 8
  const base = report.baseScore

  return (
    <>
      <Link href="/lender/applications" className="mb-4 inline-flex items-center gap-1 text-[13px] text-ink-3 hover:text-ink"><ArrowLeft className="h-3.5 w-3.5" />Applications</Link>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Avatar name={customer.name} className="h-11 w-11 text-sm" />
          <div>
            <h1 className="text-[24px] font-semibold tracking-[-0.025em]">{customer.name}</h1>
            <div className="text-[13px] text-ink-3">{customer.segment} · {customer.city} · {application.id} · received {dateLabel(application.createdAt)}</div>
          </div>
        </div>
        <div className="flex items-center gap-6 text-sm">
          <div><div className="text-[13px] text-ink-3">Requested</div><div className="font-semibold tnum">{pkr(application.amount)}</div></div>
          <div><div className="text-[13px] text-ink-3">Term</div><div className="font-semibold tnum">{application.tenureMonths} months</div></div>
          <div><div className="text-[13px] text-ink-3">Purpose</div><div className="font-semibold">{application.purpose}</div></div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <div className="min-w-0 space-y-4">
          <Card className="grid gap-2 p-5 md:grid-cols-[250px_1fr]">
            <div className="flex flex-col items-center justify-center border-line md:border-r md:pr-5">
              <ScoreGauge score={report.score} grade={report.grade} gradeLabel={report.gradeLabel} size={220} />
              <dl className="mt-3 grid w-full grid-cols-2 gap-2 text-center text-[13px]">
                <div className="rounded-lg bg-surface-2 py-2"><dt className="text-ink-3">Repay probability</dt><dd className="font-semibold tnum">{Math.round(report.repaymentProbability * 100)}%</dd></div>
                <div className="rounded-lg bg-surface-2 py-2"><dt className="text-ink-3">Confidence</dt><dd className="font-semibold">{report.confidence}</dd></div>
              </dl>
            </div>
            <div className="min-w-0 md:pl-3">
              <div className="flex items-baseline justify-between">
                <div className="text-[15px] font-semibold">Score trend</div>
                <div className="text-[13px] text-ink-3">6 months</div>
              </div>
              <ScoreHistoryChart data={history} height={190} />
            </div>
          </Card>

          <Card>
            <CardHeader
              title="Why this score"
              description={<>Points versus an average applicant ({base}). Every factor below adds up to {report.score}.</>}
              action={<Button variant="ghost" size="sm" onClick={() => setShowAll(!showAll)}>{showAll ? "Top factors" : "All factors"}</Button>}
            />
            <div className="px-3 pt-3 pb-3"><FactorBars contributions={report.contributions} limit={showAll ? 30 : 7} /></div>
            {report.missingSources.length ? <div className="border-t border-line px-5 py-3 text-[13px] text-ink-3">Not connected: {report.missingSources.map((key) => sourceMeta[key].label).join(", ")}. Those factors are scored at the population average and lower confidence.</div> : null}
          </Card>

          <Card>
            <CardHeader title="Cash flow" description={report.sources.bank ? `${report.facts.bank.institution ?? "Bank account"} · last 12 months` : "No bank account connected"} />
            <div className="px-5 pt-3 pb-5">
              {report.sources.bank ? <CashflowChart data={cashflow} /> : <Empty title="Bank data not shared">Income was estimated from wallet activity instead. Ask the customer to connect a bank account for larger amounts.</Empty>}
            </div>
          </Card>
        </div>

        <div className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          <Card>
            <CardHeader title="Recommendation" action={<RecommendationBadge value={decision.recommendation} />} />
            <p className="px-5 pt-2 text-[13px] text-ink-2">{decision.summary}</p>
            <div className="px-5 pb-1"><PolicyChecks checks={decision.checks} /></div>
            <dl className="grid grid-cols-2 gap-px border-t border-line bg-line text-[13px]">
              {[
                ["Monthly instalment", pkr(decision.affordability.installment)],
                ["Verified income", decision.affordability.monthlyIncome ? `${pkr(decision.affordability.monthlyIncome)}` : "—"],
                ["Existing instalments", pkr(decision.affordability.existingObligations)],
                ["Max affordable", pkr(decision.affordability.maxAffordableAmount)],
              ].map(([label, value]) => (
                <div key={label} className="bg-surface px-5 py-2.5"><dt className="text-ink-3">{label}</dt><dd className="font-semibold tnum">{value}</dd></div>
              ))}
            </dl>
            <div className="rounded-b-xl border-t border-line px-5 py-2.5 text-xs text-ink-3">Income source: {decision.affordability.incomeSource === "bank" ? "median monthly bank deposits" : decision.affordability.incomeSource === "wallet" ? "wallet activity (estimated)" : decision.affordability.incomeSource === "declared" ? "self-declared, discounted 20%" : "none"}</div>
          </Card>

          <Card className="p-5">
            <div className="text-[15px] font-semibold">Decision</div>
            {final ? (
              <div className="mt-3">
                <Badge tone={outcomeMeta[final.outcome].tone} className="text-[13px]">{final.outcome === "approved" ? <Check className="h-3.5 w-3.5" /> : final.outcome === "declined" ? <X className="h-3.5 w-3.5" /> : <CircleAlert className="h-3.5 w-3.5" />}{outcomeMeta[final.outcome].label}</Badge>
                <p className="mt-2 text-sm text-ink-2">&ldquo;{final.note}&rdquo;</p>
                <p className="mt-2 text-xs text-ink-3">{final.by} · {dateLabel(final.at)}</p>
              </div>
            ) : (
              <>
                <p className="mt-1 text-[13px] text-ink-3">The model recommends; you decide. A reason is required and goes to the audit log.</p>
                <textarea value={note} onChange={(event) => setNote(event.target.value)} rows={3} placeholder={decision.recommendation === "approve" ? "e.g. Stable income, utilities paid on time, instalment well within limit." : "Reason for your decision"} className="mt-3 w-full resize-none rounded-lg border border-line-strong bg-surface p-3 text-sm placeholder:text-ink-3 focus:border-ink focus:outline-none" aria-label="Decision reason" />
                <div className="mt-3 grid grid-cols-3 gap-2">
                  <Button variant="good" disabled={!noteOk} onClick={() => decide("approved")}>Approve</Button>
                  <Button variant="secondary" disabled={!noteOk} onClick={() => decide("referred")}>Refer</Button>
                  <Button variant="bad" disabled={!noteOk} onClick={() => decide("declined")}>Decline</Button>
                </div>
                {!noteOk ? <p className="mt-2 text-xs text-ink-3">Add a short reason to enable the buttons.</p> : null}
              </>
            )}
          </Card>

          <Card className="p-5">
            <div className="text-[15px] font-semibold">Data shared</div>
            <ul className="mt-3 space-y-2">
              {SOURCE_KEYS.map((key) => {
                const Icon = sourceIcons[key]
                return (
                  <li key={key} className="flex items-center gap-2.5 text-[13px]">
                    <Icon className={cn("h-4 w-4", report.sources[key] ? "text-ink-2" : "text-ink-3/50")} />
                    <span className={report.sources[key] ? "" : "text-ink-3"}>{sourceMeta[key].label}</span>
                    <span className="ml-auto">{report.sources[key] ? <Check className="h-4 w-4 text-good-ink" /> : <span className="text-ink-3">—</span>}</span>
                  </li>
                )
              })}
            </ul>
          </Card>
        </div>
      </div>
    </>
  )
}
