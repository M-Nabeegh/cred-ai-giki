"use client"

import Link from "next/link"
import { useState } from "react"
import { ArrowRight, CheckCircle2 } from "lucide-react"
import { evaluateApplication } from "@/lib/core/policy"
import type { CustomerRecord } from "@/lib/core/schema"
import type { Application } from "@/lib/data/types"
import { pkr } from "@/lib/format"
import { PolicyChecks, RecommendationBadge } from "../credit"
import { PageHeader } from "../shell/app-shell"
import { Button, ButtonLink, Card, CardHeader, Field, Segmented, inputClass } from "../ui"
import { useCustomerReport } from "./use-customer"

const purposes = ["Laptop", "Education fees", "Home repair", "Medical", "Motorbike", "Working capital", "Other"]
const tenures = ["3", "6", "9", "12", "18", "24"] as const

export function ApplyForm({ record: base }: { record: CustomerRecord }) {
  const { record, report, demo } = useCustomerReport(base)
  const [amount, setAmount] = useState(150_000)
  const [tenure, setTenure] = useState<(typeof tenures)[number]>("12")
  const [purpose, setPurpose] = useState("Laptop")
  const [submitted, setSubmitted] = useState<Application | null>(null)
  const policy = demo.state.policy
  const decision = evaluateApplication(report, { amount, tenureMonths: Number(tenure) }, policy, record.declaredMonthlyIncome)
  const outlook = decision.recommendation === "approve" ? (decision.tier === "instant" ? "Instant decision likely" : "Likely approval after a quick review") : decision.recommendation === "refer" ? "A credit analyst will review this" : "Unlikely to be approved at this amount"

  if (submitted) {
    return (
      <div className="mx-auto max-w-lg py-10 text-center">
        <CheckCircle2 className="mx-auto h-10 w-10 text-good" />
        <h1 className="mt-4 text-2xl font-semibold tracking-[-0.02em]">Application {submitted.id} submitted</h1>
        <p className="mt-2 text-sm text-ink-2">{pkr(submitted.amount)} over {submitted.tenureMonths} months for {submitted.purpose.toLowerCase()}. Your score report and the data you shared were attached automatically — no documents needed{decision.tier === "reviewed" ? " for now; larger loans may ask for one ID check" : ""}.</p>
        <div className="mt-6 rounded-xl border border-line bg-surface p-4 text-left text-[13px] text-ink-2">
          <span className="font-medium text-ink">Demo tip:</span> switch to the lender console to see this application arrive in Sara&apos;s queue with the full underwriting view.
        </div>
        <div className="mt-6 flex justify-center gap-2">
          <ButtonLink href={`/lender/applications/${submitted.id}?customer=${record.customerId}`}>Review as lender <ArrowRight className="h-4 w-4" /></ButtonLink>
          <Button variant="secondary" onClick={() => setSubmitted(null)}>New application</Button>
        </div>
      </div>
    )
  }

  return (
    <>
      <PageHeader title="Apply for a loan" description="See your instalment, affordability and likely outcome before you submit. Checking doesn't affect your score." />
      <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
        <Card className="p-5">
          <form className="space-y-6" onSubmit={(event) => { event.preventDefault(); setSubmitted(demo.actions.submitApplication({ customerId: record.customerId, amount, tenureMonths: Number(tenure), purpose }, record.displayName)) }}>
            <Field label="How much do you need?" hint={pkr(amount)}>
              <input type="range" min={10_000} max={500_000} step={5_000} value={amount} onChange={(event) => setAmount(Number(event.target.value))} className="w-full" aria-label="Loan amount" />
              <div className="mt-1 flex justify-between text-xs text-ink-3 tnum"><span>PKR 10,000</span><span>PKR 500,000</span></div>
            </Field>
            <Field label="Repay over">
              <Segmented value={tenure} onChange={setTenure} options={tenures.map((value) => ({ value, label: `${value} mo` }))} />
            </Field>
            <Field label="What's it for?">
              <select value={purpose} onChange={(event) => setPurpose(event.target.value)} className={inputClass}>
                {purposes.map((item) => <option key={item}>{item}</option>)}
              </select>
            </Field>
            <div className="grid grid-cols-2 gap-3 rounded-xl bg-surface-2 p-4 sm:grid-cols-3">
              <div><div className="text-[13px] text-ink-3">Monthly instalment</div><div className="mt-0.5 text-lg font-semibold tnum">{pkr(decision.affordability.installment)}</div></div>
              <div><div className="text-[13px] text-ink-3">Total repayable</div><div className="mt-0.5 text-lg font-semibold tnum">{pkr(decision.affordability.installment * Number(tenure))}</div></div>
              <div><div className="text-[13px] text-ink-3">Share of income</div><div className="mt-0.5 text-lg font-semibold tnum">{decision.affordability.debtToIncome === null ? "—" : `${Math.round(decision.affordability.debtToIncome * 100)}%`}</div></div>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[13px] text-ink-3">{Math.round(policy.apr * 100)}% APR, reducing balance. Loans up to {pkr(policy.instantLimit)} can be decided instantly.</p>
              <Button type="submit" size="lg">Submit application</Button>
            </div>
          </form>
        </Card>
        <Card>
          <CardHeader title="Likely outcome" description="Same policy the lender uses." action={<RecommendationBadge value={decision.recommendation} />} />
          <div className="px-5 pt-3 text-sm font-medium">{outlook}</div>
          <div className="px-5 pb-2"><PolicyChecks checks={decision.checks} /></div>
          {decision.affordability.maxAffordableAmount !== null ? (
            <div className="border-t border-line px-5 py-3 text-[13px] text-ink-2">
              Comfortable maximum over {tenure} months: <button className="font-semibold text-accent underline-offset-2 hover:underline" onClick={() => setAmount(Math.max(10_000, Math.min(500_000, Math.floor((decision.affordability.maxAffordableAmount ?? 0) / 5000) * 5000)))}>{pkr(decision.affordability.maxAffordableAmount)}</button>
            </div>
          ) : null}
        </Card>
      </div>
      <p className="mt-4 text-[13px] text-ink-3">Score {report.score} · <Link className="underline-offset-2 hover:underline" href="/customer">see what&apos;s behind it</Link></p>
    </>
  )
}
