"use client"

import { ArrowDownRight, ArrowRight, ArrowUpRight, Lightbulb } from "lucide-react"
import { DEFAULT_POLICY, evaluateApplication } from "@/lib/core/policy"
import { SOURCE_KEYS, sourceMeta, type CustomerRecord, type SourceKey } from "@/lib/core/schema"
import { dateLabel, monthLabel, pkr } from "@/lib/format"
import { artifact } from "@/lib/model"
import { ScoreHistoryChart } from "../charts"
import { ScoreGauge, sourceIcons } from "../credit"
import { PageHeader } from "../shell/app-shell"
import { Badge, ButtonLink, Card, CardHeader, Switch } from "../ui"
import { useCustomerReport } from "./use-customer"

const tips: Record<string, string> = {
  utility_on_time_ratio: "Pay electricity and gas bills by the due date — set a reminder a few days before.",
  utility_unpaid_ratio: "Clear any utility bills that are more than 30 days overdue.",
  negative_balance_days: "Keep a small buffer in your account so it doesn't dip below zero before payday.",
  expense_volatility: "Spread large purchases out; steadier monthly spending reads as lower risk.",
  buffer_months: "Leaving even half a month of spending in your account improves this quickly.",
  wallet_failed_rate: "Top up your wallet before scheduled payments so they don't bounce.",
  telecom_active_ratio: "Recharge your number every month, even with a small amount.",
  telecom_failed_rate: "Make sure there's balance before auto-recharges run.",
  income_regularity: "If possible, route your income into one account on a regular schedule.",
  cash_flow_coverage: "Aim to spend a little less than you earn each month.",
  repayment_on_time_ratio: "Pay instalments on or before the due date.",
  repayment_avg_days_late: "Even a few days late counts — pay instalments on time.",
  wallet_buffer_ratio: "Keep a little more balance in your wallet between payments.",
  wallet_active_ratio: "Receiving payments into your wallet regularly helps show steady income.",
  data_coverage: "Connect another data source to give a fuller picture.",
}

function sourceCount(record: CustomerRecord, key: SourceKey) {
  if (key === "utility") return record.utility ? `${record.utility.bills.length} bills` : null
  if (key === "telecom") return record.telecom ? `${record.telecom.payments.length} top-ups · ${record.telecom.operator}` : null
  if (key === "wallet") return record.wallet ? `${record.wallet.transactions.length} transactions · ${record.wallet.provider}` : null
  if (key === "bank") return record.bank ? `${record.bank.transactions.length} transactions · ${record.bank.institution}` : null
  return record.credit ? `${record.credit.installments.length} instalments · ${record.credit.lender}` : null
}

export function CustomerOverview({ record: base }: { record: CustomerRecord }) {
  const { record, report, history, sourceValue, consent, demo } = useCustomerReport(base)
  const first = base.displayName.split(" ")[0]
  const change = history.length > 1 ? history[history.length - 1].score - history[history.length - 2].score : 0
  const offer = evaluateApplication(report, { amount: 100_000, tenureMonths: 12 }, demo.state.policy ?? DEFAULT_POLICY, record.declaredMonthlyIncome)
  const eligible = report.score >= (demo.state.policy ?? DEFAULT_POLICY).declineBelowScore && (offer.affordability.maxAffordableAmount ?? 0) > 10_000
  const improvements = report.hurting.slice(0, 3)

  return (
    <>
      <PageHeader title={`Welcome back, ${first}`} description={`Your CredAI score is calculated from ${SOURCE_KEYS.length - report.missingSources.length} connected sources over the last 12 months. You control what's shared.`} actions={<ButtonLink href="/customer/apply">Apply for a loan <ArrowRight className="h-4 w-4" /></ButtonLink>} />

      <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
        <Card className="flex flex-col items-center justify-center px-5 py-6">
          <ScoreGauge score={report.score} grade={report.grade} gradeLabel={report.gradeLabel} size={260} />
          <div className="mt-3 flex items-center gap-2 text-[13px]">
            {change !== 0 ? <Badge tone={change > 0 ? "good" : "bad"}>{change > 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}{change > 0 ? "+" : ""}{change} since {monthLabel(history[history.length - 2].month)}</Badge> : <Badge>No change since last month</Badge>}
            <span className="text-ink-3">Updated {dateLabel(report.asOf)}</span>
          </div>
        </Card>
        <Card>
          <CardHeader title="Your score over time" description="Recalculated at each month-end from the data you shared." action={<span className="text-[13px] text-ink-3">Confidence: <span className="font-medium text-ink">{report.confidence}</span></span>} />
          <div className="px-3 pt-3 pb-4"><ScoreHistoryChart data={history} height={200} /></div>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="What's helping" description="Compared with the average applicant." />
          <ul className="space-y-0.5 px-3 pt-2 pb-3">
            {report.helping.slice(0, 4).map((item) => {
              const Icon = sourceIcons[item.source]
              return (
                <li key={item.key} className="flex gap-3 rounded-lg px-2 py-2">
                  <Icon className="mt-0.5 h-4 w-4 shrink-0 text-ink-3" />
                  <div className="min-w-0 flex-1"><div className="text-sm font-medium">{item.label}</div><div className="text-[13px] text-ink-3">{item.reason}</div></div>
                  <span className="text-sm font-semibold tnum">+{Math.round(item.points)}</span>
                </li>
              )
            })}
          </ul>
        </Card>
        <Card>
          <CardHeader title="How to improve" description="The biggest things holding your score back." />
          <ul className="space-y-0.5 px-3 pt-2 pb-3">
            {improvements.length ? improvements.map((item) => (
              <li key={item.key} className="flex gap-3 rounded-lg px-2 py-2">
                <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-warn-ink" />
                <div className="min-w-0 flex-1"><div className="text-sm font-medium">{tips[item.key] ?? item.label}</div><div className="text-[13px] text-ink-3">{item.reason}</div></div>
                <span className="text-sm font-semibold text-bad-ink tnum">−{Math.abs(Math.round(item.points))}</span>
              </li>
            )) : <li className="px-2 py-2 text-sm text-ink-3">Nothing significant is pulling your score down.</li>}
            {report.missingSources.map((key) => (
              <li key={key} className="flex gap-3 rounded-lg px-2 py-2">
                <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                <div className="min-w-0 flex-1"><div className="text-sm font-medium">Connect your {sourceMeta[key].label.toLowerCase()}</div><div className="text-[13px] text-ink-3">More data raises confidence and can unlock larger loans.</div></div>
              </li>
            )).slice(0, 2)}
          </ul>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_340px]">
        <Card>
          <CardHeader title="Connected data" description="Turn a source off and your score is recalculated without it — instantly." />
          <ul className="divide-y divide-line px-5 pt-2 pb-2">
            {SOURCE_KEYS.map((key) => {
              const Icon = sourceIcons[key]
              const available = Boolean(record[key])
              const count = sourceCount(record, key)
              const worth = sourceValue[key]
              return (
                <li key={key} className="flex items-center gap-3 py-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-surface-2"><Icon className="h-4 w-4 text-ink-2" /></span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-sm font-medium">{sourceMeta[key].label}{available && consent[key] && Math.abs(worth) >= 1 ? <span className={`text-xs font-medium tnum ${worth > 0 ? "text-good-ink" : "text-bad-ink"}`}>{worth > 0 ? "+" : "−"}{Math.abs(worth)} pts</span> : null}</div>
                    <div className="truncate text-[13px] text-ink-3">{available ? count : `Not linked · ${sourceMeta[key].examples}`}</div>
                  </div>
                  {available ? <Switch checked={consent[key]} label={`Share ${sourceMeta[key].label}`} onChange={(next) => demo.actions.setConsent(record.customerId, record.displayName, { ...consent, [key]: next }, key)} /> : <span className="text-[13px] text-ink-3">Not linked</span>}
                </li>
              )
            })}
          </ul>
        </Card>
        <Card className="flex flex-col p-5">
          <div className="text-[13px] text-ink-3">Pre-qualified offer</div>
          {eligible ? (
            <>
              <div className="mt-1 text-[28px] font-semibold tracking-[-0.025em] tnum">{pkr(Math.min(500_000, offer.affordability.maxAffordableAmount ?? 0))}</div>
              <p className="mt-1 text-[13px] text-ink-2">Up to this amount over 12 months at {Math.round((demo.state.policy ?? DEFAULT_POLICY).apr * 100)}% APR, based on your income and current score.</p>
            </>
          ) : (
            <>
              <div className="mt-1 text-lg font-semibold">Not yet</div>
              <p className="mt-1 text-[13px] text-ink-2">Your score is below the current lending threshold. The tips on this page are the fastest way up.</p>
            </>
          )}
          <dl className="mt-4 space-y-1.5 text-[13px]">
            <div className="flex justify-between"><dt className="text-ink-3">Estimated income</dt><dd className="font-medium tnum">{pkr(offer.affordability.monthlyIncome)}/mo</dd></div>
            <div className="flex justify-between"><dt className="text-ink-3">Repayment probability</dt><dd className="font-medium tnum">{Math.round(report.repaymentProbability * 100)}%</dd></div>
            <div className="flex justify-between"><dt className="text-ink-3">Model</dt><dd className="font-medium">{artifact.version.replace("credai-scorecard-", "v")}</dd></div>
          </dl>
          <ButtonLink href="/customer/apply" variant={eligible ? "primary" : "secondary"} className="mt-auto w-full" style={{ marginTop: 20 }}>{eligible ? "Start application" : "Try a smaller amount"}</ButtonLink>
        </Card>
      </div>
    </>
  )
}
