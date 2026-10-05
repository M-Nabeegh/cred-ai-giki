"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"
import type { Portfolio } from "@/lib/data/service"
import { pkr } from "@/lib/format"
import { PortfolioHistogram } from "../charts"
import { RecommendationBadge, ScorePill } from "../credit"
import { PageHeader } from "../shell/app-shell"
import { Avatar, Badge, ButtonLink, Card, CardHeader, Stat } from "../ui"
import { relativeTime, useQueue } from "./use-queue"

export function LenderOverview({ portfolio }: { portfolio: Portfolio }) {
  const { rows } = useQueue(portfolio)
  const pending = rows.filter((row) => !row.final)
  const decided = rows.filter((row) => row.final).sort((a, b) => b.final!.at.localeCompare(a.final!.at))
  const approved = decided.filter((row) => row.final!.outcome === "approved")
  const mix = (["approve", "refer", "decline"] as const).map((key) => ({ key, count: pending.filter((row) => row.decision.recommendation === key).length }))
  const instant = pending.filter((row) => row.decision.recommendation === "approve" && row.decision.tier === "instant").length
  const scores = Object.values(portfolio.reports).map((report) => report.score)
  const color = { approve: "var(--good)", refer: "var(--warn)", decline: "var(--bad)" }

  return (
    <>
      <PageHeader title="Lending overview" description="Applications scored from alternative data and checked against your underwriting policy. Analysts make the final call." actions={<ButtonLink href="/lender/applications">Open queue <ArrowRight className="h-4 w-4" /></ButtonLink>} />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Awaiting decision" value={pending.length} detail={`${instant} eligible for instant approval`} />
        <Stat label="Requested volume" value={pkr(pending.reduce((sum, row) => sum + row.application.amount, 0), true)} detail="Across pending applications" />
        <Stat label="Approval rate" value={decided.length ? `${Math.round((approved.length / decided.length) * 100)}%` : "—"} detail={`${approved.length} of ${decided.length} decided`} />
        <Stat label="Median applicant score" value={[...rows.map((row) => row.report.score)].sort((a, b) => a - b)[Math.floor(rows.length / 2)] ?? "—"} detail={`${portfolio.customers.length} customers on file`} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader title="Needs attention" description="Newest first. Recommendations reflect your current policy." action={<Link href="/lender/applications" className="text-[13px] font-medium text-accent hover:underline">View all</Link>} />
          <ul className="mt-2 divide-y divide-line border-t border-line">
            {pending.slice(0, 7).map((row) => (
              <li key={row.application.id}>
                <Link href={`/lender/applications/${row.application.id}${row.local ? `?customer=${row.customer.id}` : ""}`} className="flex items-center gap-3 px-5 py-2.5 hover:bg-surface-2/60">
                  <Avatar name={row.customer.name} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-sm font-medium">{row.customer.name}{row.local ? <Badge tone="info">New</Badge> : null}</div>
                    <div className="truncate text-[13px] text-ink-3">{pkr(row.application.amount)} · {row.application.tenureMonths} mo · {row.application.purpose}</div>
                  </div>
                  <ScorePill score={row.report.score} grade={row.report.grade} />
                  <div className="hidden w-24 justify-end sm:flex"><RecommendationBadge value={row.decision.recommendation} /></div>
                  <span className="hidden w-16 text-right text-[13px] text-ink-3 md:block">{relativeTime(row.application.createdAt)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
        <div className="space-y-4">
          <Card className="p-5">
            <div className="text-[15px] font-semibold">Recommendation mix</div>
            <div className="mt-0.5 text-[13px] text-ink-3">Pending applications under the current policy</div>
            <div className="mt-4 flex h-2.5 gap-0.5 overflow-hidden rounded-full">
              {mix.filter((item) => item.count).map((item) => <div key={item.key} style={{ flex: item.count, backgroundColor: color[item.key] }} />)}
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {mix.map((item) => <div key={item.key}><RecommendationBadge value={item.key} /><div className="mt-1 text-xl font-semibold tnum">{item.count}</div></div>)}
            </div>
          </Card>
          <Card>
            <CardHeader title="Score distribution" description="All customers on file" />
            <div className="px-3 pt-3 pb-3"><PortfolioHistogram scores={scores} height={170} /></div>
          </Card>
        </div>
      </div>

      <Card className="mt-4">
        <CardHeader title="Recent decisions" />
        <div className="mt-2 overflow-x-auto border-t border-line">
          <table className="w-full text-sm">
            <tbody className="divide-y divide-line">
              {decided.slice(0, 6).map((row) => (
                <tr key={row.application.id} className="hover:bg-surface-2/60">
                  <td className="px-5 py-2.5"><Link href={`/lender/applications/${row.application.id}${row.local ? `?customer=${row.customer.id}` : ""}`} className="font-medium hover:underline">{row.customer.name}</Link><div className="text-[13px] text-ink-3">{row.application.id}</div></td>
                  <td className="px-3 py-2.5 tnum">{pkr(row.application.amount)}</td>
                  <td className="px-3 py-2.5"><Badge tone={row.final!.outcome === "approved" ? "good" : row.final!.outcome === "declined" ? "bad" : "warn"}>{row.final!.outcome[0].toUpperCase() + row.final!.outcome.slice(1)}</Badge></td>
                  <td className="hidden max-w-md truncate px-3 py-2.5 text-[13px] text-ink-2 md:table-cell">{row.final!.note}</td>
                  <td className="px-5 py-2.5 text-right text-[13px] text-ink-3">{row.final!.by}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  )
}
