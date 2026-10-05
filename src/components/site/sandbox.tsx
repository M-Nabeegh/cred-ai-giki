"use client"

import { useMemo, useState } from "react"
import { DEFAULT_POLICY, evaluateApplication } from "@/lib/core/policy"
import { SOURCE_KEYS, sourceMeta, type SourceKey } from "@/lib/core/schema"
import { scoreRecord } from "@/lib/core/scorecard"
import { pkr } from "@/lib/format"
import { artifact } from "@/lib/model"
import { PERSONAS, generateCustomer, type PersonaKey } from "@/lib/synthetic/generator"
import { cn } from "@/lib/utils"
import { RecommendationBadge, ScoreGauge, sourceIcons } from "../credit"
import { Card, Switch } from "../ui"

const personaOrder: PersonaKey[] = ["gig", "salaried", "merchant", "student", "stretched"]
const traitSliders = [
  { key: "discipline", label: "Pays bills on time", low: "Often late", high: "Always early" },
  { key: "stability", label: "Income steadiness", low: "Irregular", high: "Like clockwork" },
  { key: "liquidity", label: "Savings cushion", low: "Paycheck to paycheck", high: "Comfortable" },
] as const

export function Sandbox() {
  const [persona, setPersona] = useState<PersonaKey>("gig")
  const [traits, setTraits] = useState({ discipline: 0.78, stability: 0.55, liquidity: 0.45 })
  const [sources, setSources] = useState<Record<SourceKey, boolean>>({ utility: true, telecom: true, wallet: true, bank: false, credit: false })

  // Income has to land somewhere: keep at least one of bank or wallet on.
  const toggle = (key: SourceKey, on: boolean) => {
    const next = { ...sources, [key]: on }
    if (!next.bank && !next.wallet) next[key === "bank" ? "wallet" : "bank"] = true
    setSources(next)
  }

  const { report, decision, records } = useMemo(() => {
    const customer = generateCustomer({ index: 3, seed: "sandbox", persona, name: "Sample customer", city: "Lahore", traits: { ...traits, tenureYears: 5 }, sources })
    const report = scoreRecord(customer.record, artifact)
    const r = customer.record
    const records = (r.utility?.bills.length ?? 0) + (r.telecom?.payments.length ?? 0) + (r.wallet?.transactions.length ?? 0) + (r.bank?.transactions.length ?? 0) + (r.credit?.installments.length ?? 0)
    return { report, decision: evaluateApplication(report, { amount: 100_000, tenureMonths: 12 }, DEFAULT_POLICY, r.declaredMonthlyIncome), records }
  }, [persona, traits, sources])

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_400px]">
      <Card className="p-5 sm:p-6">
        <div className="text-[13px] font-medium text-ink-2">Who is applying?</div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {personaOrder.map((key) => (
            <button key={key} onClick={() => setPersona(key)} className={cn("rounded-full border px-3 py-1 text-[13px] transition-colors", persona === key ? "border-ink bg-ink text-bg" : "border-line-strong text-ink-2 hover:border-ink-3")}>{PERSONAS[key].label}</button>
          ))}
        </div>
        <div className="mt-6 space-y-5">
          {traitSliders.map((slider) => (
            <label key={slider.key} className="block">
              <span className="text-[13px] font-medium text-ink-2">{slider.label}</span>
              <input type="range" min={0.05} max={0.95} step={0.01} value={traits[slider.key]} onChange={(event) => setTraits({ ...traits, [slider.key]: Number(event.target.value) })} className="mt-1.5 w-full" aria-label={slider.label} />
              <span className="flex justify-between text-xs text-ink-3"><span>{slider.low}</span><span>{slider.high}</span></span>
            </label>
          ))}
        </div>
        <div className="mt-6 text-[13px] font-medium text-ink-2">Data the customer shares</div>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {SOURCE_KEYS.map((key) => {
            const Icon = sourceIcons[key]
            return (
              <div key={key} className="flex items-center gap-2.5 rounded-lg border border-line px-3 py-2">
                <Icon className="h-4 w-4 text-ink-3" />
                <span className="flex-1 text-[13px]">{sourceMeta[key].label}</span>
                <Switch checked={sources[key]} onChange={(next) => toggle(key, next)} label={sourceMeta[key].label} />
              </div>
            )
          })}
        </div>
        <p className="mt-4 text-xs text-ink-3">Each change simulates 18 months of raw activity — {records.toLocaleString()} records right now — then runs the production feature engine and model in your browser.</p>
      </Card>
      <Card className="flex flex-col p-5 sm:p-6">
        <ScoreGauge score={report.score} grade={report.grade} gradeLabel={report.gradeLabel} size={250} />
        <div className="mt-3 flex items-center justify-center gap-2 text-[13px]">
          <span className="text-ink-3">PKR 100,000 over 12 months</span>
          <RecommendationBadge value={decision.recommendation} />
        </div>
        <ul className="mt-5 space-y-2 border-t border-line pt-4">
          {report.contributions.filter((item) => !item.missing).slice(0, 4).map((item) => (
            <li key={item.key} className="flex items-start gap-3 text-[13px]">
              <span className={cn("mt-0.5 w-9 shrink-0 text-right font-semibold tnum", item.points >= 0 ? "text-ink" : "text-bad-ink")}>{item.points >= 0 ? "+" : "−"}{Math.abs(Math.round(item.points))}</span>
              <span className="text-ink-2">{item.reason}</span>
            </li>
          ))}
        </ul>
        <div className="mt-auto pt-4 text-xs text-ink-3">Repayment probability {Math.round(report.repaymentProbability * 100)}% · instalment {pkr(decision.affordability.installment)} · {report.confidence.toLowerCase()} confidence</div>
      </Card>
    </div>
  )
}
