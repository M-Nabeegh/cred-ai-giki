"use client"

import { useCallback, useEffect, useState } from "react"
import { RefreshCw } from "lucide-react"
import type { ProviderHealth } from "@/lib/data/types"
import { Badge, Button } from "../ui"

async function fetchHealth(): Promise<ProviderHealth> {
  try {
    const response = await fetch("/api/v1/health", { cache: "no-store" })
    return ((await response.json()) as { data: ProviderHealth }).data
  } catch {
    return { ok: false, provider: "unknown", detail: "Could not reach /api/v1/health", latencyMs: 0, customers: 0, rejected: 0 }
  }
}

export function HealthCheck() {
  const [health, setHealth] = useState<ProviderHealth | null>(null)
  const [busy, setBusy] = useState(true)
  const [checkedAt, setCheckedAt] = useState<string | null>(null)
  const apply = useCallback((next: ProviderHealth) => {
    setHealth(next)
    setCheckedAt(new Date().toLocaleTimeString())
    setBusy(false)
  }, [])
  const run = () => {
    setBusy(true)
    void fetchHealth().then(apply)
  }
  useEffect(() => {
    let active = true
    void fetchHealth().then((next) => active && apply(next))
    return () => { active = false }
  }, [apply])

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${health === null ? "bg-ink-3" : health.ok ? "bg-good" : "bg-bad"}`} />
          <span className="text-sm font-medium">{health === null ? "Checking…" : health.ok ? "Connected" : "Unreachable"}</span>
          {health ? <Badge>{health.provider}</Badge> : null}
        </div>
        <Button variant="secondary" size="sm" onClick={run} disabled={busy}><RefreshCw className={`h-3.5 w-3.5 ${busy ? "animate-spin" : ""}`} />Run check</Button>
      </div>
      {health ? (
        <dl className="mt-4 grid grid-cols-3 gap-3 text-sm">
          <div className="rounded-lg bg-surface-2 p-3"><dt className="text-[13px] text-ink-3">Customers</dt><dd className="font-semibold tnum">{health.customers}</dd></div>
          <div className="rounded-lg bg-surface-2 p-3"><dt className="text-[13px] text-ink-3">Rejected records</dt><dd className="font-semibold tnum">{health.rejected}</dd></div>
          <div className="rounded-lg bg-surface-2 p-3"><dt className="text-[13px] text-ink-3">Latency</dt><dd className="font-semibold tnum">{health.latencyMs} ms</dd></div>
        </dl>
      ) : null}
      {health ? <p className="mt-3 text-[13px] text-ink-3">{health.detail}{checkedAt ? ` Checked at ${checkedAt}.` : ""}</p> : null}
    </div>
  )
}
