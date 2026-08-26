"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState, type ReactNode } from "react"
import { canAccessWorkspace, roleLabels, type Role } from "@/lib/permissions"

const defaultRoleByWorkspace = {
  customer: "customer",
  bank: "bank_analyst",
  admin: "admin",
} as const

export function DemoRouteGuard({ workspace, children }: { workspace: "customer" | "bank" | "admin"; children: ReactNode }) {
  const [role, setRole] = useState<Role | null>(null)

  useEffect(() => {
    const storedRole = localStorage.getItem("credai_role") as Role | null
    setRole(storedRole ?? defaultRoleByWorkspace[workspace])
  }, [workspace])

  if (!role) {
    return <div className="p-8 text-slate-200">Loading demo session...</div>
  }

  if (!canAccessWorkspace(role, workspace)) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center px-6 text-center">
        <div className="rounded-full border border-amber-300/40 bg-amber-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-amber-200">
          Safe demo access check
        </div>
        <h1 className="mt-6 text-3xl font-semibold text-white">This workspace is not available for {roleLabels[role]}.</h1>
        <p className="mt-4 text-slate-300">
          The prototype uses a local role selector to demonstrate authorization boundaries. Choose an appropriate demo role from the login page.
        </p>
        <Link href="/login" className="mt-6 rounded-xl bg-teal-400 px-5 py-3 text-sm font-semibold text-slate-950">
          Open demo login
        </Link>
      </div>
    )
  }

  return <>{children}</>
}

export function WorkspaceShell({
  workspace,
  title,
  description,
  navItems,
  children,
}: {
  workspace: "customer" | "bank" | "admin"
  title: string
  description: string
  navItems: Array<{ href: string; label: string }>
  children: ReactNode
}) {
  const pathname = usePathname()
  const defaultRole = defaultRoleByWorkspace[workspace]

  return (
    <DemoRouteGuard workspace={workspace}>
      <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(45,212,191,0.18),transparent_32%),linear-gradient(135deg,#020617,#0f172a_50%,#111827)] text-slate-100">
        <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r border-white/10 bg-slate-950/80 p-6 backdrop-blur-xl lg:block">
          <Link href="/" className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-teal-400 text-lg font-black text-slate-950">C</div>
            <div>
              <div className="text-lg font-bold">CredAI</div>
              <div className="text-xs text-slate-400">Synthetic fintech prototype</div>
            </div>
          </Link>
          <div className="mt-6 flex flex-wrap gap-2">
            <span className="rounded-full border border-teal-300/40 bg-teal-300/10 px-3 py-1 text-xs font-semibold text-teal-100">Demo Mode</span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">{roleLabels[defaultRole]}</span>
          </div>
          <nav className="mt-8 space-y-2" aria-label={`${workspace} navigation`}>
            {navItems.map((item) => {
              const active = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block rounded-xl px-4 py-3 text-sm transition ${active ? "bg-teal-400 text-slate-950" : "text-slate-300 hover:bg-white/10 hover:text-white"}`}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>
          <p className="absolute bottom-6 left-6 right-6 text-xs leading-5 text-slate-500">
            CredAI does not provide a real credit score, financial advice, loan approval, or credit decision.
          </p>
        </aside>
        <main className="lg:pl-72">
          <div className="border-b border-white/10 bg-slate-950/40 px-4 py-4 backdrop-blur lg:hidden">
            <Link href="/" className="font-semibold text-white">CredAI</Link>
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              {navItems.map((item) => <Link key={item.href} href={item.href} className="whitespace-nowrap rounded-full bg-white/10 px-3 py-1 text-xs text-slate-200">{item.label}</Link>)}
            </div>
          </div>
          <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <div className="mb-3 flex flex-wrap gap-2">
                  <span className="rounded-full border border-teal-300/40 bg-teal-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-teal-100">Synthetic Data</span>
                  <span className="rounded-full border border-amber-300/40 bg-amber-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-amber-100">Human Review Required</span>
                </div>
                <h1 className="text-3xl font-bold tracking-tight text-white md:text-5xl">{title}</h1>
                <p className="mt-3 max-w-3xl text-slate-300">{description}</p>
              </div>
              <Link href="/login" className="rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-200 hover:bg-white/10">Switch demo role</Link>
            </header>
            {children}
          </section>
        </main>
      </div>
    </DemoRouteGuard>
  )
}

export function MetricCard({ label, value, detail, tone = "teal" }: { label: string; value: string; detail: string; tone?: "teal" | "amber" | "red" | "blue" }) {
  const tones = {
    teal: "border-teal-300/20 bg-teal-300/10 text-teal-100",
    amber: "border-amber-300/20 bg-amber-300/10 text-amber-100",
    red: "border-red-300/20 bg-red-300/10 text-red-100",
    blue: "border-sky-300/20 bg-sky-300/10 text-sky-100",
  }
  return (
    <div className={`rounded-2xl border p-5 ${tones[tone]}`}>
      <div className="text-sm text-slate-300">{label}</div>
      <div className="mt-2 text-3xl font-bold text-white">{value}</div>
      <div className="mt-2 text-sm text-slate-400">{detail}</div>
    </div>
  )
}

export function ScoreRing({ score, band }: { score: number; band: string }) {
  const percent = Math.round(((score - 300) / 550) * 100)
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 text-center shadow-2xl shadow-slate-950/40">
      <div
        className="mx-auto grid h-44 w-44 place-items-center rounded-full"
        style={{ background: `conic-gradient(#2dd4bf ${percent}%, rgba(255,255,255,0.1) ${percent}% 100%)` }}
        aria-label={`Demo score ${score} out of 850`}
      >
        <div className="grid h-32 w-32 place-items-center rounded-full bg-slate-950">
          <div>
            <div className="text-5xl font-black text-white">{score}</div>
            <div className="text-xs uppercase tracking-[0.25em] text-slate-400">300–850</div>
          </div>
        </div>
      </div>
      <div className="mt-5 text-lg font-semibold text-teal-100">{band}</div>
      <p className="mt-2 text-sm text-slate-400">Demo profile band, not a bureau risk grade.</p>
    </div>
  )
}
