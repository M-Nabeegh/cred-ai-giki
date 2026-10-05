import { Banknote, Check, CircleAlert, Landmark, ReceiptText, Smartphone, Wallet, X, type LucideIcon } from "lucide-react"
import type { CheckStatus, PolicyCheck, Recommendation } from "@/lib/core/policy"
import type { Contribution, Grade } from "@/lib/core/scorecard"
import { GRADES } from "@/lib/core/scorecard"
import type { SourceKey } from "@/lib/core/schema"
import { cn } from "@/lib/utils"
import { Badge, type Tone } from "./ui"

export const sourceIcons: Record<SourceKey | "profile", LucideIcon> = {
  utility: ReceiptText,
  telecom: Smartphone,
  wallet: Wallet,
  bank: Landmark,
  credit: Banknote,
  profile: Check,
}

const recommendationMeta: Record<Recommendation, { label: string; tone: Tone; icon: LucideIcon }> = {
  approve: { label: "Approve", tone: "good", icon: Check },
  refer: { label: "Refer", tone: "warn", icon: CircleAlert },
  decline: { label: "Decline", tone: "bad", icon: X },
}

export function RecommendationBadge({ value, prefix }: { value: Recommendation; prefix?: string }) {
  const meta = recommendationMeta[value]
  const Icon = meta.icon
  return <Badge tone={meta.tone}><Icon className="h-3 w-3" strokeWidth={2.5} />{prefix ? `${prefix} ` : ""}{meta.label}</Badge>
}

export function gradeTone(grade: Grade): Tone {
  const tone = GRADES.find((entry) => entry.grade === grade)?.tone ?? "neutral"
  return tone === "pos" ? "good" : tone === "neg" ? "bad" : tone
}

export function ScorePill({ score, grade }: { score: number; grade: Grade }) {
  return (
    <span className="inline-flex items-center gap-1.5 tnum">
      <span className="font-semibold">{score}</span>
      <Badge tone={gradeTone(grade)} className="px-1">{grade}</Badge>
    </span>
  )
}

const checkIcon: Record<CheckStatus, { icon: LucideIcon; className: string; label: string }> = {
  pass: { icon: Check, className: "bg-good-soft text-good-ink", label: "Pass" },
  warn: { icon: CircleAlert, className: "bg-warn-soft text-warn-ink", label: "Review" },
  fail: { icon: X, className: "bg-bad-soft text-bad-ink", label: "Fail" },
}

export function PolicyChecks({ checks }: { checks: PolicyCheck[] }) {
  return (
    <ul className="divide-y divide-line">
      {checks.map((check) => {
        const meta = checkIcon[check.status]
        const Icon = meta.icon
        return (
          <li key={check.id} className="flex items-start gap-3 py-2.5">
            <span className={cn("mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full", meta.className)} aria-label={meta.label}>
              <Icon className="h-3 w-3" strokeWidth={2.75} />
            </span>
            <div className="min-w-0">
              <div className="text-sm font-medium">{check.label}</div>
              <div className="text-[13px] text-ink-3">{check.detail}</div>
            </div>
          </li>
        )
      })}
    </ul>
  )
}

/** Semicircular 300–850 gauge with grade boundaries marked on the track. */
export function ScoreGauge({ score, grade, gradeLabel, size = 240, caption }: { score: number; grade: Grade; gradeLabel: string; size?: number; caption?: string }) {
  const width = size
  const height = size * 0.62
  const r = size * 0.42
  const cx = width / 2
  const cy = size * 0.5
  const stroke = size * 0.055
  const angle = (value: number) => Math.PI * (1 - (value - 300) / 550)
  const point = (value: number, radius = r) => [cx + radius * Math.cos(angle(value)), cy - radius * Math.sin(angle(value))]
  const arc = (from: number, to: number) => {
    const [x1, y1] = point(from)
    const [x2, y2] = point(to)
    return `M ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2}`
  }
  const clamped = Math.max(300, Math.min(850, score))
  return (
    <figure className="flex flex-col items-center" aria-label={`Credit score ${score} of 850, grade ${grade} (${gradeLabel})`}>
      <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} className="max-w-full overflow-visible">
        <path d={arc(300, 850)} fill="none" stroke="var(--grid)" strokeWidth={stroke} strokeLinecap="round" />
        <path d={arc(300, clamped)} fill="none" stroke="var(--s1)" strokeWidth={stroke} strokeLinecap="round" />
        {[560, 620, 680, 740].map((value) => {
          const [x1, y1] = point(value, r - stroke * 0.9)
          const [x2, y2] = point(value, r - stroke * 1.6)
          return <line key={value} x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--axis)" strokeWidth={1.5} strokeLinecap="round" />
        })}
        <text x={cx} y={cy - size * 0.06} textAnchor="middle" className="fill-[var(--ink)] tnum" style={{ fontSize: size * 0.2, fontWeight: 650, letterSpacing: "-0.03em" }}>{score}</text>
        <text x={cx} y={cy + size * 0.06} textAnchor="middle" className="fill-[var(--ink-3)]" style={{ fontSize: size * 0.055 }}>{gradeLabel} · Grade {grade}</text>
        <text x={point(300)[0]} y={cy + size * 0.1} textAnchor="middle" className="fill-[var(--ink-3)] tnum" style={{ fontSize: size * 0.045 }}>300</text>
        <text x={point(850)[0]} y={cy + size * 0.1} textAnchor="middle" className="fill-[var(--ink-3)] tnum" style={{ fontSize: size * 0.045 }}>850</text>
      </svg>
      {caption ? <figcaption className="mt-1 text-center text-[13px] text-ink-3">{caption}</figcaption> : null}
    </figure>
  )
}

/**
 * Diverging bars: each feature's points relative to the average applicant.
 * Blue pushes the score up, red pulls it down; missing sources sit at zero.
 */
export function FactorBars({ contributions, limit = 10, showReasons = true }: { contributions: Contribution[]; limit?: number; showReasons?: boolean }) {
  const rows = contributions.filter((item) => !item.missing && Math.abs(item.points) >= 0.5).slice(0, limit)
  const max = Math.max(10, ...rows.map((item) => Math.abs(item.points)))
  return (
    <ul className="space-y-1">
      {rows.map((item) => {
        const Icon = sourceIcons[item.source]
        const width = `${(Math.abs(item.points) / max) * 50}%`
        const positive = item.points >= 0
        return (
          <li key={item.key} className="group rounded-lg px-2 py-2 hover:bg-surface-2">
            <div className="flex items-center gap-3">
              <Icon className="h-4 w-4 shrink-0 text-ink-3" />
              <div className="w-32 shrink-0 truncate text-[13px] font-medium sm:w-52" title={item.label}>{item.label}</div>
              <div className="relative h-4 flex-1" aria-hidden>
                <div className="absolute inset-y-0 left-1/2 w-px bg-axis" style={{ backgroundColor: "var(--axis)" }} />
                <div
                  className="absolute top-0.5 bottom-0.5 rounded-[3px]"
                  style={{ width, left: positive ? "50%" : undefined, right: positive ? undefined : "50%", backgroundColor: positive ? "var(--s1)" : "var(--neg)", marginLeft: positive ? 2 : 0, marginRight: positive ? 0 : 2 }}
                />
              </div>
              <div className={cn("w-12 shrink-0 text-right text-[13px] font-semibold tnum", positive ? "text-ink" : "text-bad-ink")}>{positive ? "+" : "−"}{Math.abs(Math.round(item.points))}</div>
            </div>
            {showReasons ? <p className="mt-0.5 pl-7 text-[13px] text-ink-3">{item.reason}</p> : null}
          </li>
        )
      })}
    </ul>
  )
}
