"use client"

import { useState } from "react"
import { Download } from "lucide-react"
import { SOURCE_KEYS, sourceMeta, type CustomerRecord, type SourceKey } from "@/lib/core/schema"
import { dateLabel, pkr } from "@/lib/format"
import { PageHeader } from "../shell/app-shell"
import { Badge, Button, Card, Empty, Segmented } from "../ui"
import { useCustomerReport } from "./use-customer"

type Row = { date: string; description: string; amount?: number; status: { label: string; tone: "good" | "warn" | "bad" | "neutral" }; balance?: number }

function rowsFor(record: CustomerRecord, key: SourceKey): Row[] {
  if (key === "utility") return (record.utility?.bills ?? []).map((bill) => {
    const late = bill.paidAt ? Math.round((Date.parse(bill.paidAt) - Date.parse(bill.dueDate)) / 86_400_000) : null
    return { date: bill.dueDate, description: `${bill.provider ?? "Utility"} ${bill.kind} bill`, amount: bill.amount, status: bill.paidAt === null ? { label: "Unpaid", tone: "bad" } : late! <= 0 ? { label: "On time", tone: "good" } : { label: `${late} days late`, tone: "warn" } }
  })
  if (key === "telecom") return (record.telecom?.payments ?? []).map((row) => ({ date: row.date, description: `${record.telecom?.operator ?? "Mobile"} ${row.kind.replace("_", " ")}`, amount: row.amount, status: row.status === "success" ? { label: "Success", tone: "neutral" } : { label: "Failed", tone: "bad" } }))
  if (key === "wallet") return (record.wallet?.transactions ?? []).map((row) => ({ date: row.date, description: `${row.direction === "in" ? "Received" : "Paid"} · ${row.counterparty ?? ""}`, amount: row.direction === "in" ? row.amount : -row.amount, balance: row.balanceAfter, status: row.status === "success" ? { label: "Success", tone: "neutral" } : { label: "Failed", tone: "bad" } }))
  if (key === "bank") return (record.bank?.transactions ?? []).map((row) => ({ date: row.date, description: row.category ?? (row.direction === "in" ? "Deposit" : "Payment"), amount: row.direction === "in" ? row.amount : -row.amount, balance: row.balanceAfter, status: row.balanceAfter < 0 ? { label: "Overdrawn", tone: "warn" } : { label: "Posted", tone: "neutral" } }))
  return (record.credit?.installments ?? []).map((row) => {
    const late = row.paidAt ? Math.round((Date.parse(row.paidAt) - Date.parse(row.dueDate)) / 86_400_000) : null
    return { date: row.dueDate, description: `${record.credit?.lender ?? "Lender"} instalment`, amount: row.amount, status: row.paidAt === null ? { label: "Missed", tone: "bad" } : late! <= 0 ? { label: "On time", tone: "good" } : { label: `${late} days late`, tone: "warn" } }
  })
}

export function DataView({ record: base }: { record: CustomerRecord }) {
  const { record, consent } = useCustomerReport(base)
  const linked = SOURCE_KEYS.filter((key) => record[key])
  const [tab, setTab] = useState<SourceKey>(linked[0] ?? "utility")
  const rows = rowsFor(record, tab).sort((a, b) => b.date.localeCompare(a.date))
  const download = () => {
    const blob = new Blob([JSON.stringify(record, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const link = Object.assign(document.createElement("a"), { href: url, download: `credai-${record.customerId}.json` })
    link.click()
    URL.revokeObjectURL(url)
  }
  return (
    <>
      <PageHeader title="My data" description="Every record CredAI used to calculate your score, exactly as it was received. Nothing else is used." actions={<Button variant="secondary" onClick={download}><Download className="h-4 w-4" />Download JSON</Button>} />
      <Segmented value={tab} onChange={setTab} options={linked.map((key) => ({ value: key, label: sourceMeta[key].label }))} className="max-w-full overflow-x-auto" />
      <Card className="mt-4 overflow-hidden">
        {!consent[tab] ? <div className="border-b border-line bg-warn-soft px-5 py-2.5 text-[13px] text-warn-ink">You&apos;ve turned this source off, so these records are currently excluded from your score.</div> : null}
        {rows.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-line text-left text-[13px] text-ink-3">
                <tr><th className="px-5 py-2.5 font-medium">Date</th><th className="px-3 py-2.5 font-medium">Description</th><th className="px-3 py-2.5 text-right font-medium">Amount</th>{tab === "bank" || tab === "wallet" ? <th className="px-3 py-2.5 text-right font-medium">Balance</th> : null}<th className="px-5 py-2.5 text-right font-medium">Status</th></tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.slice(0, 120).map((row, index) => (
                  <tr key={`${row.date}-${index}`} className="hover:bg-surface-2/60">
                    <td className="whitespace-nowrap px-5 py-2 text-ink-2 tnum">{dateLabel(row.date)}</td>
                    <td className="px-3 py-2">{row.description}</td>
                    <td className={`whitespace-nowrap px-3 py-2 text-right tnum ${row.amount !== undefined && row.amount < 0 ? "" : "text-good-ink"}`}>{row.amount === undefined ? "—" : `${row.amount < 0 ? "−" : tab === "bank" || tab === "wallet" ? "+" : ""}${pkr(Math.abs(row.amount)).replace("PKR ", "")}`}</td>
                    {tab === "bank" || tab === "wallet" ? <td className={`whitespace-nowrap px-3 py-2 text-right tnum ${row.balance !== undefined && row.balance < 0 ? "text-bad-ink" : "text-ink-2"}`}>{row.balance === undefined ? "—" : pkr(row.balance).replace("PKR ", "")}</td> : null}
                    <td className="px-5 py-2 text-right"><Badge tone={row.status.tone}>{row.status.label}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length > 120 ? <div className="border-t border-line px-5 py-2.5 text-[13px] text-ink-3">Showing the latest 120 of {rows.length} records. Download JSON for everything.</div> : null}
          </div>
        ) : <div className="p-5"><Empty title="No records">This source isn&apos;t linked.</Empty></div>}
      </Card>
    </>
  )
}
