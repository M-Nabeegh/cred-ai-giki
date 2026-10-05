"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { ChevronRight, Search } from "lucide-react"
import { SOURCE_KEYS } from "@/lib/core/schema"
import type { Portfolio } from "@/lib/data/service"
import { pkr } from "@/lib/format"
import { cn } from "@/lib/utils"
import { RecommendationBadge, ScorePill } from "../credit"
import { PageHeader } from "../shell/app-shell"
import { Avatar, Badge, Card, Empty, Segmented, inputClass } from "../ui"
import { relativeTime, useQueue } from "./use-queue"

type Filter = "pending" | "decided" | "all"

export function ApplicationQueue({ portfolio }: { portfolio: Portfolio }) {
  const { rows } = useQueue(portfolio)
  const [filter, setFilter] = useState<Filter>("pending")
  const [query, setQuery] = useState("")
  const visible = useMemo(() => rows
    .filter((row) => (filter === "all" ? true : filter === "pending" ? !row.final : Boolean(row.final)))
    .filter((row) => `${row.customer.name} ${row.application.id} ${row.application.purpose} ${row.customer.city ?? ""}`.toLowerCase().includes(query.toLowerCase())), [rows, filter, query])
  const counts = { pending: rows.filter((row) => !row.final).length, decided: rows.filter((row) => row.final).length, all: rows.length }

  return (
    <>
      <PageHeader title="Applications" description={`${counts.pending} waiting for a decision. Scores, affordability and policy checks are computed when you open the queue.`} />
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Segmented value={filter} onChange={setFilter} options={[{ value: "pending", label: `Needs decision · ${counts.pending}` }, { value: "decided", label: `Decided · ${counts.decided}` }, { value: "all", label: "All" }]} />
        <label className="relative sm:w-72">
          <Search className="pointer-events-none absolute top-2.5 left-3 h-4 w-4 text-ink-3" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name, ID, purpose, city" className={cn(inputClass, "pl-9")} aria-label="Search applications" />
        </label>
      </div>
      <Card className="overflow-hidden">
        {visible.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-sm">
              <thead className="border-b border-line text-left text-[13px] text-ink-3">
                <tr>
                  <th className="px-5 py-2.5 font-medium">Applicant</th>
                  <th className="px-3 py-2.5 font-medium">Request</th>
                  <th className="px-3 py-2.5 font-medium">Score</th>
                  <th className="px-3 py-2.5 font-medium">Data</th>
                  <th className="px-3 py-2.5 font-medium">DTI</th>
                  <th className="px-3 py-2.5 font-medium">Recommendation</th>
                  <th className="px-3 py-2.5 font-medium">Status</th>
                  <th className="px-3 py-2.5 font-medium">Received</th>
                  <th />
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {visible.map((row) => {
                  const href = `/lender/applications/${row.application.id}${row.local ? `?customer=${row.customer.id}` : ""}`
                  const dti = row.decision.affordability.debtToIncome
                  const affordability = row.decision.checks.find((check) => check.id === "affordability")?.status
                  return (
                    <tr key={row.application.id} className="group cursor-pointer hover:bg-surface-2/60">
                      <td className="px-5 py-2.5">
                        <Link href={href} className="flex items-center gap-3">
                          <Avatar name={row.customer.name} />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 font-medium">{row.customer.name}{row.local ? <Badge tone="info">New</Badge> : null}</div>
                            <div className="text-[13px] text-ink-3">{row.application.id} · {row.customer.segment}</div>
                          </div>
                        </Link>
                      </td>
                      <td className="px-3 py-2.5"><div className="tnum">{pkr(row.application.amount)}</div><div className="text-[13px] text-ink-3">{row.application.tenureMonths} mo · {row.application.purpose}</div></td>
                      <td className="px-3 py-2.5"><ScorePill score={row.report.score} grade={row.report.grade} /></td>
                      <td className="px-3 py-2.5">
                        <div className="flex gap-0.5" aria-label={`${5 - row.report.missingSources.length} of 5 sources`}>
                          {SOURCE_KEYS.map((key) => <span key={key} title={key} className={cn("h-3 w-1.5 rounded-sm", row.report.sources[key] ? "bg-ink-2" : "bg-line-strong")} />)}
                        </div>
                      </td>
                      <td className={cn("px-3 py-2.5 tnum", affordability === "fail" ? "text-bad-ink" : affordability === "warn" && dti !== null ? "text-warn-ink" : "")}>{dti === null ? "—" : `${Math.round(dti * 100)}%`}</td>
                      <td className="px-3 py-2.5"><RecommendationBadge value={row.decision.recommendation} /></td>
                      <td className="px-3 py-2.5">{row.final ? <Badge tone={row.final.outcome === "approved" ? "good" : row.final.outcome === "declined" ? "bad" : "warn"}>{row.final.outcome[0].toUpperCase() + row.final.outcome.slice(1)}</Badge> : row.decision.tier === "instant" && row.decision.recommendation === "approve" ? <Badge tone="info">Instant eligible</Badge> : <Badge>Pending</Badge>}</td>
                      <td className="px-3 py-2.5 text-[13px] text-ink-3 whitespace-nowrap">{relativeTime(row.application.createdAt)}</td>
                      <td className="pr-4"><Link href={href} aria-label={`Open ${row.application.id}`}><ChevronRight className="h-4 w-4 text-ink-3 group-hover:text-ink" /></Link></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : <div className="p-5"><Empty title="Nothing here">No applications match this filter.</Empty></div>}
      </Card>
    </>
  )
}

