"use client"

import { Bar, BarChart, CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis, type TooltipContentProps } from "recharts"
import { monthLabel, pkr } from "@/lib/format"

const axis = { stroke: "var(--axis)", tick: { fill: "var(--ink-3)", fontSize: 12 }, tickLine: false }
const grid = { stroke: "var(--grid)", vertical: false }

type Row = { label: string; value: string; color?: string }

function TooltipBox({ title, rows }: { title: string; rows: Row[] }) {
  return (
    <div className="min-w-36 rounded-lg border border-line bg-surface px-3 py-2 text-[13px] shadow-lg">
      <div className="mb-1 font-medium">{title}</div>
      {rows.map((row) => (
        <div key={row.label} className="flex items-center justify-between gap-4 text-ink-2">
          <span className="flex items-center gap-1.5">{row.color ? <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: row.color }} /> : null}{row.label}</span>
          <span className="font-medium text-ink tnum">{row.value}</span>
        </div>
      ))}
    </div>
  )
}

export function Legend({ items }: { items: Array<{ label: string; color: string; line?: boolean }> }) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-ink-2">
      {items.map((item) => (
        <span key={item.label} className="flex items-center gap-1.5">
          <span className={item.line ? "h-0.5 w-3 rounded" : "h-2.5 w-2.5 rounded-[3px]"} style={{ backgroundColor: item.color }} />
          {item.label}
        </span>
      ))}
    </div>
  )
}

export function CashflowChart({ data, height = 220 }: { data: Array<{ month: string; inflow: number; outflow: number }>; height?: number }) {
  return (
    <div>
      <Legend items={[{ label: "Money in", color: "var(--s1)" }, { label: "Money out", color: "var(--s2)" }]} />
      <div style={{ height }} className="mt-3">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barGap={2} barCategoryGap="22%" margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
            <CartesianGrid {...grid} />
            <XAxis dataKey="month" tickFormatter={monthLabel} {...axis} />
            <YAxis tickFormatter={(value: number) => (value >= 1000 ? `${Math.round(value / 1000)}k` : String(value))} {...axis} axisLine={false} width={40} />
            <Tooltip cursor={{ fill: "var(--surface-2)" }} content={({ active, payload, label }: TooltipContentProps<number, string>) => active && payload?.length ? <TooltipBox title={monthLabel(String(label))} rows={[{ label: "Money in", value: pkr(payload[0].value as number), color: "var(--s1)" }, { label: "Money out", value: pkr(payload[1]?.value as number), color: "var(--s2)" }, { label: "Net", value: pkr((payload[0].value as number) - ((payload[1]?.value as number) ?? 0)) }]} /> : null} />
            <Bar isAnimationActive={false} dataKey="inflow" fill="var(--s1)" radius={[4, 4, 0, 0]} maxBarSize={18} />
            <Bar isAnimationActive={false} dataKey="outflow" fill="var(--s2)" radius={[4, 4, 0, 0]} maxBarSize={18} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export function ScoreHistoryChart({ data, height = 140 }: { data: Array<{ month: string; score: number }>; height?: number }) {
  const min = Math.max(300, Math.floor((Math.min(...data.map((d) => d.score)) - 30) / 10) * 10)
  const max = Math.min(850, Math.ceil((Math.max(...data.map((d) => d.score)) + 30) / 10) * 10)
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 4 }}>
          <CartesianGrid {...grid} />
          <XAxis dataKey="month" tickFormatter={monthLabel} {...axis} />
          <YAxis domain={[min, max]} {...axis} axisLine={false} width={36} />
          <Tooltip cursor={{ stroke: "var(--axis)" }} content={({ active, payload, label }: TooltipContentProps<number, string>) => active && payload?.length ? <TooltipBox title={monthLabel(String(label))} rows={[{ label: "Score", value: String(payload[0].value) }]} /> : null} />
          <Line type="monotone" dataKey="score" stroke="var(--s1)" strokeWidth={2} isAnimationActive={false} dot={{ r: 3.5, fill: "var(--s1)", stroke: "var(--surface)", strokeWidth: 2 }} activeDot={{ r: 5, stroke: "var(--surface)", strokeWidth: 2 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export function ScoreDistributionChart({ data, cut, height = 220 }: { data: Array<{ bucket: number; repaid: number; defaulted: number }>; cut?: number; height?: number }) {
  return (
    <div>
      <Legend items={[{ label: "Repaid", color: "var(--s1)" }, { label: "Defaulted", color: "var(--s2)" }]} />
      <div style={{ height }} className="mt-3">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barCategoryGap="12%" margin={{ top: 12, right: 4, bottom: 0, left: 4 }}>
            <CartesianGrid {...grid} />
            <XAxis dataKey="bucket" {...axis} />
            <YAxis {...axis} axisLine={false} width={32} />
            <Tooltip cursor={{ fill: "var(--surface-2)" }} content={({ active, payload, label }: TooltipContentProps<number, string>) => active && payload?.length ? <TooltipBox title={`Score ${label}–${Number(label) + 49}`} rows={[{ label: "Repaid", value: String(payload[0].value), color: "var(--s1)" }, { label: "Defaulted", value: String(payload[1]?.value), color: "var(--s2)" }]} /> : null} />
            {cut ? <ReferenceLine x={Math.floor(cut / 50) * 50} stroke="var(--ink-2)" strokeWidth={1} label={{ value: `Approve ≥ ${cut}`, position: "insideTopRight", fill: "var(--ink-2)", fontSize: 12 }} /> : null}
            <Bar isAnimationActive={false} dataKey="repaid" stackId="a" fill="var(--s1)" stroke="var(--surface)" strokeWidth={1} />
            <Bar isAnimationActive={false} dataKey="defaulted" stackId="a" fill="var(--s2)" stroke="var(--surface)" strokeWidth={1} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export function PortfolioHistogram({ scores, height = 200 }: { scores: number[]; height?: number }) {
  const data = Array.from({ length: 11 }, (_, i) => 300 + i * 50).map((bucket) => ({ bucket, count: scores.filter((s) => s >= bucket && s < bucket + 50).length })).filter((row) => row.bucket >= 400)
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} barCategoryGap="14%" margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
          <CartesianGrid {...grid} />
          <XAxis dataKey="bucket" {...axis} />
          <YAxis allowDecimals={false} {...axis} axisLine={false} width={28} />
          <Tooltip cursor={{ fill: "var(--surface-2)" }} content={({ active, payload, label }: TooltipContentProps<number, string>) => active && payload?.length ? <TooltipBox title={`Score ${label}–${Number(label) + 49}`} rows={[{ label: "Customers", value: String(payload[0].value) }]} /> : null} />
          <Bar isAnimationActive={false} dataKey="count" fill="var(--s1)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function RocChart({ data, auc, height = 260 }: { data: Array<{ fpr: number; tpr: number }>; auc: number; height?: number }) {
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, bottom: 16, left: 4 }}>
          <CartesianGrid stroke="var(--grid)" />
          <XAxis dataKey="fpr" type="number" domain={[0, 1]} ticks={[0, 0.25, 0.5, 0.75, 1]} {...axis} label={{ value: "False positive rate", position: "insideBottom", offset: -10, fill: "var(--ink-3)", fontSize: 12 }} />
          <YAxis dataKey="tpr" type="number" domain={[0, 1]} ticks={[0, 0.25, 0.5, 0.75, 1]} {...axis} axisLine={false} width={36} />
          <ReferenceLine segment={[{ x: 0, y: 0 }, { x: 1, y: 1 }]} stroke="var(--axis)" />
          <Tooltip cursor={{ stroke: "var(--axis)" }} content={({ active, payload }: TooltipContentProps<number, string>) => active && payload?.length ? <TooltipBox title={`AUC ${auc.toFixed(3)}`} rows={[{ label: "True positive", value: (payload[0].payload.tpr as number).toFixed(2) }, { label: "False positive", value: (payload[0].payload.fpr as number).toFixed(2) }]} /> : null} />
          <Line dataKey="tpr" type="linear" stroke="var(--s1)" strokeWidth={2} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export function CalibrationChart({ data, height = 260 }: { data: Array<{ bin: string; predicted: number; observed: number; count: number }>; height?: number }) {
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 8, right: 12, bottom: 16, left: 4 }}>
          <CartesianGrid stroke="var(--grid)" />
          <XAxis dataKey="predicted" type="number" domain={[0, 1]} ticks={[0, 0.25, 0.5, 0.75, 1]} {...axis} label={{ value: "Predicted repayment rate", position: "insideBottom", offset: -10, fill: "var(--ink-3)", fontSize: 12 }} />
          <YAxis dataKey="observed" type="number" domain={[0, 1]} ticks={[0, 0.25, 0.5, 0.75, 1]} {...axis} axisLine={false} width={36} />
          <ZAxis dataKey="count" range={[60, 260]} />
          <ReferenceLine segment={[{ x: 0, y: 0 }, { x: 1, y: 1 }]} stroke="var(--axis)" />
          <Tooltip cursor={false} content={({ active, payload }: TooltipContentProps<number, string>) => active && payload?.length ? <TooltipBox title={`Predicted ${payload[0].payload.bin}`} rows={[{ label: "Predicted", value: `${Math.round(payload[0].payload.predicted * 100)}%` }, { label: "Observed", value: `${Math.round(payload[0].payload.observed * 100)}%` }, { label: "Customers", value: String(payload[0].payload.count) }]} /> : null} />
          <Scatter isAnimationActive={false} data={data} fill="var(--s1)" stroke="var(--surface)" strokeWidth={2} />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  )
}

export function HorizontalBars({ data, digits = 2, height }: { data: Array<{ label: string; value: number }>; digits?: number; height?: number }) {
  return (
    <div style={{ height: height ?? data.length * 30 + 10 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 40, bottom: 0, left: 0 }} barCategoryGap="22%">
          <XAxis type="number" hide domain={[(min: number) => Math.min(0, min), (max: number) => Math.max(0, max)]} />
          <YAxis type="category" dataKey="label" width={190} tick={{ fill: "var(--ink-2)", fontSize: 12 }} tickLine={false} axisLine={false} />
          <ReferenceLine x={0} stroke="var(--axis)" />
          <Tooltip cursor={{ fill: "var(--surface-2)" }} content={({ active, payload }: TooltipContentProps<number, string>) => active && payload?.length ? <TooltipBox title={String(payload[0].payload.label)} rows={[{ label: "Weight", value: (payload[0].value as number).toFixed(digits) }]} /> : null} />
          <Bar dataKey="value" radius={4} isAnimationActive={false} shape={(props: unknown) => {
            const { x, y, width, height: h, value } = props as { x: number; y: number; width: number; height: number; value: number }
            const left = width < 0 ? x + width : x
            return <rect x={left} y={y} width={Math.abs(width)} height={h} rx={3} fill={value >= 0 ? "var(--s1)" : "var(--neg)"} />
          }} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
