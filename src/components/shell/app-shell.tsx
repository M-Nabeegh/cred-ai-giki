"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, type ReactNode } from "react"
import { BookOpen, Building2, Check, ChevronRight, Database, RotateCcw, ShieldCheck, Smartphone, X } from "lucide-react"
import { useDemo, type TourStep } from "@/lib/demo/store"
import { cn } from "@/lib/utils"
import { Logo } from "../logo"

const workspaces = [
  { key: "customer", label: "Customer app", short: "Customer", icon: Smartphone, href: "/customer", who: "Ayesha Khan", role: "Customer" },
  { key: "lender", label: "Lender console", short: "Lender", icon: Building2, href: "/lender", who: "Sara Mirza", role: "Credit analyst" },
  { key: "platform", label: "Platform", short: "Platform", icon: ShieldCheck, href: "/platform", who: "Platform team", role: "Model risk" },
] as const

const nav: Record<(typeof workspaces)[number]["key"], Array<{ href: string; label: string }>> = {
  customer: [
    { href: "/customer", label: "Overview" },
    { href: "/customer/apply", label: "Apply for a loan" },
    { href: "/customer/data", label: "My data" },
  ],
  lender: [
    { href: "/lender", label: "Overview" },
    { href: "/lender/applications", label: "Applications" },
    { href: "/lender/policy", label: "Policy" },
  ],
  platform: [
    { href: "/platform", label: "Model" },
    { href: "/platform/data", label: "Data sources" },
    { href: "/platform/audit", label: "Audit log" },
  ],
}

const tourSteps: Array<{ id: TourStep; label: string; href: string }> = [
  { id: "score", label: "See a score and its reasons", href: "/customer" },
  { id: "consent", label: "Switch a data source off", href: "/customer" },
  { id: "apply", label: "Apply for a loan", href: "/customer/apply" },
  { id: "review", label: "Decide it as the lender", href: "/lender/applications" },
  { id: "policy", label: "Tighten the credit policy", href: "/lender/policy" },
  { id: "model", label: "Inspect the model card", href: "/platform" },
]

function Tour() {
  const { state, actions } = useDemo()
  const pathname = usePathname()
  useEffect(() => {
    if (pathname === "/customer") actions.markTour("score")
    if (pathname === "/platform") actions.markTour("model")
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])
  if (state.tourHidden) return null
  const done = tourSteps.filter((step) => state.tour.includes(step.id)).length
  return (
    <div className="rounded-xl border border-line bg-surface p-3">
      <div className="flex items-center justify-between">
        <div className="text-[13px] font-semibold">Guided demo</div>
        <button onClick={() => actions.setTourHidden(true)} className="rounded p-0.5 text-ink-3 hover:bg-surface-2 hover:text-ink" aria-label="Hide guided demo"><X className="h-3.5 w-3.5" /></button>
      </div>
      <div className="mt-2 h-1 rounded-full bg-surface-2"><div className="h-1 rounded-full bg-ink transition-all" style={{ width: `${(done / tourSteps.length) * 100}%` }} /></div>
      <ol className="mt-2 space-y-0.5">
        {tourSteps.map((step, index) => {
          const complete = state.tour.includes(step.id)
          return (
            <li key={step.id}>
              <Link href={step.href} className="flex items-center gap-2 rounded-md px-1 py-1 text-[13px] hover:bg-surface-2">
                <span className={cn("grid h-4 w-4 shrink-0 place-items-center rounded-full text-[10px] font-semibold", complete ? "bg-ink text-bg" : "border border-line-strong text-ink-3")}>{complete ? <Check className="h-2.5 w-2.5" strokeWidth={3} /> : index + 1}</span>
                <span className={complete ? "text-ink-3 line-through decoration-ink-3/40" : "text-ink-2"}>{step.label}</span>
              </Link>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

export function AppShell({ provider, children }: { provider: { kind: string; label: string }; children: ReactNode }) {
  const pathname = usePathname()
  const { actions, state } = useDemo()
  const current = workspaces.find((workspace) => pathname.startsWith(workspace.href)) ?? workspaces[0]
  const items = nav[current.key]
  const isActive = (href: string) => (href === current.href ? pathname === href : pathname.startsWith(href))

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[256px_1fr]">
      <aside className="sticky top-0 hidden h-screen flex-col border-r border-line bg-surface px-3 py-4 lg:flex">
        <Link href="/" className="px-2"><Logo /></Link>
        <div className="mt-5 space-y-0.5">
          {workspaces.map((workspace) => {
            const Icon = workspace.icon
            const active = workspace.key === current.key
            return (
              <Link key={workspace.key} href={workspace.href} className={cn("flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm", active ? "bg-surface-2 font-medium text-ink" : "text-ink-2 hover:bg-surface-2/60 hover:text-ink")}>
                <Icon className="h-4 w-4" />
                {workspace.label}
              </Link>
            )
          })}
        </div>
        <div className="mt-5 border-t border-line pt-4">
          <div className="px-2 text-xs font-medium text-ink-3">{current.label}</div>
          <nav className="mt-1.5 space-y-0.5" aria-label={current.label}>
            {items.map((item) => (
              <Link key={item.href} href={item.href} className={cn("flex items-center justify-between rounded-lg px-2 py-1.5 text-sm", isActive(item.href) ? "font-medium text-ink" : "text-ink-2 hover:text-ink")}>
                <span className="flex items-center gap-2"><span className={cn("h-4 w-0.5 rounded-full", isActive(item.href) ? "bg-ink" : "bg-transparent")} />{item.label}</span>
                {item.href === "/lender/applications" && state.submitted.length ? <span className="rounded-full bg-accent px-1.5 text-[11px] font-semibold text-white">{state.submitted.filter((app) => !state.decisions[app.id]).length || ""}</span> : null}
              </Link>
            ))}
          </nav>
        </div>
        <div className="mt-auto space-y-3">
          <Tour />
          <div className="space-y-1 px-2 text-xs text-ink-3">
            <div className="flex items-center gap-1.5"><Database className="h-3.5 w-3.5" /><span className="truncate">{provider.label}</span>{provider.kind === "synthetic" ? null : <span className="h-1.5 w-1.5 rounded-full bg-good" />}</div>
            <Link href="/developers" className="flex items-center gap-1.5 hover:text-ink"><BookOpen className="h-3.5 w-3.5" />API reference</Link>
            <button onClick={() => { if (confirm("Reset all demo decisions, applications and settings in this browser?")) actions.reset() }} className="flex items-center gap-1.5 hover:text-ink"><RotateCcw className="h-3.5 w-3.5" />Reset demo</button>
          </div>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-20 border-b border-line bg-surface/90 backdrop-blur lg:hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <Link href="/"><Logo /></Link>
            <div className="flex gap-1">
              {workspaces.map((workspace) => {
                const Icon = workspace.icon
                return <Link key={workspace.key} href={workspace.href} aria-label={workspace.label} className={cn("grid h-8 w-8 place-items-center rounded-lg", workspace.key === current.key ? "bg-ink text-bg" : "text-ink-2")}><Icon className="h-4 w-4" /></Link>
              })}
            </div>
          </div>
          <nav className="flex gap-1 overflow-x-auto px-3 pb-2">
            {items.map((item) => <Link key={item.href} href={item.href} className={cn("whitespace-nowrap rounded-full px-3 py-1 text-[13px]", isActive(item.href) ? "bg-surface-2 font-medium" : "text-ink-2")}>{item.label}</Link>)}
          </nav>
        </header>
        <div className="hidden items-center justify-between border-b border-line px-8 py-3 lg:flex">
          <div className="flex items-center gap-1.5 text-[13px] text-ink-3">
            {current.label}<ChevronRight className="h-3.5 w-3.5" /><span className="text-ink">{items.find((item) => isActive(item.href))?.label ?? "Detail"}</span>
          </div>
          <div className="flex items-center gap-2 text-[13px]">
            <span className="text-ink-3">Signed in as</span>
            <span className="font-medium">{current.who}</span>
            <span className="rounded-md bg-surface-2 px-1.5 py-0.5 text-xs text-ink-2">{current.role}</span>
          </div>
        </div>
        <main className="mx-auto max-w-[1180px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  )
}

export function PageHeader({ title, description, actions }: { title: ReactNode; description?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-[26px] font-semibold tracking-[-0.025em]">{title}</h1>
        {description ? <p className="mt-1 max-w-2xl text-sm text-ink-2">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  )
}
