import Link from "next/link"
import type { ComponentProps, ReactNode } from "react"
import { cn } from "@/lib/utils"
import { initials } from "@/lib/format"

type ButtonVariant = "primary" | "secondary" | "ghost" | "good" | "bad"
const buttonBase = "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors disabled:pointer-events-none disabled:opacity-45 whitespace-nowrap"
const buttonVariants: Record<ButtonVariant, string> = {
  primary: "bg-ink text-bg hover:bg-ink/85",
  secondary: "border border-line-strong bg-surface text-ink hover:bg-surface-2",
  ghost: "text-ink-2 hover:bg-surface-2 hover:text-ink",
  good: "bg-good-ink text-white hover:bg-good-ink/90",
  bad: "border border-bad/40 bg-surface text-bad-ink hover:bg-bad-soft",
}
const buttonSizes = { sm: "h-8 px-3 text-[13px]", md: "h-9 px-3.5 text-sm", lg: "h-11 px-5 text-[15px]" }

export function buttonClass(variant: ButtonVariant = "primary", size: keyof typeof buttonSizes = "md", className?: string) {
  return cn(buttonBase, buttonVariants[variant], buttonSizes[size], className)
}

export function Button({ variant = "primary", size = "md", className, ...props }: ComponentProps<"button"> & { variant?: ButtonVariant; size?: keyof typeof buttonSizes }) {
  return <button className={buttonClass(variant, size, className)} {...props} />
}

export function ButtonLink({ variant = "primary", size = "md", className, ...props }: ComponentProps<typeof Link> & { variant?: ButtonVariant; size?: keyof typeof buttonSizes }) {
  return <Link className={buttonClass(variant, size, className)} {...props} />
}

export function Card({ className, children, ...props }: ComponentProps<"section">) {
  return <section className={cn("rounded-xl border border-line bg-surface", className)} {...props}>{children}</section>
}

export function CardHeader({ title, description, action, className }: { title: ReactNode; description?: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-start justify-between gap-4 px-5 pt-4", className)}>
      <div className="min-w-0">
        <h2 className="text-[15px] font-semibold tracking-[-0.01em]">{title}</h2>
        {description ? <p className="mt-0.5 text-[13px] text-ink-3">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  )
}

export type Tone = "neutral" | "good" | "warn" | "bad" | "info"
const toneClasses: Record<Tone, string> = {
  neutral: "bg-surface-2 text-ink-2",
  good: "bg-good-soft text-good-ink",
  warn: "bg-warn-soft text-warn-ink",
  bad: "bg-bad-soft text-bad-ink",
  info: "bg-accent-soft text-accent",
}

export function Badge({ tone = "neutral", className, children }: { tone?: Tone; className?: string; children: ReactNode }) {
  return <span className={cn("inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium whitespace-nowrap", toneClasses[tone], className)}>{children}</span>
}

export function Stat({ label, value, detail, className }: { label: string; value: ReactNode; detail?: ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-xl border border-line bg-surface px-4 py-3.5", className)}>
      <div className="text-[13px] text-ink-3">{label}</div>
      <div className="mt-1 text-2xl font-semibold tracking-[-0.02em]">{value}</div>
      {detail ? <div className="mt-0.5 text-[13px] text-ink-3">{detail}</div> : null}
    </div>
  )
}

export function Switch({ checked, onChange, label, disabled }: { checked: boolean; onChange: (next: boolean) => void; label: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn("relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors disabled:opacity-40", checked ? "bg-ink" : "bg-line-strong")}
    >
      <span className={cn("inline-block h-4 w-4 rounded-full bg-surface shadow-sm transition-transform", checked ? "translate-x-[18px]" : "translate-x-0.5")} />
    </button>
  )
}

export function Segmented<T extends string>({ value, options, onChange, className }: { value: T; options: Array<{ value: T; label: ReactNode }>; onChange: (value: T) => void; className?: string }) {
  return (
    <div className={cn("inline-flex rounded-lg border border-line bg-surface-2 p-0.5", className)} role="tablist">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="tab"
          aria-selected={value === option.value}
          onClick={() => onChange(option.value)}
          className={cn("rounded-md px-2.5 py-1 text-[13px] font-medium whitespace-nowrap transition-colors", value === option.value ? "bg-surface text-ink shadow-sm" : "text-ink-3 hover:text-ink")}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

export function Avatar({ name, className }: { name: string; className?: string }) {
  return <span className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-full bg-surface-2 text-xs font-semibold text-ink-2", className)}>{initials(name)}</span>
}

export function Field({ label, hint, children }: { label: string; hint?: ReactNode; children: ReactNode }) {
  return (
    <label className="block">
      <span className="flex items-baseline justify-between text-[13px] font-medium text-ink-2">
        {label}
        {hint ? <span className="font-normal text-ink-3">{hint}</span> : null}
      </span>
      <span className="mt-1.5 block">{children}</span>
    </label>
  )
}

export const inputClass = "h-9 w-full rounded-lg border border-line-strong bg-surface px-3 text-sm text-ink placeholder:text-ink-3 focus:border-ink focus:outline-none"

export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-line-strong px-6 py-10 text-center">
      <div className="text-sm font-medium">{title}</div>
      {children ? <div className="mt-1 text-[13px] text-ink-3">{children}</div> : null}
    </div>
  )
}
