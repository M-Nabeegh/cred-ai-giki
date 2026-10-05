"use client"

import { RotateCcw } from "lucide-react"
import { DEFAULT_POLICY, type Policy } from "@/lib/core/policy"
import type { Portfolio } from "@/lib/data/service"
import { pkr } from "@/lib/format"
import { evaluation } from "@/lib/model"
import { cn } from "@/lib/utils"
import { RecommendationBadge } from "../credit"
import { PageHeader } from "../shell/app-shell"
import { Badge, Button, Card, CardHeader, Field } from "../ui"
import { buildQueue, useQueue } from "./use-queue"

const sliders: Array<{ key: keyof Policy; label: string; min: number; max: number; step: number; format: (value: number) => string; help: string }> = [
  { key: "approveMinScore", label: "Approve at or above", min: 560, max: 780, step: 10, format: String, help: "Scores here and up are recommended for approval." },
  { key: "declineBelowScore", label: "Decline below", min: 460, max: 680, step: 10, format: String, help: "Between the two thresholds, applications go to an analyst." },
  { key: "maxDebtToIncome", label: "Maximum debt-to-income", min: 0.2, max: 0.6, step: 0.05, format: (v) => `${Math.round(v * 100)}%`, help: "All instalments as a share of verified monthly income." },
  { key: "minSources", label: "Minimum data sources", min: 1, max: 5, step: 1, format: (v) => `${v} of 5`, help: "Fewer connected sources means less evidence." },
  { key: "instantLimit", label: "Instant-decision limit", min: 25_000, max: 300_000, step: 25_000, format: (v) => pkr(v), help: "Above this, every approval needs an analyst (two-tier model)." },
  { key: "apr", label: "APR", min: 0.12, max: 0.45, step: 0.01, format: (v) => `${Math.round(v * 100)}%`, help: "Used to compute instalments." },
]

export function PolicyEditor({ portfolio }: { portfolio: Portfolio }) {
  const { rows, demo } = useQueue(portfolio)
  const policy = demo.state.policy
  const baseline = buildQueue(portfolio, demo.state.submitted, demo.state.decisions, DEFAULT_POLICY)
  const set = (key: keyof Policy, value: number) => {
    const next = { ...policy, [key]: value }
    if (key === "approveMinScore" && next.declineBelowScore > value) next.declineBelowScore = value
    if (key === "declineBelowScore" && next.approveMinScore < value) next.approveMinScore = value
    demo.actions.setPolicy(next)
  }
  const count = (list: typeof rows, rec: string) => list.filter((row) => row.decision.recommendation === rec).length
  const cutoff = evaluation.cutoffs.reduce((best, row) => (Math.abs(row.score - policy.approveMinScore) < Math.abs(best.score - policy.approveMinScore) ? row : best))
  const changed = JSON.stringify(policy) !== JSON.stringify(DEFAULT_POLICY)

  return (
    <>
      <PageHeader title="Underwriting policy" description="Adjust thresholds and watch every recommendation in the queue update. Trade-offs are measured on the model's held-out test set." actions={changed ? <Button variant="secondary" onClick={() => demo.actions.resetPolicy()}><RotateCcw className="h-4 w-4" />Restore defaults</Button> : null} />
      <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
        <Card className="p-5">
          <div className="grid gap-x-8 gap-y-6 md:grid-cols-2">
            {sliders.map((slider) => (
              <Field key={slider.key} label={slider.label} hint={<span className="font-semibold text-ink tnum">{slider.format(policy[slider.key])}</span>}>
                <input type="range" min={slider.min} max={slider.max} step={slider.step} value={policy[slider.key]} onChange={(event) => set(slider.key, Number(event.target.value))} className="w-full" aria-label={slider.label} />
                <span className="mt-1 block text-xs text-ink-3">{slider.help}</span>
              </Field>
            ))}
          </div>
        </Card>
        <div className="space-y-4">
          <Card className="p-5">
            <div className="text-[15px] font-semibold">Effect on the queue</div>
            <div className="mt-0.5 text-[13px] text-ink-3">{rows.length} applications, current vs default policy</div>
            <ul className="mt-4 space-y-3">
              {(["approve", "refer", "decline"] as const).map((rec) => {
                const now = count(rows, rec)
                const before = count(baseline, rec)
                return (
                  <li key={rec} className="flex items-center gap-3">
                    <div className="w-24"><RecommendationBadge value={rec} /></div>
                    <div className="h-2 flex-1 rounded-full bg-surface-2"><div className="h-2 rounded-full" style={{ width: `${(now / Math.max(1, rows.length)) * 100}%`, backgroundColor: rec === "approve" ? "var(--good)" : rec === "refer" ? "var(--warn)" : "var(--bad)" }} /></div>
                    <span className="w-8 text-right text-sm font-semibold tnum">{now}</span>
                    <span className={cn("w-10 text-right text-xs tnum", now === before ? "text-ink-3" : "text-ink-2")}>{now === before ? "—" : `${now > before ? "+" : ""}${now - before}`}</span>
                  </li>
                )
              })}
            </ul>
          </Card>
          <Card className="p-5">
            <div className="text-[15px] font-semibold">Risk at this cut-off</div>
            <div className="mt-0.5 text-[13px] text-ink-3">Approving scores ≥ {cutoff.score} on {evaluation.dataset.testRows.toLocaleString()} held-out customers</div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-surface-2 p-3"><div className="text-[13px] text-ink-3">Approval rate</div><div className="text-xl font-semibold tnum">{Math.round(cutoff.approvalRate * 100)}%</div></div>
              <div className="rounded-lg bg-surface-2 p-3"><div className="text-[13px] text-ink-3">Default rate</div><div className="text-xl font-semibold tnum">{(cutoff.badRate * 100).toFixed(1)}%</div></div>
            </div>
            <p className="mt-3 text-xs text-ink-3">Without a model, approving everyone would mean a {((1 - evaluation.dataset.positiveRate) * 100).toFixed(0)}% default rate.</p>
          </Card>
        </div>
      </div>

      <Card className="mt-4">
        <CardHeader title="Cut-off trade-off" description="Each row: approve everyone at or above this score. Hover to compare." />
        <div className="mt-2 overflow-x-auto border-t border-line">
          <table className="w-full text-sm tnum">
            <thead className="text-left text-[13px] text-ink-3"><tr><th className="px-5 py-2 font-medium">Score cut-off</th><th className="px-3 py-2 font-medium">Approval rate</th><th className="px-3 py-2 font-medium">Default rate among approved</th><th className="px-5 py-2 text-right font-medium" /></tr></thead>
            <tbody className="divide-y divide-line">
              {evaluation.cutoffs.filter((row) => row.score % 20 === 0 && row.score >= 540 && row.score <= 780).map((row) => (
                <tr key={row.score} className={cn("hover:bg-surface-2/60", row.score === Math.round(policy.approveMinScore / 20) * 20 && "bg-surface-2")}>
                  <td className="px-5 py-2 font-medium">{row.score}</td>
                  <td className="px-3 py-2"><div className="flex items-center gap-2"><div className="h-1.5 w-24 rounded-full bg-surface-2"><div className="h-1.5 rounded-full bg-[var(--s1)]" style={{ width: `${row.approvalRate * 100}%` }} /></div>{Math.round(row.approvalRate * 100)}%</div></td>
                  <td className="px-3 py-2"><div className="flex items-center gap-2"><div className="h-1.5 w-24 rounded-full bg-surface-2"><div className="h-1.5 rounded-full bg-[var(--s2)]" style={{ width: `${Math.min(1, row.badRate / 0.3) * 100}%` }} /></div>{(row.badRate * 100).toFixed(1)}%</div></td>
                  <td className="px-5 py-2 text-right">{row.score === Math.round(policy.approveMinScore / 20) * 20 ? <Badge>Current</Badge> : null}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  )
}
